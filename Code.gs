/**
 * @OnlyCurrentDoc
 */

/*
-----------------------------
|	SHEETS MIXPANEL			|
|	a google sheets add-on	|
|	by AK 					|
|	ak@mixpanel.com			|
-----------------------------
*/

/**
 * some important things to know about google apps script
 * 	- there are no modules; every function shares a global namespace
 * 	- 'Types' are declared in Types.gs
 */


// "globally" safe to call anywhere
const track = tracker();


/*
----
TODOs
----
*/

// todo: display responses somewhere
// todo: hourly syncs
// todo: docs



/*
----
MENUS
----
*/

/**
 * the main entry point to the application
 * called when the sheet is opened by any user
 * populates the menu the user sees; runs with different levels of permission
 * 
 * @param  {GoogleAppsScript.Events.SheetsOnOpen} sheetOpenEv event for "sheet is open"
 * @returns {void}
 */
function onOpen(sheetOpenEv) {
	const ui = SpreadsheetApp.getUi();
	const menu = ui.createAddonMenu();
	if (sheetOpenEv && sheetOpenEv.authMode == ScriptApp.AuthMode.NONE) {
		// app does not have permissions to do things
		// this occurs when a user is viewing the document and has not authorized the extension
		// ? https://developers.google.com/apps-script/add-ons/concepts/editor-auth-lifecycle		
		menu.addItem('Sheet → Mixpanel', 'dataInUI');
		menu.addItem('Mixpanel → Sheet', 'dataOutUI');
	}
	else {
		// script has permissions
		menu.addItem('Sheet → Mixpanel', 'SheetToMixpanel');
		menu.addItem('Mixpanel → Sheet', 'MixpanelToSheet');
	}
	menu.addToUi();
}

/*
----------------
Sheet → Mixpanel
----------------
*/

/**
 * called when the user clicks Sheet → Mixpanel
 * 
 * @returns {void}
 */
function SheetToMixpanel() {
	const htmlTemplate = HtmlService.createTemplateFromFile('ui/sheet-to-mixpanel.html');

	// server-side values
	htmlTemplate.columns = getSheetHeaders();
	htmlTemplate.config = getConfig();
	htmlTemplate.sheet = getSheetInfo();
	htmlTemplate.syncs = getTriggers();

	// apply template
	const htmlOutput = htmlTemplate
		.evaluate()
		.setWidth(700)
		.setHeight(750);

	// render
	SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Sheet → Mixpanel');
	track('open', { view: 'sheet → mixpanel' });
}

/**
 * called when a user clicks the 'test' button in the Sheet → Mixpanel UI
 * 
 * @param  {SheetMpConfig} config if not supplied, last known will be used
 * @param {SheetInfo} sheetInfo
 * @returns {[ImportResponse[], Summary]}
 */
function testSyncSheetsToMp(config = {}, sheetInfo) {
	const testId = Math.random();
	const t = tracker({ testId, record_type: config.record_type, project_id: config.project_id, view: 'sheet → mixpanel' });
	const sheet = getSheetById(sheetInfo.id);

	t('test start'); //something happening here... what it is ain't exactly clear
	const [responses, summary] = importData(config, sheet);
	const { total, success, failed, seconds } = summary.results;
	t('test end', { total, success, failed, seconds });

	return [responses, summary];
}

/**
 * called when a user clicks the 'sync' button in the Sheet → Mixpanel UI
 * 
 * @param  {SheetMpConfig} config
 * @returns  {[ImportResponse[], Summary] | SheetMpConfig}
 */
function syncSheetsToMp(config) {
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

/**
 * show a pop-up to the user
 * 
 * @param  {Summary} config
 * @returns {void}
 */
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



/*
----------------
Mixpanel → Sheet
----------------
*/


/**
 * called when the user clicks  Mixpanel → Sheet
 * 
 * @returns {void}
 */
function MixpanelToSheet() {
	const htmlTemplate = HtmlService.createTemplateFromFile('ui/mixpanel-to-sheet.html');

	// server-side values
	htmlTemplate.config = getConfig();
	htmlTemplate.sheet = getSheetInfo();

	// apply template
	const htmlOutput = htmlTemplate
		.evaluate()
		.setWidth(700)
		.setHeight(500);

	//render
	SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Mixpanel → Sheet');
	track('open', { view: 'mixpanel → sheet' });
}

/**
 * called when a user clicks the 'test' button in the Mixpanel → Sheet UI
 * 
 * @param  {MpSheetConfig} config if not supplied, last known will be used
 */
function testSyncMpToSheets(config = {}) {
	const testId = Math.random();
	const t = tracker({ testId, record_type: config.record_type, project_id: config.project_id, view: 'mixpanel → sheet' });

	t('test start');
	const [csvData, metadata] = exportData(config);

	const destSheet = createSheet(metadata.report_name || 'mixpanel export');
	const updatedSheet = updateSheet(csvData, destSheet);

	t('test end');

	return {
		updatedSheet,
		metadata
	};
}



/*
----
REF DOCS
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
// ? tests: https://github.com/WildH0g/UnitTestingApp 
//? bundling npm modules: https://12ft.io/proxy?q=https%3A%2F%2Fmedium.com%2Fgeekculture%2Fthe-ultimate-guide-to-npm-modules-in-google-apps-script-a84545c3f57c
