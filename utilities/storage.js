/*
----
STORAGE + TRIGGERS
----
*/

// Cached spreadsheet prefix to avoid repeated SpreadsheetApp service calls.
// A GAS execution is a fresh runtime, so this cache is naturally per-execution.
/** @type {string | null} */
let _cachedPrefix = null;

/**
 * Spreadsheet-ID prefix used to scope every config key to the current spreadsheet,
 * so multiple sheets under the same user keep independent config (#45) while staying
 * private to that user (SECOPS-1366). Cached within an execution.
 *
 * @returns {string} `<spreadsheetId>_`
 * @throws {Error} in production if the active spreadsheet cannot be resolved — we must
 *   never silently fall back to an unscoped (global) namespace, which would read/delete
 *   another sheet's config (#45).
 */
function getSheetPrefix() {
    if (_cachedPrefix !== null) {
        return _cachedPrefix;
    }

    try {
        const sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
        _cachedPrefix = sheetId + "_";
        return _cachedPrefix;
    } catch (e) {
        // Local (node) test environment: no GAS services exist at all.
        if (typeof SpreadsheetApp === "undefined") {
            _cachedPrefix = "test_sheet_id_";
            return _cachedPrefix;
        }
        // GAS runtime but no active spreadsheet (should not happen in interactive or
        // trigger contexts). Throw rather than corrupt cross-sheet config.
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error("Cannot determine spreadsheet ID for scoped config: " + msg);
    }
}

/**
 * Clears the cached prefix. Test helper.
 */
function _clearPrefixCache() {
    _cachedPrefix = null;
}

/**
 * Config keys that may exist unprefixed from before the #45 per-sheet migration.
 */
const KNOWN_CONFIG_KEYS = [
    "project_id", "token", "service_secret", "service_account", "service_acct", "auth",
    "record_type", "entity_type", "sheet_id", "dest_sheet", "receipt_sheet",
    "trigger", "config_type", "active_sync", "jql", "cols", "mappings", "recent_projects"
];

/**
 * One-time cleanup of pre-#45 unprefixed config left in the user store.
 *
 * We deliberately do NOT migrate it: before #45 there was a single global namespace,
 * so the leftover keys can't be safely attributed to one spreadsheet. Instead we delete
 * them to remove stale plaintext secrets (e.g. service_secret/auth) and free the
 * 500KB user-property quota. Marked done with `has_purged_legacy` so it runs once.
 *
 * @returns {boolean} true if any legacy keys were removed
 */
function purgeLegacyConfig() {
    const store = PropertiesService.getUserProperties();
    const all = store.getProperties();
    if (all.has_purged_legacy) return false;

    let purged = false;
    for (const key of KNOWN_CONFIG_KEYS) {
        if (Object.prototype.hasOwnProperty.call(all, key)) {
            store.deleteProperty(key);
            purged = true;
        }
    }
    store.setProperty("has_purged_legacy", "true");
    return purged;
}

/**
 * gets the current spreadsheet's stored configuration
 *
 * @returns {SheetMpConfig | MpSheetConfig | Object}
 */
function getConfig() {
    // user-scoped store: credentials are private to the user who saved them, so an
    // editor opening the add-on never reads the owner's service-account secret (SECOPS-1366)
    // sheet-scoped keys: each spreadsheet gets its own config namespace (#45)
    purgeLegacyConfig(); // one-time removal of pre-#45 unprefixed keys

    const store = PropertiesService.getUserProperties();
    const allProps = store.getProperties();
    const prefix = getSheetPrefix();

    // Return only this spreadsheet's keys, with the prefix stripped
    const scopedProps = {};
    for (const key in allProps) {
        if (key.startsWith(prefix)) {
            scopedProps[key.substring(prefix.length)] = allProps[key];
        }
    }
    return scopedProps;
}

/**
 * sets a new stored configuration for the current spreadsheet
 *
 * @param  {SheetMpConfig | MpSheetConfig | Object } config
 * @returns {SheetMpConfig | MpSheetConfig | Object}
 */
