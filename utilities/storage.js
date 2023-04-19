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
    const scriptProperties = PropertiesService.getScriptProperties();
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
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperties(config);

    // @ts-ignore
    track("save", { record_type: config?.record_type, project_id: config?.project_id });

    return scriptProperties.getProperties();
}

/**
 * clears all stored data & scheduled triggers
 *
 * @param  {SheetMpConfig & MpSheetConfig} [config]
 * @returns {{}}
 */
function clearConfig(config) {
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.deleteAllProperties();
    clearTriggers();

    // @ts-ignore
    track("clear", { record_type: config?.record_type, project_id: config?.project_id });

    return {};
}

function clearTriggers() {
    const syncs = ScriptApp.getProjectTriggers();
    for (const sync of syncs) {
        ScriptApp.deleteTrigger(sync);
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
    const { tracker } = require("./tracker.js");
    module.exports = { getConfig, setConfig, clearConfig, clearTriggers, getTriggers };
}
