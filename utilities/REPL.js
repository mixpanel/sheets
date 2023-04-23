/* cSpell:disable */
// @ts-nocheck

/*
----
DEBUG
a very simple debugger to be passed to clasp run
----
*/

function repl() {
    //the code you write here will run server-side in GAS
    //use npm run watch-server-debug for a near REPL experience
	/** @type {MpSheetConfig} */
	const c = {
        config_type: "mixpanel-to-sheet",
        entity_type: "dashboard",
        project_id: PROJECT_ID,
        workspace_id: WORKSPACE_ID,
        dash_id: 4690699,
        service_acct: SERVICE_ACCOUNT,
        service_secret: SERVICE_SECRET,
		auth: SERVICE_AUTH_STR,
		
    };
    return exportData(c);
}

if (typeof module !== "undefined") {
    const { tracker } = require("../utilities/tracker.js");
    const {
        getSheetHeaders,
        getSheetById,
        getSheetInfo,
        createSheet,
        overwriteSheet,
        getSheet,
        getEmptyRow
    } = require("../utilities/sheet");

    const {
        getConfig,
        setConfig,
        clearConfig,
        getTriggers,
        clearTriggers
    } = require("../utilities/storage.js");

    const { validateCreds } = require("../utilities/validate.js");
    const { importData } = require("../components/dataImport.js");
    const { exportData } = require("../components/dataExport.js");
    const {
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
    } = require("../Code.js");
    module.exports = { repl };
}
