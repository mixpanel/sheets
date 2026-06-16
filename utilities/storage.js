/*
----
STORAGE + TRIGGERS
----
*/

// Cached spreadsheet prefix to avoid repeated SpreadsheetApp calls
/** @type {string | null} */
let _cachedPrefix = null;
/**
 * gets the current spreadsheet ID to use as a prefix for scoped config
 * Caches the result to avoid repeated SpreadsheetApp service calls
 *
 * @param {string} [overrideSheetId] - Optional spreadsheet ID for testing
 * @returns {string}
 * @throws {Error} if not in a spreadsheet context (production)
 */
function getSheetPrefix(overrideSheetId) {
    // Allow explicit override for testing
    if (overrideSheetId) {
        return overrideSheetId + "_";
    }

    // Return cached prefix if available
    if (_cachedPrefix !== null) {
        return _cachedPrefix;
    }

    // Try to get the active spreadsheet ID
    try {
        const sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
        _cachedPrefix = sheetId + "_";
        return _cachedPrefix;
    } catch (e) {
        // In production, we should never proceed without a valid prefix
        // Only return test prefix in test environments (no SpreadsheetApp available)
        // @ts-ignore - SpreadsheetApp is a global in GAS runtime
        if (typeof SpreadsheetApp === 'undefined' || typeof module !== "undefined") {
            // Test environment - return test prefix for backward compatibility
            _cachedPrefix = "test_sheet_id_";
            return _cachedPrefix;
        }
        // Production environment - this is a real error, don't silently proceed
        const errorMessage = e instanceof Error ? e.message : String(e);
        throw new Error("Cannot determine spreadsheet ID: " + errorMessage);
    }
}

/**
 * Clears the cached spreadsheet prefix (used in tests)
 */
function _clearPrefixCache() {
    _cachedPrefix = null;
}

/**
 * Known config keys that may exist from before the prefix migration
 */
const KNOWN_CONFIG_KEYS = [
    'project_id', 'token', 'service_secret', 'service_account', 'auth',
    'record_type', 'entity_type', 'sheet_id', 'dest_sheet', 'receipt_sheet',
    'trigger', 'config_type', 'jql', 'cols', 'mappings', 'recent_projects'
];

/**
 * Migrates legacy unprefixed config to the current spreadsheet's prefixed namespace
 * and cleans up the old unprefixed keys to free quota and remove stale secrets
 *
 * @returns {boolean} true if migration occurred
 */
function migrateLegacyConfig() {
    const scriptProperties = PropertiesService.getUserProperties();
    const allProps = scriptProperties.getProperties();

    if(allProps?.has_migrated) {
        return true;
    }
    const prefix = getSheetPrefix();

    // Check if there are any unprefixed config keys (legacy data)
    let foundLegacy = false;
    /** @type {Object<string, string>} */
    const legacyProps = {};
    for (const key of KNOWN_CONFIG_KEYS) {
        if (allProps.hasOwnProperty(key)) {
            foundLegacy = true;
            legacyProps[key] = allProps[key];
        }
    }

    // If no legacy data found, nothing to do
    if (!foundLegacy) {
        scriptProperties.setProperty("has_migrated", "true");
        return false;
    }
    // If the current sheet is the same sheet_id, migrate the legacy config to it
    if (legacyProps.sheet_id && legacyProps.sheet_id ===  prefix.slice(0, -1)) {
        scriptProperties.setProperty("has_migrated", "true");
        setConfig(legacyProps);
    } else {
        return false; // Legacy config exists but doesn't match this sheet
    }

    // Clean up the unprefixed legacy keys (including stale secrets)
    for (const key of KNOWN_CONFIG_KEYS) {
        if (allProps.hasOwnProperty(key)) {
            scriptProperties.deleteProperty(key);
        }
    }

    scriptProperties.setProperty("has_migrated", "true");
    return true;
}

/**
 * gets current stored configuration
 *
 * @returns {SheetMpConfig | MpSheetConfig | Object}
 */
