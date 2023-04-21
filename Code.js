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

const APP_VERSION = "1.12";

/**
 * some important things to know about google apps script
 * 	- there are no modules; every function shares a global namespace
 * 	- 'Types' are declared in Types.gs
 */

// "globally" safe to call anywhere
let track;
try {
    track = tracker();
} catch (e) {
    track = () => {};
}

/*
----
TODOs
----
*/

// ! test => run ... make syncs less obvious or hidden

// ! receipt sheet logs use UTC; should be local timezone to user
// ? https://developers.google.com/apps-script/reference/base/session#getscripttimezone
// ? https://developers.google.com/google-ads/scripts/docs/features/dates#spreadsheets

// $ the 6 (or 30) minute limit
// ? https://developers.google.com/apps-script/guides/services/quotas#current_limitations
// ? https://inclu-cat.net/2021/12/14/an-easy-way-to-deal-with-google-apps-scripts-6-minute-limit/
// ? https://github.com/inclu-cat/LongRun

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
        menu.addItem("Sheet → Mixpanel", "SheetToMixpanelView");
        menu.addItem("Mixpanel → Sheet", "MixpanelToSheetView");
    } else {
        // user has given app permissions
        menu.addItem("Sheet → Mixpanel", "SheetToMixpanelView");
        menu.addItem("Mixpanel → Sheet", "MixpanelToSheetView");
        menu.addItem("Feedback", "ShowFeedbackForm");
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
    track("feedback");
    var htmlOutput = HtmlService.createHtmlOutputFromFile("ui/feedback.html").setHeight(100);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Feedback Form");
}

/**
 * the "sync now" menu option
 * runs a sync using last known config
 * these methods are self-sufficient
 */
