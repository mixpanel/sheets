/*
----
STORAGE + TRIGGERS
----
*/

/**
 * gets the current spreadsheet ID to use as a prefix for scoped config
 *
 * @returns {string}
 */
function getSheetPrefix() {
    try {
        const sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
        return sheetId + "_";
    } catch (e) {
        // If we're not in a spreadsheet context (e.g., running tests locally)
        // return empty prefix to maintain backward compatibility
        return "";
    }
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
    const scriptProperties = PropertiesService.getUserProperties();
    const allProps = scriptProperties.getProperties();
    const prefix = getSheetPrefix();

    // If no prefix (local tests), return all properties for backward compatibility
    if (!prefix) {
        return allProps;
    }

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

    // If no prefix (local tests), set properties directly for backward compatibility
    if (!prefix) {
        scriptProperties.setProperties(config);
        return scriptProperties.getProperties();
    }

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
 * @param {boolean} [deleteAll] clears all triggers too
 * @returns {{}}
 */
function clearConfig(config, deleteAll = false) {
    const scriptProperties = PropertiesService.getUserProperties();
    const prefix = getSheetPrefix();

    // If no prefix (local tests), delete all properties for backward compatibility
    if (!prefix) {
        scriptProperties.deleteAllProperties();
        clearTriggers(config?.trigger, deleteAll);
        return {};
    }

    // Delete only properties for this spreadsheet
    const allProps = scriptProperties.getProperties();
    for (const key in allProps) {
        if (key.startsWith(prefix)) {
            scriptProperties.deleteProperty(key);
        }
    }

    clearTriggers(config?.trigger, deleteAll);

    // @ts-ignore
    // track("clear", { record_type: config?.record_type, project_id: config?.project_id });

    return {};
}

function clearTriggers(triggerId = "", deleteAll = false) {
    const syncs = ScriptApp.getProjectTriggers();
    for (const sync of syncs) {
        if (sync.getUniqueId() === triggerId || deleteAll) {
            ScriptApp.deleteTrigger(sync);
        }
    }
    return {};
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
        getSheetPrefix
    };
}