function getConfig() {
    // user-scoped store: credentials are private to the user who saved them, so an
    // editor opening the add-on never reads the owner's service-account secret (SECOPS-1366)
    // sheet-scoped keys: each spreadsheet gets its own config namespace (issue #45)

    // One-time migration of legacy unprefixed config
    migrateLegacyConfig();

    const scriptProperties = PropertiesService.getUserProperties();
    const allProps = scriptProperties.getProperties();
    const prefix = getSheetPrefix();

    // Filter to only properties for this spreadsheet and strip the prefix
    const scopedProps = {};
    for (const key in allProps) {
        if (key.startsWith(prefix)) {
            const unprefixedKey = key.substring(prefix.length);
            scopedProps[unprefixedKey] = allProps[key];
        }
    }

    return scopedProps;
}

/**
 * sets a new stored configuration
 *
 * @param  {SheetMpConfig | MpSheetConfig | Object } config
 * @returns {SheetMpConfig | MpSheetConfig | Object}
 */
function setConfig(config) {
    const scriptProperties = PropertiesService.getUserProperties();
    const prefix = getSheetPrefix();

    // Prefix each key with the spreadsheet ID
    const prefixedConfig = {};
    for (const key in config) {
        prefixedConfig[prefix + key] = config[key];
    }

    scriptProperties.setProperties(prefixedConfig);

    // @ts-ignore
    // track("save", { record_type: config?.record_type, project_id: config?.project_id });

    return getConfig(); // Return the unprefixed config for this sheet
}
/**
 * adds a single k:v pair to stored configuration
 *
 * @param  {string} key
 * @param  {string} value
 */
function updateConfig(key, value) {
    const scriptProperties = PropertiesService.getUserProperties();
    const prefix = getSheetPrefix();

    // Set the property with the appropriate prefix
    scriptProperties.setProperty(prefix + key, value);

    return getConfig(); // Return the unprefixed config for this sheet
}
/**
 * append a value to a config at a key; stringifies list before saving
 *
 * @param  {string} key
 * @param  {string} value
 * @param  {number} [limit] max # of values to store @ key
 */
function appendConfig(key, value, limit = 50) {
    const config = getConfig(); // Get scoped config for this sheet

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
 * clears all stored data & scheduled triggers
 *
 * @param  {SheetMpConfig & MpSheetConfig} [config]
 * @returns {{}}
 */
function clearConfig(config, deleteAllSheetTriggers = false) {
    const scriptProperties = PropertiesService.getUserProperties();
    const prefix = getSheetPrefix();

    // Delete only properties for this spreadsheet
    const allProps = scriptProperties.getProperties();
    for (const key in allProps) {
        if (key.startsWith(prefix)) {
            scriptProperties.deleteProperty(key);
        }
    }

    clearTriggers(config?.trigger, deleteAllSheetTriggers);

    // @ts-ignore
    // track("clear", { record_type: config?.record_type, project_id: config?.project_id });

    return {};
}

/**
 * Clears triggers for the current sheet or a specific trigger
 *
 * @param {string} [triggerId] - specific trigger ID to delete. If not provided, reads from current sheet's config
 * @param {boolean} [deleteAllNotInConfig] - if true, deletes ALL triggers that do not have a matching ID in the config. 
 * @returns {{}}
 */
function clearTriggers(triggerId = "", deleteAllNotInConfig = false) {
    let configValues = new Set();
    if (deleteAllNotInConfig) {
        configValues = new Set(Object.values(getConfig()));
    }

    const syncs = ScriptApp.getProjectTriggers();
    for (const sync of syncs) {
        if (triggerId && sync.getUniqueId() === triggerId) {
            ScriptApp.deleteTrigger(sync);
        } else if (deleteAllNotInConfig && !configValues.has(sync.getUniqueId())) { 
            // DeleteAll is a GOOT if config for a sheet isn't found.
            // The trigger for this sheet might still exist and only one can exist per sheet. So all triggers without a matching config need to be deleted.
            ScriptApp.deleteTrigger(sync);
        }
    }
}

function getTriggers() {
    const triggers = ScriptApp.getProjectTriggers();
    const triggerInfo = triggers.map(trigger => {
        return {
            type: trigger.getEventType().toString(),
            handler: trigger.getHandlerFunction(),
            source: trigger.getTriggerSource().toString(),
            id: trigger.getUniqueId()
        };
    });
    return triggerInfo;
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
        migrateLegacyConfig,
        _clearPrefixCache,
        KNOWN_CONFIG_KEYS
    };
}
