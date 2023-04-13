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
    const authMode = sheetOpenEv.authMode;
    if (sheetOpenEv && authMode == ScriptApp.AuthMode.NONE) {
        // app does not have permissions to do things
        // this occurs when a user is viewing the document who has not authorized/installed the extension
        // clicking on menu buttons when the script is not authorized will show the OAuth consent screen
        // OAuth consent screen is configured in GCP:
        // ? https://developers.google.com/apps-script/add-ons/concepts/editor-auth-lifecycle
        menu.addItem("Sheet → Mixpanel", "dataInUI");
        menu.addItem("Mixpanel → Sheet", "dataOutUI");
    } else {
        // user has given app permissions
        // track("menu load");
        menu.addItem("Sheet → Mixpanel", "SheetToMixpanelView");
        menu.addItem("Mixpanel → Sheet", "MixpanelToSheetView");
		menu.addItem("Feedback + Bug Reports", "ShowFeedbackForm")
        if (authMode == ScriptApp.AuthMode.FULL || authMode == ScriptApp.AuthMode.LIMITED) {
            const activeSync = getConfig().active_sync || false;
            if (activeSync) {
                menu.addItem("Sync Now!", "syncNow");
            }
        }
    }
    menu.addToUi();
}

/**
 * the "feedback" menu option
 * opens a google form
 */
function ShowFeedbackForm() {
    // ? https://dogmatix.medium.com/open-a-url-using-google-apps-script-b1f6b8bdaec4
    var htmlOutput = HtmlService.createHtmlOutputFromFile("ui/feedback.html").setHeight(100);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Feedback Form");
    track("feedback");
}

/**
 * the "sync now" menu option
 * runs a sync using last known config
 * these methods are self-sufficient
 */
function syncNow() {
    /** @type {Config} */
    const config = getConfig();
    const ui = SpreadsheetApp.getUi();
    try {
        if (config.config_type === "mixpanel-to-sheet") {
            syncMpToSheets();
        }
        if (config.config_type === "sheet-to-mixpanel") {
            syncSheetsToMp();
        }
        ui.alert("✅ Sync Complete", `sync ran successfully`, ui.ButtonSet.OK);
        track("sync now: success", { type: config.config_type });
        return { status: "success", error: null };
    } catch (e) {
        track("sync now: fail", { type: config.config_type, error: e });
        ui.alert("❌ Sync Error", `sync failed to run; got error\n${e.message}`, ui.ButtonSet.OK);
        return { status: "fail", error: e };
    }
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
    storedConfig.active_sync = false;
    setConfig(storedConfig);

    return [responses, summary, `https://mixpanel.com/project/${config.project_id}`];
}

/**
 * called when a user clicks the 'sync' button in the Sheet → Mixpanel UI
 * creates a scheduled sync and runs it
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
    storedConfig.active_sync = true;
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

    track("sync: create", {
        record_type: config?.record_type,
        project_id: config?.project_id,
        view: "sheet → mixpanel"
    });
    //notify the end user
    return [responses, summary, `https://mixpanel.com/project/${config.project_id}`];
}

/**
 * called automatically by the trigger: Sheet → Mixpanel
 */
function syncSheetsToMp() {
    const syncId = Math.random();
    const t = tracker({
        syncId,
        record_type: config?.record_type,
        project_id: config?.project_id,
        view: "sheet → mixpanel"
    });
    t("sync: start");
    /** @type {SheetMpConfig & SheetInfo} */
    const config = getConfig();
    const sourceSheet = getSheet(Number(config.sheet_id));
    const receiptSheet = getSheet(Number(config.receipt_sheet));

    try {
        //validate credentials
        if (!config.auth) {
            const auth = validateCreds(config);
            config.auth = auth;
        }

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
        t("sync: finish");
        return { status: "success", error: null };
    } catch (e) {
        t("sync: error", { error: e });
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
    const htmlOutput = htmlTemplate.evaluate().setWidth(600).setHeight(500);

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
        config.dest_sheet = getSheetInfo(destSheet).sheet_id;
        config.active_sync = false;
        setConfig(config);
        const updatedSheet = overwriteSheet(csvData, destSheet);

        t("test end");

        return [updatedSheet, metadata];
    } catch (e) {
        throw e;
    }
}
/**
 * called when a user clicks the 'sync' button in the Mixpanel → Sheet UI
 * creates a scheduled sync and runs it
 *
 * @param  {MpSheetConfig} config
 */