function syncNow() {
    /** @type {Config} */
    const config = getConfig();
    const runId = Math.random();
    const t = tracker({
        runId,
        type: config.config_type,
        project_id: config?.project_id,
        manual: true
    });
    t("sync now: start");
    const ui = SpreadsheetApp.getUi();
    try {
        if (config.config_type === "mixpanel-to-sheet") {
            syncMpToSheets();
        }
        if (config.config_type === "sheet-to-mixpanel") {
            syncSheetsToMp();
        }
        ui.alert("✅ Sync Complete", `sync ran successfully`, ui.ButtonSet.OK);
        t("sync now: end");
        return { status: "success", error: null };
    } catch (e) {
        t("sync now: error", { error: e.toString() });
        ui.alert("❌ Sync Error", `sync failed to run; got error\n${e.message}`, ui.ButtonSet.OK);
        return { status: "fail", error: e.message };
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
    config.config_type = "sheet-to-mixpanel";
    const runId = Math.random();
    const t = tracker({
        runId,
        record_type: config?.record_type,
        project_id: config?.project_id,
        view: "sheet → mixpanel"
    });
    t("test: start");

    try {
        // @ts-ignore
        const auth = validateCreds(config);
        config.auth = auth;
    } catch (e) {
        //bad credentials
        t("test: error", { error: e.toString() });
        throw e;
    }
    const sheet = getSheetById(sheetInfo.sheet_id);

    const [responses, summary] = importData(config, sheet);
    const { total, success, failed, seconds } = summary;
    t("test: end", { total, success, failed, seconds });

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
    config.config_type = "sheet-to-mixpanel";
    const runId = Math.random();
    const t = tracker({
        runId,
        record_type: config?.record_type,
        project_id: config?.project_id,
        view: "sheet → mixpanel",
        manual: "first sync"
    });
    t("sync: create start");

    //validate credentials
    try {
        // @ts-ignore
        const auth = validateCreds(config);
        config.auth = auth;
    } catch (e) {
        //bad credentials
        t("sync: error", { error: e.toString() });
        throw e;
    }
    const sheet = getSheetById(Number(sheetInfo.sheet_id));

    //create the sheet for storing logs; add it to config
    const receiptSheetName = `Sheet → Mixpanel (${config.record_type} logs)`;
    const receiptSheet = createSheet(receiptSheetName);
    config.receipt_sheet = getSheetInfo(receiptSheetName).sheet_id;
    const columns = `Start Time,End Time,Duration,Total,Success,Failed,Errors`;
    overwriteSheet(columns, receiptSheet);
    receiptSheet.setFrozenRows(1);

    //create the trigger
    const trigger = ScriptApp.newTrigger("syncSheetsToMp").timeBased().everyHours(1).create();

    //store config for future syncs
    /** @type {SheetMpConfig} */
    const storedConfig = { ...config, ...sheetInfo, trigger: trigger.getUniqueId() };
    storedConfig.active_sync = true;
    setConfig(storedConfig);

    //run a sync now
    t("sync: start");
    const [responses, summary] = importData(config, sheet);
    const { startTime, endTime, seconds, total, success, failed, errors } = summary;
    t("sync: end", { total, success, failed, seconds });

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

    t("sync: create end");
    //notify the end user
    return [responses, summary, `https://mixpanel.com/project/${config.project_id}`, storedConfig];
}

/**
 * called automatically by the trigger: Sheet → Mixpanel
 */
function syncSheetsToMp() {
    /** @type {SheetMpConfig & SheetInfo} */
    const config = getConfig();
    if (JSON.stringify(config) === "{}") throw "no operation: sync scheduled; data not present (SH => MP)";
    config.config_type = "sheet-to-mixpanel";
    const runId = Math.random();
    const t = tracker({
        runId,
        record_type: config?.record_type,
        project_id: config?.project_id,
        view: "sheet → mixpanel",
        manual: false
    });
    t("sync: start");
    const triggerId = config.trigger;
    let sourceSheet;
    let receiptSheet;
    try {
        sourceSheet = getSheet(Number(config.sheet_id));
    } catch (e) {
        //the source sheet is gone; kill the sync + config
        t("sync: autodelete");
        clearTriggers(triggerId);
        clearConfig();
        return `SYNC DELETED`;
    }

    try {
        receiptSheet = getSheet(Number(config.receipt_sheet));
    } catch (e) {
        //receipt sheet MUST exist; make it again... UGH... this is terrible
        const receiptSheetName = `Sheet → Mixpanel (${config.record_type} logs)`;
        receiptSheet = createSheet(receiptSheetName);
        config.receipt_sheet = getSheetInfo(receiptSheetName).sheet_id;
        const columns = `Start Time,End Time,Duration,Total,Success,Failed,Errors`;
        overwriteSheet(columns, receiptSheet);
        receiptSheet.setFrozenRows(1);
    }

    // store any updated changes
    setConfig(config);

    //actually do the sync
    try {
        //validate credentials
        if (!config.auth) {
            // @ts-ignore
            const auth = validateCreds(config);
            config.auth = auth;
        }

        //run import
        const [responses, summary] = importData(config, sourceSheet);

        // track sync result
        if (responses.length === 0) {
            t("sync: skipped");
        } else {
            t("sync: end");
        }

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

        return { status: "success", error: errors };
    } catch (e) {
        t("sync: error", { error: e.toString() });
        receiptSheet
            .getRange(getEmptyRow(receiptSheet), 1, 1, 7)
            .setValues([[new Date(), new Date(), `-----`, `-----`, `-----`, `-----`, `ERROR:\n${e.message}`]]);

        return { status: "fail", error: e.message || e };
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
    config.config_type = "mixpanel-to-sheet";
    const runId = Math.random();
    const t = tracker({ runId, project_id: config.project_id, view: "mixpanel → sheet" });
    t("test: start");
    try {
        // @ts-ignore
        const auth = validateCreds(config);
        config.auth = auth;
    } catch (e) {
        //bad credentials
        t("test: error", { error: e.toString() });
        throw e;
    }

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

        t("test: end");

        return [updatedSheet, metadata];
    } catch (e) {
        t("test: error", { error: e.toString() });
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
    //clear all triggers + stored data
    clearConfig(getConfig());

    config.config_type = "mixpanel-to-sheet";
    const startTime = new Date();
    const runId = Math.random();
    const t = tracker({
        runId,
        record_type: config?.entity_type,
        project_id: config?.project_id,
        view: "mixpanel → sheet",
        manual: "first time"
    });
    t("sync: create");

    //validate credentials
    try {
        // @ts-ignore
        const auth = validateCreds(config);
        config.auth = auth;
    } catch (e) {
        //bad credentials
        t("sync: error", { error: e.toString() });
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
    t("sync: start");
    let csvData, metadata;
    try {
        [csvData, metadata] = exportData(config);
    } catch (e) {
        t("sync: error", { error: e.toString() });
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
    t("sync: end");
    //create the trigger
    const trigger = ScriptApp.newTrigger("syncMpToSheets").timeBased().everyHours(1).create();

    //store config for future syncs
    config.active_sync = true;
    config.trigger = trigger.getUniqueId();
    setConfig(config);

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

    t("sync: created");
    return [updatedSheet, metadata, config];
}

/**
 * called automatically by the trigger: Mixpanel → Sheet
 */
function syncMpToSheets() {
    /** @type {MpSheetConfig} */
    const config = getConfig();
    if (JSON.stringify(config) === "{}") return "no operation: sync scheduled; data not present (MP => SH)";
    config.config_type = "mixpanel-to-sheet";
    const runId = Math.random();
    const t = tracker({
        runId,
        record_type: config?.entity_type,
        project_id: config?.project_id,
        view: "mixpanel → sheet",
        manual: false
    });
    t("sync: start");
    const triggerId = config.trigger;
    const startTime = new Date();
    let destSheet;
    let receiptSheet;
    try {
        destSheet = getSheet(Number(config.dest_sheet));
    } catch (e) {
        //dest sheet is gone; remake it
        destSheet = createSheet(`mixpanel ${config.entity_type} export`);
        config.dest_sheet = getSheetInfo(destSheet).sheet_id;
    }

    try {
        receiptSheet = getSheet(Number(config.receipt_sheet));
    } catch (e) {
        // receipt sheet is gone; remake it
        const receiptSheetName = `Sheet → Mixpanel (${config.entity_type} logs)`;
        receiptSheet = createSheet(receiptSheetName);
        config.receipt_sheet = getSheetInfo(receiptSheetName).sheet_id;
        const columns = `Start Time,End Time,Duration,Entity,Errors`;
        overwriteSheet(columns, receiptSheet);
        receiptSheet.setFrozenRows(1);
    }

    // store any updated changes
    setConfig(config);

    //actually do the sync
    try {
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
        t("sync: end");
        return { status: "success", error: null };
    } catch (e) {
        t("sync: error", { error: e.toString() });
        receiptSheet
            .getRange(getEmptyRow(receiptSheet), 1, 1, 5)
            .setValues([[new Date(), new Date(), `-----`, `-----`, `FAIL:\n${e.message}`]]);
        return { status: "fail", error: e.message || e };
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
        syncMpToSheets,
        ShowFeedbackForm
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
