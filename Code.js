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

// todo: ui for export
// todo: hourly syncs, sync display, & sync logs
// todo: docs

/*
----
MENUS
----
*/

/**
 * the main entry point to the application
 * called when the sheet is opened by any user
 * populates the menu the dropdown the end-user sees in the toolbar
 * may runs with different levels of permission which is why we delineate between the two
 *
 * @param  {GoogleAppsScript.Events.SheetsOnOpen} sheetOpenEv event for "sheet is opened"
 * @returns {void}
 */
function onOpen(sheetOpenEv) {
    const ui = SpreadsheetApp.getUi();
    const menu = ui.createAddonMenu();
    if (sheetOpenEv && sheetOpenEv.authMode == ScriptApp.AuthMode.NONE) {
        // app does not have permissions to do things
        // this occurs when a user is viewing the document who has not authorized/installed the extension
        // clicking on menu buttons when the script is not authorized will show the OAuth consent screen
        // OAuth consent screen is configured in GCP:
        // ? https://developers.google.com/apps-script/add-ons/concepts/editor-auth-lifecycle
        menu.addItem("Sheet → Mixpanel", "dataInUI");
        menu.addItem("Mixpanel → Sheet", "dataOutUI");
    } else {
        // user has given app permissions
        menu.addItem("Sheet → Mixpanel", "SheetToMixpanelView");
        menu.addItem("Mixpanel → Sheet", "MixpanelToSheetView");
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
function SheetToMixpanelView() {
    const htmlTemplate = HtmlService.createTemplateFromFile("ui/sheet-to-mixpanel.html");

    // server-side data
    htmlTemplate.columns = getSheetHeaders();
    htmlTemplate.config = getConfig();
    htmlTemplate.sheet = getSheetInfo();
    htmlTemplate.syncs = getTriggers();

    // apply data template
    const htmlOutput = htmlTemplate.evaluate().setWidth(700).setHeight(750);

    // render template
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Sheet → Mixpanel");
    track("open", { view: "sheet → mixpanel" });
}

/**
 * called when a user clicks the 'test' button in the Sheet → Mixpanel UI
 *
 * @param  {SheetMpConfig} config if not supplied, last known will be used
 * @param {SheetInfo} sheetInfo the source sheet which contains the data
 * @returns {[ImportResponse[], Summary]}
 */
function testSyncSheetsToMp(config = {}, sheetInfo = SpreadsheetApp.getActiveSheet()) {
    const testId = Math.random();
    const t = tracker({ testId, record_type: config.record_type, project_id: config.project_id, view: "sheet → mixpanel" });
    try {
        const auth = validateCreds(config);
        config.auth = auth;
    } catch (e) {
        //bad credentials
        throw e;
    }
    const sheet = getSheetById(sheetInfo.id);

    t("test start"); //something happening here... what it is ain't exactly clear
    const [responses, summary] = importData(config, sheet);
    const { total, success, failed, seconds } = summary.results;
    t("test end", { total, success, failed, seconds });

    return [responses, summary, `https://mixpanel.com/project/${config.project_id}`];
}

/**
 * called when a user clicks the 'sync' button in the Sheet → Mixpanel UI
 *
 * @param  {SheetMpConfig} config
 * @returns  {[ImportResponse[], Summary] | SheetMpConfig}
 */
function syncSheetsToMp(config) {}

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
function MixpanelToSheetView() {
    const htmlTemplate = HtmlService.createTemplateFromFile("ui/mixpanel-to-sheet.html");

    // server-side data
    htmlTemplate.config = getConfig();
    htmlTemplate.sheet = getSheetInfo();
    htmlTemplate.syncs = getTriggers();

    // apply data to template
    const htmlOutput = htmlTemplate.evaluate().setWidth(700).setHeight(500);

    //render template
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Mixpanel → Sheet");
    track("open", { view: "mixpanel → sheet" });
}

/**
 * called when a user clicks the 'test' button in the Mixpanel → Sheet UI
 *
 * @param  {MpSheetConfig} config if not supplied, last known will be used
 */
function testSyncMpToSheets(config = {}) {
    const testId = Math.random();
    const t = tracker({ testId, record_type: config.record_type, project_id: config.project_id, view: "mixpanel → sheet" });

    try {
        const auth = validateCreds(config);
        config.auth = auth;
    } catch (e) {
        //bad credentials
        throw e;
    }

    t("test start");
    try {
        const [csvData, metadata] = exportData(config);
        let sheetName;

        if (config.entity_type === "cohort") {
            sheetName = `cohort: ${metadata.cohort_name}`;
        } else if (config.entity_type === "report") {
            sheetName = `report: ${metadata.report_name}`;
        }

        //this should never be the case
        else {
            sheetName = `mixpanel export`;
        }

        const destSheet = createSheet(sheetName);
        const updatedSheet = updateSheet(csvData, destSheet);

        t("test end");

        return {
            updatedSheet,
            metadata
        };
    } catch (e) {
        throw e;
    }
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