function setConfig(config) {
    const store = PropertiesService.getUserProperties();
    const prefix = getSheetPrefix();

    const prefixed = {};
    for (const key in config) {
        prefixed[prefix + key] = config[key];
    }
    store.setProperties(prefixed);

    // @ts-ignore
    // track("save", { record_type: config?.record_type, project_id: config?.project_id });

    return getConfig(); // scoped config for this sheet
}

/**
 * adds a single k:v pair to the current spreadsheet's stored configuration
 *
 * @param  {string} key
 * @param  {string} value
 */
function updateConfig(key, value) {
    const store = PropertiesService.getUserProperties();
    store.setProperty(getSheetPrefix() + key, value);
    return getConfig(); // scoped config for this sheet
}

/**
 * append a value to a config at a key; stringifies list before saving
 *
 * @param  {string} key
 * @param  {string} value
 * @param  {number} [limit] max # of values to store @ key
 */
function appendConfig(key, value, limit = 50) {
    const config = getConfig(); // scoped config for this sheet

    if (config[key]) {
        const currentList = JSON.parse(config[key]);
        currentList.push(value);
        const newList = Array.from(new Set(currentList));
        if (newList.length <= limit) {
            config[key] = JSON.stringify(newList);
        } else {
            // 9KB limit per value; need to clear
            // ? https://developers.google.com/apps-script/guides/services/quotas#current_limitations
            config[key] = JSON.stringify([]);
        }
    } else {
        config[key] = JSON.stringify([value]);
    }

    const newConfig = setConfig(config);
    return newConfig;
}

/**
 * clears the current spreadsheet's stored config & its scheduled trigger(s)
 *
 * @param  {SheetMpConfig & MpSheetConfig} [config]
 * @param  {boolean} [deleteAllSheetTriggers] also delete every trigger bound to this sheet
 * @returns {{}}
 */
function clearConfig(config, deleteAllSheetTriggers = false) {
    const store = PropertiesService.getUserProperties();
    const prefix = getSheetPrefix();

    // Delete only this spreadsheet's keys
    const allProps = store.getProperties();
    for (const key in allProps) {
        if (key.startsWith(prefix)) {
            store.deleteProperty(key);
        }
    }

    clearTriggers(config?.trigger, deleteAllSheetTriggers);

    // @ts-ignore
    // track("clear", { record_type: config?.record_type, project_id: config?.project_id });

    return {};
}

/**
 * deletes scheduled triggers for the CURRENT spreadsheet only.
 *
 * Uses `getUserTriggers(activeSpreadsheet)` — scoped per-user AND per-document — so it
 * can never touch another spreadsheet's syncs. `getProjectTriggers()` must NOT be used
 * here: it returns the user's triggers across ALL their documents (#45).
 *
 * @param {string} [triggerId] delete the trigger with this unique id
 * @param {boolean} [deleteAllForThisSheet] delete every trigger bound to this sheet
 * @returns {{}}
 */
function clearTriggers(triggerId = "", deleteAllForThisSheet = false) {
    // Off-GAS (local node tests): there are no triggers to manage.
    if (typeof ScriptApp === "undefined") return {};

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const syncs = ScriptApp.getUserTriggers(ss);
    for (const sync of syncs) {
        if (deleteAllForThisSheet || (triggerId && sync.getUniqueId() === triggerId)) {
            ScriptApp.deleteTrigger(sync);
        }
    }
    return {};
}

/**
 * lists the current spreadsheet's triggers (per-user + per-document)
 *
 * @returns {Array<{type: string, handler: string, source: string, id: string}>}
 */
function getTriggers() {
    if (typeof ScriptApp === "undefined") return [];

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const triggers = ScriptApp.getUserTriggers(ss);
    return triggers.map(trigger => {
        return {
            type: trigger.getEventType().toString(),
            handler: trigger.getHandlerFunction(),
            source: trigger.getTriggerSource().toString(),
            id: trigger.getUniqueId()
        };
    });
}

if (typeof module !== "undefined") {
    // const { tracker } = require("./tracker.js");
    module.exports = {
        getConfig,
        setConfig,
        clearConfig,
        clearTriggers,
        getTriggers,
        updateConfig,
        appendConfig,
        getSheetPrefix,
        purgeLegacyConfig,
        _clearPrefixCache,
        KNOWN_CONFIG_KEYS
    };
}
