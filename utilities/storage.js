/*
----
STORAGE + TRIGGERS
----
*/

/**
 * gets current stored configuration
 *
 * @returns {SheetMpConfig | MpSheetConfig | Object}
 */
function getConfig() {
    const scriptProperties = PropertiesService.getDocumentProperties();
    const props = scriptProperties.getProperties();
    return props;
}

/**
 * sets a new stored configuration
 *
 * @param  {SheetMpConfig | MpSheetConfig | Object } config
 * @returns {SheetMpConfig | MpSheetConfig | Object}
 */
function setConfig(config) {
    const scriptProperties = PropertiesService.getDocumentProperties();
    scriptProperties.setProperties(config);

    // @ts-ignore
    // track("save", { record_type: config?.record_type, project_id: config?.project_id });

    return scriptProperties.getProperties();
}
/**
 * adds a single k:v pair to stored configuration
 *
 * @param  {string} key
 * @param  {string} value
 */
function updateConfig(key, value) {
    const scriptProperties = PropertiesService.getDocumentProperties();
    scriptProperties.setProperty(key, value);
    return scriptProperties.getProperties();
}
/**
 * append a value to a config at a key; stringifies list before saving
 *
 * @param  {string} key
 * @param  {string} value
 * @param  {number} [limit] max # of values to store @ key
 */
function appendConfig(key, value, limit = 50) {
    const scriptProperties = PropertiesService.getDocumentProperties();
    const config = scriptProperties.getProperties();
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
    const scriptProperties = PropertiesService.getDocumentProperties();
    scriptProperties.deleteAllProperties();
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
        appendConfig
    };
}
