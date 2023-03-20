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
// ? also pub: https://link.medium.com/qT0PlG3wiyb
// ? scheduling: https://developers.google.com/apps-script/add-ons/concepts/editor-triggers
// ? also scheduler: https://developers.google.com/apps-script/reference/script/clock-trigger-builder
// ? low level scheduler: https://developers.google.com/apps-script/reference/script/trigger
// ? delete triggers: https://stackoverflow.com/a/47217237



/*
----
TODOs
----
*/

// todo: hourly syncs
// todo: display responses somewhere
// todo: docs

/*
----
DEV
----
*/

let track;
try {
	track = track();
}

catch (e) {
	track = () => { }; //noop
}


function repl() {
	return {
		all: SpreadsheetApp.getActive().getSheets().map(sheet => { return { sheetName: sheet.getName(), id: sheet.getSheetId() }; }),
		current: {
			sheetName: SpreadsheetApp.getActiveSheet().getName(),
			id: SpreadsheetApp.getActiveSheet().getSheetId()
		}
	};
}

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
		// track('sheet open', {auth: false})
	} else {
		// script has permissions
		menu.addItem('Sheet → Mixpanel', 'dataInUI');
		menu.addItem('Mixpanel → Sheet', 'dataOutUI');
		// track('sheet open', {auth: true})
	}
	menu.addToUi();
}

/*
----
IMPORT BINDINGS
----
*/

function dataInUI() {
	track('sheet to mixpanel');
	let htmlOutput = HtmlService.createTemplateFromFile('ui/sheet-to-mixpanel.html');

	// vars
	htmlOutput.columns = getHeaders();
	htmlOutput.config = getConfig();
	htmlOutput.sheet = getSheetInfos();

	// apply template
	htmlOutput = htmlOutput
		.evaluate()
		.setWidth(700)
		.setHeight(750);

	// render
	SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Sheet → Mixpanel');
}

function getHeaders() {
	const sheet = SpreadsheetApp.getActiveSheet();
	const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
	const headers = range.getValues()[0]; //.map(str => str.trim());
	return headers;
}

function getSheetInfos() {
	return {
		sheetName: SpreadsheetApp.getActiveSheet().getName(),
		id: SpreadsheetApp.getActiveSheet().getSheetId()
	};
}


function syncNow(config) {
	console.log(config);
	const syncId = Math.random();
	// todo scheduler,,,
	track('sync start', { syncId });
	const ui = SpreadsheetApp.getUi();
	const result = ui.alert(
		'🔄 Sync Now?',
		'your job is now scheduled to run hourly; do you want to run a sync now?',
		ui.ButtonSet.YES_NO);

	if (result == ui.Button.YES) {
		track('sync complete', { syncId });
		setConfig(config);
		const [responses, summary] = importData(config);
		displayImportResults(summary);
		//todo display results in sheet
		return summary;
	} else {
		track('sync canceled', { syncId });
		ui.alert('⏩ Sync Skipped', 'no sync was run! next sync will run within an hour; to delete a sync use the "clear" button in the UI', ui.ButtonSet.OK);
		return config;
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
	track('mixpanel to sheet');
	let htmlOutput = HtmlService.createTemplateFromFile('ui/mixpanel-to-sheet.html');

	// vars
	htmlOutput.config = getConfig();
	htmlOutput.sheet = getSheetInfos();

	// apply template
	htmlOutput = htmlOutput
		.evaluate()
		.setWidth(700)
		.setHeight(500);

	//render
	SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Mixpanel → Sheet');
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
	track('save', { record_type: config.record_type });
	const scriptProperties = PropertiesService.getScriptProperties();
	scriptProperties.setProperties(config);
	return scriptProperties.getProperties();
}

function clearConfig(config) {
	track('clear', { record_type: config.record_type });
	const scriptProperties = PropertiesService.getScriptProperties();
	scriptProperties.deleteAllProperties();
	return scriptProperties.getProperties();
}


/*
----
USER INFO
----
*/


function getUser() {
	const user = Session.getActiveUser().getEmail();
	return user;
}

