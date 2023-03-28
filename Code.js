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

// todo: syncs + sync logs
// todo: docs
// todo: type checking

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
 * @returns {[ImportResponse[], ImportResults, string]}
 */
function testSyncSheetsToMp(config, sheetInfo = getSheetInfo(SpreadsheetApp.getActiveSheet())) {
    const testId = Math.random();
    const t = tracker({
        testId,
        record_type: config?.record_type,
        project_id: config?.project_id,
        view: "sheet → mixpanel"
    });
    try {
        const auth = validateCreds(config);
        config.auth = auth;
    } catch (e) {
        //bad credentials
        throw e;
    }
    const sheet = getSheetById(sheetInfo.sheet_id);

    t("test start"); //something happening here... what it is ain't exactly clear
    const [responses, summary] = importData(config, sheet);
    const { total, success, failed, seconds } = summary;
    t("test end", { total, success, failed, seconds });

    //store config for future syncs
    /** @type {SheetMpConfig} */
    const storedConfig = { ...config, ...sheetInfo };
    setConfig(storedConfig);

    return [responses, summary, `https://mixpanel.com/project/${config.project_id}`];
}

/**
 * called when a user clicks the 'sync' button in the Sheet → Mixpanel UI
 * creates a schedule sync and runs it
 *
 * @param  {SheetMpConfig} config if not supplied, last known will be used
 * @param {SheetInfo} sheetInfo the source sheet which contains the data
 */
function createSyncSheetsToMp(config, sheetInfo) {
    //clear all triggers + stored data
    clearConfig(getConfig());

    //validate credentials
    try {
        const auth = validateCreds(config);
        config.auth = auth;
    } catch (e) {
        //bad credentials
        throw e;
    }
    const sheet = getSheetById(Number(sheetInfo.sheet_id));

    //create the sheet for storing logs
    const receiptSheetName = `Sheet → Mixpanel (${config.record_type} logs)`;
    const receiptSheet = createSheet(receiptSheetName);
    config.receipt_sheet = getSheetInfo(receiptSheetName).sheet_id;
    const columns = `Start Time,End Time,Duration,Total,Success,Failed,Errors`;
    overwriteSheet(columns, receiptSheet);
    receiptSheet.setFrozenRows(1);

    //store config for future syncs
    /** @type {SheetMpConfig} */
    const storedConfig = { ...config, ...sheetInfo };
    setConfig(storedConfig);

    //create the trigger
    const trigger = ScriptApp.newTrigger("syncSheetsToMp").timeBased().everyHours(1).create();

    //run a sync now
    const [responses, summary] = importData(config, sheet);
    const { startTime, endTime, seconds, total, success, failed, errors } = summary;
    //dump results to sync log
    receiptSheet
        .getRange(getEmptyRow(receiptSheet), 1, 1, 7)
        .setValues([
            [
                new Date(startTime),
                new Date(endTime),
                `${seconds} seconds`,
                total,
                success,
                failed,
                JSON.stringify(errors, null, 2)
            ]
        ]);

    //notify the end user
    return [responses, summary, `https://mixpanel.com/project/${config.project_id}`];
}

function syncSheetsToMp() {
    /** @type {SheetMpConfig & SheetInfo} */
    const config = getConfig();
    const sourceSheet = getSheet(Number(config.sheet_id));
    const receiptSheet = getSheet(Number(config.receipt_sheet));

    //validate credentials
    if (!config.auth) {
        const auth = validateCreds(config);
        config.auth = auth;
    }
    try {
        //run import
        const [responses, summary] = importData(config, sourceSheet);

        //dump results to sync log

        const { startTime, endTime, seconds, total, success, failed, errors } = summary;
        //dump results to sync log
        receiptSheet
            .getRange(getEmptyRow(receiptSheet), 1, 1, 7)
            .setValues([
                [
                    new Date(startTime),
                    new Date(endTime),
                    `${seconds} seconds`,
                    total,
                    success,
                    failed,
                    JSON.stringify(errors, null, 2)
                ]
            ]);

        return { status: "success", error: null };
    } catch (e) {
        receiptSheet
            .getRange(getEmptyRow(receiptSheet), 1, 1, 7)
            .setValues([[new Date(), new Date(), `-----`, `-----`, `-----`, `-----`, `ERROR:\n${e.message}`]]);

        return { status: "fail", error: e };
    }
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
function MixpanelToSheetView() {
    const htmlTemplate = HtmlService.createTemplateFromFile("ui/mixpanel-to-sheet.html");

    // server-side data
    htmlTemplate.config = getConfig();
    htmlTemplate.sheet = getSheetInfo();
    htmlTemplate.syncs = getTriggers();

    // apply data to template
    const htmlOutput = htmlTemplate.evaluate().setWidth(600).setHeight(450);

    //render template
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Mixpanel → Sheet");
    track("open", { view: "mixpanel → sheet" });
}

/**
 * called when a user clicks the 'test' button in the Mixpanel → Sheet UI
 *
 * @param  {MpSheetConfig} config if not supplied, last known will be used
 */
function testSyncMpToSheets(config) {
    const testId = Math.random();
    const t = tracker({ testId, project_id: config.project_id, view: "mixpanel → sheet" });

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
            //@ts-ignore
            sheetName = `cohort: ${metadata.cohort_name}`;
        } else if (config.entity_type === "report") {
            //@ts-ignore
            sheetName = `report: ${metadata.report_name}`;
        }
        //this should never be the case
        else {
            sheetName = `mixpanel export`;
        }

        const destSheet = createSheet(sheetName);
        const updatedSheet = overwriteSheet(csvData, destSheet);

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
// ? bundling npm modules: https://12ft.io/proxy?q=https%3A%2F%2Fmedium.com%2Fgeekculture%2Fthe-ultimate-guide-to-npm-modules-in-google-apps-script-a84545c3f57c
// ? overloads https://austingil.com/typescript-function-overloads-with-jsdoc/

if (typeof module !== "undefined") {
    const { tracker } = require("./utilities/tracker.js");
    const {
        getSheetHeaders,
        getSheetById,
        getSheetInfo,
        createSheet,
        overwriteSheet,
        getSheet,
        getEmptyRow
    } = require("./utilities/sheet");

    const { getConfig, setConfig, clearConfig, getTriggers, clearTriggers } = require("./utilities/storage.js");

    const { validateCreds } = require("./utilities/validate.js");
    const { importData } = require("./components/dataImport.js");
    const { exportData } = require("./components/dataExport.js");
    module.exports = {
        onOpen,
        SheetToMixpanelView,
        testSyncSheetsToMp,
        createSyncSheetsToMp,
        MixpanelToSheetView,
        testSyncMpToSheets,
        syncSheetsToMp
    };
}
