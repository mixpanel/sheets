/*
----
STORAGE
----
*/

/**
 * gets current stored configuration
 *
 * @returns {SheetMpConfig | MpSheetConfig}
 */
function getConfig() {
    const scriptProperties = PropertiesService.getScriptProperties();
    const props = scriptProperties.getProperties();
    return props;
}

/**
 * sets a new stored configuration
 *
 * @param  {SheetMpConfig | MpSheetConfig} config
 * @returns {SheetMpConfig | MpSheetConfig}
 */
function setConfig(config) {
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperties(config);
    track("save", { record_type: config?.record_type, token: config?.token });
    return scriptProperties.getProperties();
}

/**
 * clears all stored data & scheduled triggers
 *
 * @param  {SheetMpConfig | MpSheetConfig} config
 * @returns {{}}}
 */
function clearConfig(config) {
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.deleteAllProperties();
    clearTriggers();
    track("clear", { record_type: config?.record_type, token: config?.token });
    return {};
}

if (typeof module !== "undefined") {
    const { tracker } = require("../utilities/tracker.js");
    module.exports = { getConfig, setConfig, clearConfig };
}
