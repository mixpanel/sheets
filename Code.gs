/**
 * @OnlyCurrentDoc
 */

/*
----
DOCS
----
*/


// ? MODEL https://developers.google.com/apps-script/reference/spreadsheet 
// ? UI https://developers.google.com/apps-script/guides/menus
// ? COMMUNICATION https://developers.google.com/apps-script/guides/html/communication
// ? STORAGE https://developers.google.com/apps-script/guides/properties
// ? PUBLISH https://developers.google.com/apps-script/add-ons/how-tos/publish-add-on-overview
// ? REPL https://github.com/zerobase/gas-repl

/*
----
UI Stuff
----
*/

function onOpen(e) {
	const ui = SpreadsheetApp.getUi();
	const menu = ui.createAddonMenu();
	if (e && e.authMode == ScriptApp.AuthMode.NONE) {
		// script does not have permissions
		menu.addItem('Sheet → Mixpanel', 'dataInUI');
		menu.addItem('Mixpanel → Sheet', 'dataOutUI');
	} else {
		// script has permissions
		menu.addItem('Sheet → Mixpanel', 'dataInUI');
		menu.addItem('Mixpanel → Sheet', 'dataOutUI');
	}
	menu.addToUi();
}

/*
----
IMPORT BINDINGS
----
*/

function dataInUI() {
	let htmlOutput = HtmlService.createTemplateFromFile('ui/sheet-to-mixpanel.html');
	htmlOutput.columns = getHeaders();
	htmlOutput.config = getConfig();
	htmlOutput = htmlOutput
		.evaluate()
		.setWidth(700)
		.setHeight(750);
	SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Sheet → Mixpanel');
}

function getHeaders() {
	const sheet = SpreadsheetApp.getActiveSheet();
	const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
	const headers = range.getValues()[0]; //.map(str => str.trim());
	return headers;
}


function syncNow(config) {
	console.log(config);
	const ui = SpreadsheetApp.getUi();
	const result = ui.alert(
		'🔄 Sync Now?',
		'do you want to run a sync?',
		ui.ButtonSet.YES_NO);

	if (result == ui.Button.YES) {
		setConfig(config);
		importData(config);
	} else {
		ui.alert('❌ Sync Canceled', 'no sync was run!', ui.ButtonSet.OK);
	}
}

function displayImportResults(config) {
	const { results } = config;
	const ui = SpreadsheetApp.getUi();
	const prettyResults = `
	Details:
	-------
		Total: ${comma(results.total)} ${config.record_type}s
		Success: ${comma(results.success)}
		Failed: ${comma(results.failed)}
		Batches: ${comma(results.batches)}
		Duration: ${comma(results.seconds)} seconds
		
	
	${results.errors.length > 0 ? 'see log for errors' : ''}
	`;
	const display = ui.alert('✅ Sync Complete', prettyResults, ui.ButtonSet.OK);
}

function comma(num) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};


/*
----
DISPLAY EXPORT BINDINGS
----
*/


function dataOutUI() {

}


/*
----
STORAGE
----
*/

function getConfig() {
	const scriptProperties = PropertiesService.getScriptProperties().getProperties();
	return scriptProperties;
}

function setConfig(config) {
	const scriptProperties = PropertiesService.getScriptProperties();
	scriptProperties.setProperties(config);
	return scriptProperties.getProperties();
}

function clearConfig() {
	const scriptProperties = PropertiesService.getScriptProperties();
	scriptProperties.deleteAllProperties();
	return scriptProperties.getProperties();
}
