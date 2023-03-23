
/*
----
STORAGE
----
*/

/**
 * gets current stored configuration
 * 
 * @returns {Config}
 */
function getConfig() {
	const scriptProperties = PropertiesService.getScriptProperties().getProperties();
	return scriptProperties;
}

/**
 * sets a new stored configuration
 * 
 * @param  {Config} config
 * @returns {Config}
 */
function setConfig(config) {
	const scriptProperties = PropertiesService.getScriptProperties();
	scriptProperties.setProperties(config);
	track('save', { record_type: config.record_type, token: config.token });
	return scriptProperties.getProperties();
}

/**
 * clears all stored data & scheduled triggers
 * 
 * @param  {Config} config
 * @returns {void}
 */
function clearConfig(config) {
	const scriptProperties = PropertiesService.getScriptProperties();
	scriptProperties.deleteAllProperties();
	clearTriggers();
	track('clear', { record_type: config.record_type, token: config.token });
	return null;

}