function createSyncMpToSheets(config) {
    const startTime = new Date();
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

    //create the sheet for storing logs; add it to config
    const receiptSheetName = `Sheet → Mixpanel (${config.entity_type} logs)`;
    const receiptSheet = createSheet(receiptSheetName);
    config.receipt_sheet = getSheetInfo(receiptSheetName).sheet_id;
    const columns = `Start Time,End Time,Duration,Entity,Errors`;
    overwriteSheet(columns, receiptSheet);
    receiptSheet.setFrozenRows(1);

    //hit the report & get it's data
    let csvData, metadata;
    try {
        [csvData, metadata] = exportData(config);
    } catch (e) {
        throw e;
    }

    //create a sheet for the destination; add it to config
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
    config.dest_sheet = getSheetInfo(destSheet).sheet_id;

    // overwrite entire contents
    const updatedSheet = overwriteSheet(csvData, destSheet);

    //store config for future syncs
    config.active_sync = true;
    setConfig(config);

    //create the trigger
    const trigger = ScriptApp.newTrigger("syncMpToSheets").timeBased().everyHours(1).create();

    //write receipt
    const endTime = new Date();
    const deltaSec = Math.abs(endTime.getTime() - startTime.getTime()) / 1000;
    receiptSheet.getRange(getEmptyRow(receiptSheet), 1, 1, 5).setValues([
        [
            startTime,
            endTime,
            `${deltaSec} seconds`,
            // @ts-ignore
            metadata?.cohort_name || metadata?.report_name || "unknown",
            "none"
        ]
    ]);

    track("sync: create", {
        record_type: config?.record_type,
        project_id: config?.project_id,
        view: "mixpanel → sheet"
    });

    return [updatedSheet, metadata];
}

/**
 * called automatically by the trigger: Mixpanel → Sheet
 */
function syncMpToSheets() {
    const syncId = Math.random();
    const t = tracker({
        syncId,
        record_type: config?.record_type,
        project_id: config?.project_id,
        view: "mixpanel → sheet"
    });
    t("sync: start");
    try {
        const startTime = new Date();
        /** @type {MpSheetConfig} */
        const config = getConfig();
        const destSheet = getSheet(Number(config.dest_sheet));
        const receiptSheet = getSheet(Number(config.receipt_sheet));
        const [csvData, metadata] = exportData(config);
        const updatedSheet = overwriteSheet(csvData, destSheet);
        const endTime = new Date();
        const deltaSec = Math.abs(endTime.getTime() - startTime.getTime()) / 1000;

        receiptSheet.getRange(getEmptyRow(receiptSheet), 1, 1, 5).setValues([
            [
                startTime,
                endTime,
                `${deltaSec} seconds`,
                // @ts-ignore
                metadata?.cohort_name || metadata?.report_name || "unknown",
                "none"
            ]
        ]);
        t("sync: finish");
        return { status: "success", error: null };
    } catch (e) {
        t("sync: error", { error: e });
        const config = getConfig();
        const receiptSheet = getSheet(Number(config.receipt_sheet));
        receiptSheet
            .getRange(getEmptyRow(receiptSheet), 1, 1, 5)
            .setValues([[new Date(), new Date(), `-----`, `-----`, `FAIL:\n${e.message}`]]);
        return { status: "fail", error: e };
    }
}

/*
----
NOT USED BY GAS
----
*/
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
        syncNow,

        SheetToMixpanelView,
        testSyncSheetsToMp,
        createSyncSheetsToMp,
        syncSheetsToMp,

        MixpanelToSheetView,
        testSyncMpToSheets,
        createSyncMpToSheets,
        syncMpToSheets
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
// ? bundling npm modules: https://12ft.io/proxy?q=https%3A%2F%2Fmedium.com%2Fgeekculture%2Fthe-ultimate-guide-to-npm-modules-in-google-apps-script-a84545c3f57c
// ? overloads https://austingil.com/typescript-function-overloads-with-jsdoc/
