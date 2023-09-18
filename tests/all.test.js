//@ts-nocheck

/*
----
TEST RUNNER
? https://github.com/WildH0g/UnitTestingApp#readme
----
*/

//todo: we should probably have
// - units.test.js  (LOCAL)
// - integration.test.js (SERVER)
// - e2e.test.js (SERVER)
// - frontend.test.js (LOCAL w/JEST + PUPPETEER)

/**
 * Runs the tests; insert online and offline tests where specified by comments
 * @returns {void}
 */
function runTests() {
    const test = new UnitTestingApp();
    test.enable();
    test.clearConsole();

    /*
	----
	LOCAL TESTS
	tests are run locally
	----
	*/

    test.runInGas(false);
    test.printHeader("LOCAL TESTS");

    //misc.js
    test.assert("do tests work?", () => {
        return true;
    });

    test.assert("formats numbers?", () => {
        const expected = "1,000,000";
        return Misc.comma(1000000) === expected;
    });

    test.assert("correctly batches?", () => {
        const expected = 2;
        return Misc.sliceIntoChunks([{}, {}, {}, {}], 2).length === expected;
    });

    test.assert("turns JSON[] into CSV string?", () => {
        const expected = `foo,baz\nbar,qux`;
        return Misc.JSONtoCSV([{ foo: "bar", baz: "qux" }]) === expected;
    });

    test.assert("turns profiles into string[][]", () => {
        const expected = [
            [`foo`, `baz`, `third`],
            [`bar`, `qu,x`, ``],
            [`bar`, ``, `exists`]
        ];
        return JSON.stringify(Misc.profilesToCsvArray([{ foo: "bar", baz: "qu,x" }, {foo: "bar", third: "exists"}])) === JSON.stringify(expected);
    });

    test.assert("forms pretty dates?", () => {
        const expected = `3/3/1901 @ 4:20am`;
        return Misc.formatDate(new Date(1, 2, 3, 4, 20)) === expected;
    });

    test.assert("clones objects?", () => {
        const original = {
            foo: { bar: "baz" },
            qux: ["mux", "dux", "lux"],
            brew: { one: 1, two: 2, three: 3 }
        };
        const cloned = Misc.clone(original);
        return Misc.serial(original) === Misc.serial(cloned) && Misc.isDeepEqual(original, cloned) && cloned !== original;
    });

    test.assert("serializes objects?", () => {
        const expected = `[{"foo":"bar","baz":"qux"}]`;
        return Misc.serial([{ foo: "bar", baz: "qux" }]) === expected;
    });

    test.assert("tests for deep equality?", () => {
        const ObjOne = { foo: "bar", baz: { qux: "mux" } };
        const ObjTwo = { baz: { qux: "mux" }, foo: "bar" };
        return Misc.isDeepEqual(ObjOne, ObjTwo);
    });

    console.log("\n\n");

    /*
	----
	ONLINE TESTS
	tests are run on google's servers
	
	these tests depend on underlying sheets to be named
	'events', 'users', 'groups', 'tables'
	see ./testData if you need to rebuild test data
	or just copy: https://docs.google.com/spreadsheets/d/1AZ_tb_kMCUGaEMvBSSH4H53jc0H2Mf1QallzJ0kJ25A/edit?usp=sharing

	they also depend on a 'env.js' which is not committed to the repo
	----
	*/

    test.runInGas(true);
    if (test.isInGas) tearDown();
    if (test.isInGas) test.printHeader(`SERVER SIDE TESTS START\n${formatDate()}`, false);

    /*
	----
	MISC
	----
	*/

    test.assert("MISC: retrieves headers from sheet?", () => {
        const correctHeaders = ["uuid", "timestamp", "action", "favorite color", "lucky number", "insert"];
        const sheet = SpreadsheetApp.getActive().getSheetByName("events");
        const gotHeaders = getSheetHeaders(sheet);
        return serial(correctHeaders) === serial(gotHeaders);
    });

    test.assert("MISC: tracks data?", () => {
        const expected = [
            { error: null, status: 1 },
            { error: null, status: 1 }
        ];
        const trackLocal = tracker(undefined, "ROBOT@aktunes.com");
        const results = trackLocal("server-side test");
        return serial(results) === serial(expected);
    });

    test.assert("MISC: MD5 signatures?", () => {
        const expected = `2c18fe59700b6df244c24bae1bdfe403`;
        const results = MD5("yes, it is me, i am the one who knocks");
        return expected === results;
    });

    /*
	----
	FLUSH
	----
	*/

    test.assert("FLUSH: events?", () => {
        const expected = [{ code: 200, error: null, num_records_imported: 1, status: 1 }];
        const results = flushToMixpanel(TEST_CONFIG_EVENTS_DATA, TEST_CONFIG_EVENTS);
        return isDeepEqual(expected, results);
    });

    test.assert("FLUSH: users?", () => {
        const expected = [{ error: null, status: 1 }];
        const results = flushToMixpanel(TEST_CONFIG_USERS_DATA, TEST_CONFIG_USERS);
        return isDeepEqual(expected, results);
    });

    test.assert("FLUSH: groups?", () => {
        const expected = [{ error: null, status: 1 }];
        const results = flushToMixpanel(TEST_CONFIG_GROUPS_DATA, TEST_CONFIG_GROUPS);
        return isDeepEqual(expected, results);
    });

    test.assert("FLUSH: tables?", () => {
        const expected = [{ code: 200, status: "OK" }];
        const results = flushToMixpanel(TEST_CONFIG_TABLES_DATA, TEST_CONFIG_TABLES);
        return isDeepEqual(expected, results);
    });

    /*
	----
	STORAGE
	----
	*/

    test.assert("STORAGE: save?", () => {
        clearConfig(null, true);
        const expected = { foo: "bar", baz: "qux", mux: "dux" };
        const results = setConfig(expected);
        return isDeepEqual(expected, results);
    });

    test.assert("STORAGE: get?", () => {
        clearConfig(null, true);
        const expected = { foo: "bar", baz: "qux", mux: "dux" };
        setConfig(expected);
        const results = getConfig();
        return isDeepEqual(expected, results);
    });

    test.assert("STORAGE: clear?", () => {
        const expected = {};
        const results = clearConfig(null, true);
        return isDeepEqual(expected, results);
    });

    /*
	----
	VALIDATE CREDS
	----
	*/

    test.assert("CREDS: good service account?", () => {
        const expected = GOOD_SERVICE_ACCOUNT.answer;
        return validateCreds(GOOD_SERVICE_ACCOUNT) === expected;
    });

    test.assert("CREDS: good api secret?", () => {
        const expected = GOOD_API_SECRET.answer;
        return validateCreds(GOOD_API_SECRET) === expected;
    });

    /*
	----
	ERRORS
	----
	*/

    test.catchErr("THROWS: bad service account?", "Not a valid service account username", () => {
        validateCreds(BAD_SERVICE_ACCOUNT);
    });

    test.catchErr("THROWS: bad project?", "not a project member", () => {
        validateCreds(BAD_PROJECT_SERVICE_ACCOUNT);
    });

    test.catchErr("THROWS: bad api secret?", "Unauthorized, invalid project secret. See docs for more information: https://developer.mixpanel.com/reference/authentication#project-secret", () => {
        validateCreds(BAD_API_SECRET);
    });

    test.catchErr("THROWS: bad api project?", `Credentials in request did not match project_id URL parameter`, () => {
        validateCreds(BAD_PROJECT_API_SECRET);
    });

    test.catchErr("THROWS: unsupported report?", "flows report is not currently supported for CSV export", () => {
        createSyncMpToSheets(TEST_CONFIG_REPORTS_FLOWS);
    });

    test.catchErr("THROWS: bad report / project / workspace id?", "the report could not be found; check your project, workspace, and report id's and try again", () => {
        /** @type {MpSheetConfig} */
        const config = {
            config_type: "mixpanel-to-sheet",
            service_acct: SERVICE_ACCOUNT,
            service_secret: SERVICE_SECRET,
            report_id: 123,
            project_id: PROJECT_ID,
            workspace_id: WORKSPACE_ID,
            region: "US",
            entity_type: "report"
        };
        testSyncMpToSheets(config);
    });

    test.assert("RECOVER: empty config (MP → Sheet)", () => {
        clearConfig(null, true);
        const expected = `SYNC DELETED`;
        const result = syncMpToSheets();
        return isDeepEqual(expected, result);
    });

    test.assert("RECOVER: empty config (Sheet → MP)", () => {
        clearConfig(null, true);
        const expected = `SYNC DELETED`;
        const result = syncSheetsToMp();
        return isDeepEqual(expected, result);
    });

    /*
	----
	RUNS
	----
	*/

    // Sheet → Mixpanel
    test.assert("RUNS: events?", () => {
        clearConfig(null, true);
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("events"));
        const expected = {
            batches: 6,
            total: 10395,
            success: 10395,
            failed: 0,
            errors: [],
            record_type: "event"
        };
        const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_EVENTS, sheet);
        delete imported.seconds;
        delete imported.startTime;
        delete imported.endTime;
        return isDeepEqual(expected, imported);
    });

    test.assert("RUNS: events w/hardcode?", () => {
        clearConfig(null, true);
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("events"));
        const expected = {
            batches: 6,
            total: 10395,
            success: 10395,
            failed: 0,
            errors: [],
            record_type: "event"
        };
        const config = {
            ...TEST_CONFIG_EVENTS,
            event_name_col: "hardcode",
            distinct_id_col: "hardcode",
            hardcode_event_name: "foo",
            hardcode_distinct_id: "bar"
        };
        const [resp, imported] = testSyncSheetsToMp(config, sheet);
        delete imported.seconds;
        delete imported.startTime;
        delete imported.endTime;
        return isDeepEqual(expected, imported);
    });

    test.assert("RUNS: ad spend?", () => {
        clearConfig(null, true);
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("adspend"));
        const expected = {
            batches: 1,
            total: 91,
            success: 91,
            failed: 0,
            errors: [],
            record_type: "event"
        };
        const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_AD_SPENT, sheet);
        delete imported.seconds;
        delete imported.startTime;
        delete imported.endTime;
        return isDeepEqual(expected, imported)
    });

    test.assert("RUNS: users?", () => {
        clearConfig(null, true);
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("users"));
        const expected = {
            batches: 4,
            total: 6999,
            success: 6999,
            failed: 0,
            errors: [],
            record_type: "user"
        };
        const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_USERS, sheet);
        delete imported.seconds;
        delete imported.startTime;
        delete imported.endTime;
        return isDeepEqual(expected, imported);
    });

    test.assert("RUNS: groups?", () => {
        clearConfig(null, true);
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("groups"));
        const expected = {
            batches: 8,
            total: 1427,
            success: 1427,
            failed: 0,
            errors: [],
            record_type: "group"
        };
        const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_GROUPS, sheet);
        delete imported.seconds;
        delete imported.startTime;
        delete imported.endTime;
        return isDeepEqual(expected, imported);
    });

    test.assert("RUNS: tables?", () => {
        clearConfig(null, true);
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("tables"));
        const expected = {
            batches: 1,
            total: 1,
            success: 1,
            failed: 0,
            errors: [],
            record_type: "table"
        };
        const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_TABLES, sheet);
        delete imported.seconds;
        delete imported.startTime;
        delete imported.endTime;
        return isDeepEqual(expected, imported);
    });

    // Mixpanel → Sheet
    test.assert("RUNS: insights?", () => {
        clearConfig(null, true);
        const expected = {
            report_type: "insights",
            report_name: INSIGHTS_REPORT_NAME,
            report_desc: INSIGHTS_REPORT_DESC,
            report_id: INSIGHTS_REPORT_ID,
            project_id: PROJECT_ID,
            dashboard_id: DASHBOARD_ID,
            workspace_id: WORKSPACE_ID,
            report_creator: REPORT_CREATOR
        };

        const [sheet, metadata] = testSyncMpToSheets(TEST_CONFIG_REPORTS_INSIGHTS);
        return isDeepEqual(expected, metadata);
    });

    test.assert("RUNS: funnels?", () => {
        clearConfig(null, true);
        const expected = {
            workspace_id: WORKSPACE_ID,
            project_id: PROJECT_ID,
            report_id: FUNNELS_REPORT_ID,
            report_desc: FUNNELS_REPORT_DESC,
            report_type: "funnels",
            report_name: FUNNELS_REPORT_NAME,
            report_creator: REPORT_CREATOR,
            dashboard_id: DASHBOARD_ID
        };

        const [sheet, metadata] = testSyncMpToSheets(TEST_CONFIG_REPORTS_FUNNELS);
        return isDeepEqual(expected, metadata);
    });

    test.assert("RUNS: retention?", () => {
        clearConfig(null, true);
        const expected = {
            workspace_id: WORKSPACE_ID,
            project_id: PROJECT_ID,
            report_id: RETENTION_REPORT_ID,
            report_desc: RETENTION_REPORT_DESC,
            report_type: "retention",
            report_name: RETENTION_REPORT_NAME,
            report_creator: REPORT_CREATOR,
            dashboard_id: DASHBOARD_ID
        };

        const [sheet, metadata] = testSyncMpToSheets(TEST_CONFIG_REPORTS_RETENTION);
        return isDeepEqual(expected, metadata);
    });

    test.assert("RUNS: cohorts?", () => {
        clearConfig(null, true);
        const expected = {
            cohort_desc: COHORT_DESC,
            project_id: PROJECT_ID,
            cohort_name: COHORT_NAME,
            cohort_id: COHORT_ID,
            cohort_count: COHORT_COUNT
        };

        const [sheet, metadata] = testSyncMpToSheets(TEST_CONFIG_COHORTS);
        return isDeepEqual(expected, metadata);
    });

    test.catchErr("RUNS: flows (throws)?", "flows report is not currently supported for CSV export", () => {
        clearConfig(null, true);
        testSyncMpToSheets(TEST_CONFIG_REPORTS_FLOWS);
    });

    /*
	----
	SYNCS
	----
	*/

    // Sheet → Mixpanel
    test.assert("SYNCS: events?", () => {
        clearConfig(null, true);
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("events"));
        const expected = {
            batches: 6,
            total: 10395,
            success: 10395,
            failed: 0,
            errors: [],
            record_type: "event"
        };
        const [resp, imported] = createSyncSheetsToMp(TEST_CONFIG_EVENTS, sheet);
        delete imported.seconds;
        delete imported.startTime;
        delete imported.endTime;
        return isDeepEqual(expected, imported) && getTriggers().length === 1;
    });

    test.assert("SYNCS: events?", () => {
        clearConfig(null, true);
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("events"));
        const expected = {
            batches: 6,
            total: 10395,
            success: 10395,
            failed: 0,
            errors: [],
            record_type: "event"
        };
        const [resp, imported] = createSyncSheetsToMp(TEST_CONFIG_EVENTS, sheet);
        delete imported.seconds;
        delete imported.startTime;
        delete imported.endTime;
        return isDeepEqual(expected, imported) && getTriggers().length === 1;
    });

    test.assert("SYNCS: groups?", () => {
        clearConfig(null, true);
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("groups"));
        const expected = {
            batches: 8,
            total: 1427,
            success: 1427,
            failed: 0,
            errors: [],
            record_type: "group"
        };
        const [resp, imported] = createSyncSheetsToMp(TEST_CONFIG_GROUPS, sheet);
        delete imported.seconds;
        delete imported.startTime;
        delete imported.endTime;
        return isDeepEqual(expected, imported) && getTriggers().length === 1;
    });

    test.assert("SYNCS: tables?", () => {
        clearConfig(null, true);
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("tables"));
        const expected = {
            batches: 1,
            total: 1,
            success: 1,
            failed: 0,
            errors: [],
            record_type: "table"
        };
        const [resp, imported] = createSyncSheetsToMp(TEST_CONFIG_TABLES, sheet);
        delete imported.seconds;
        delete imported.startTime;
        delete imported.endTime;
        return isDeepEqual(expected, imported) && getTriggers().length === 1;
    });

    // Mixpanel → Sheet
    test.assert("SYNCS: insights?", () => {
        clearConfig(null, true);
        const expected = {
            report_type: "insights",
            report_name: INSIGHTS_REPORT_NAME,
            report_desc: INSIGHTS_REPORT_DESC,
            report_id: INSIGHTS_REPORT_ID,
            project_id: PROJECT_ID,
            dashboard_id: DASHBOARD_ID,
            workspace_id: WORKSPACE_ID,
            report_creator: REPORT_CREATOR
        };

        const [sheet, metadata] = createSyncMpToSheets(TEST_CONFIG_REPORTS_INSIGHTS);
        return isDeepEqual(expected, metadata) && getTriggers().length === 1;
    });

    test.assert("SYNCS: funnels?", () => {
        clearConfig(null, true);
        const expected = {
            workspace_id: WORKSPACE_ID,
            project_id: PROJECT_ID,
            report_id: FUNNELS_REPORT_ID,
            report_desc: FUNNELS_REPORT_DESC,
            report_type: "funnels",
            report_name: FUNNELS_REPORT_NAME,
            report_creator: REPORT_CREATOR,
            dashboard_id: DASHBOARD_ID
        };

        const [sheet, metadata] = createSyncMpToSheets(TEST_CONFIG_REPORTS_FUNNELS);
        return isDeepEqual(expected, metadata) && getTriggers().length === 1;
    });

    test.assert("SYNCS: retention?", () => {
        clearConfig(null, true);
        const expected = {
            workspace_id: WORKSPACE_ID,
            project_id: PROJECT_ID,
            report_id: RETENTION_REPORT_ID,
            report_desc: RETENTION_REPORT_DESC,
            report_type: "retention",
            report_name: RETENTION_REPORT_NAME,
            report_creator: REPORT_CREATOR,
            dashboard_id: DASHBOARD_ID
        };

        const [sheet, metadata] = createSyncMpToSheets(TEST_CONFIG_REPORTS_RETENTION);
        return isDeepEqual(expected, metadata) && getTriggers().length === 1;
    });

    test.assert("SYNCS: cohorts?", () => {
        clearConfig(null, true);
        const expected = {
            cohort_desc: COHORT_DESC,
            project_id: PROJECT_ID,
            cohort_name: COHORT_NAME,
            cohort_id: COHORT_ID,
            cohort_count: COHORT_COUNT
        };

        const [sheet, metadata] = createSyncMpToSheets(TEST_CONFIG_COHORTS);
        return isDeepEqual(expected, metadata) && getTriggers().length === 1;
    });

    /*
	----
	E2E
	----
	*/

    test.assert("Sheet → MP: recovers on receipt delete", () => {
        clearConfig(null, true);
        const expected = { status: "success", error: [] };
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("events"));
        const [resp, imported, link, config] = createSyncSheetsToMp(TEST_CONFIG_EVENTS, sheet);
        deleteSheet(config.receipt_sheet);
        updateConfig("hashes", "[]");
        const nextSync = syncSheetsToMp();
        return isDeepEqual(expected, nextSync) && getTriggers().length === 1;
    });

    test.assert("Sheet → MP: cancels sync on source delete", () => {
        clearConfig(null, true);
        const tempSheetName = "tempSheet";
        const tempSheet = createSheet(tempSheetName);
        const tempSheetId = getSheetInfo(tempSheetName).sheet_id;
        const columns = `uuid,timestamp,action,favorite color,lucky number,insert`;
        overwriteSheet(columns, tempSheet);
        tempSheet.getRange(getEmptyRow(tempSheet), 1, 3, 6).setValues([
            ["7e1dd089-8773-5fc9-a3bc-37ba5f186ffe", new Date(), "link_click", "blue", "42", "A"],
            ["2e1dd089-8773-5fc9-a3bc-37ba5f186ffe", new Date(), "page_view", "purple", "420", "B"],
            ["3e1dd089-8773-5fc9-a3bc-37ba5f186ffe", new Date(), "watch_video", "green", "1", "C"]
        ]);
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName(tempSheetName));
        const [resp, imported, link, config] = createSyncSheetsToMp(TEST_CONFIG_EVENTS, sheet);
        deleteSheet(tempSheetId);
        const nextSync = syncSheetsToMp();
        return isDeepEqual("SYNC DELETED", nextSync) && getTriggers().length === 0;
    });

    test.assert("Sheet → MP: don't sync dupes", () => {
        clearConfig(null, true);
        const expected = {
            error: [
                {
                    error: "data with this hash has already been synced... skipping"
                }
            ],
            status: "success"
        };
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("events"));
        const [resp, imported, link, config] = createSyncSheetsToMp(TEST_CONFIG_EVENTS, sheet);
        deleteSheet(config.receipt_sheet);
        const nextSync = syncSheetsToMp();
        delete nextSync.error[0].hash;
        return isDeepEqual(expected, nextSync) && getTriggers().length === 1;
    });

    test.assert("MP → Sheet: recovers on receipt delete", () => {
        clearConfig(null, true);
        const expected = { status: "success", error: null };
        const [sheet, metadata, config] = createSyncMpToSheets(TEST_CONFIG_REPORTS_FUNNELS);
        deleteSheet(config.receipt_sheet);
        const nextSync = syncMpToSheets();
        return isDeepEqual(expected, nextSync) && getTriggers().length === 1;
    });

    test.assert("MP → Sheet: recovers on dest delete", () => {
        clearConfig(null, true);
        const expected = { status: "success", error: null };
        const [sheet, metadata, config] = createSyncMpToSheets(TEST_CONFIG_REPORTS_FUNNELS);
        deleteSheet(config.dest_sheet);
        const nextSync = syncMpToSheets();
        return isDeepEqual(expected, nextSync) && getTriggers().length === 1;
    });

    if (test.isInGas) tearDown();
    if (test.isInGas) test.printHeader(`SERVER SIDE TESTS END\n${formatDate()}`, false);

    //no way to see server-side output in console :(
    return `\nAppsScript: https://script.google.com/home/projects/1-e_9mTJFnWHvceBDod0OEkYP7B7fgfcxTYqggyoZGLyWOCfWvFge3hZO/executions\n\nGCP: https://cloudlogging.app.goo.gl/8Tkd7KQrnoLo9YCD8\n`;
}

if (typeof require !== "undefined") {
    //running locally; can require modules
    const UnitTestingApp = require("./UnitTestingApp.js");
    global.UnitTestingApp = UnitTestingApp;
    const Misc = require("../utilities/misc.js");
    global.Misc = Misc;

    //see .env-sample for an example configuration
    //right now these are not used
    require("dotenv").config();
    /** @type {Config} */
    const creds = {
        project_id: process.env.MP_PROJECT_ID,
        workspace_id: process.env.MP_WORKSPACE_ID,
        service_acct: process.env.MP_SERVICE_ACCT,
        service_secret: process.env.MP_SERVICE_SECRET,
        api_secret: process.env.MP_API_SECRET,
        token: process.env.MP_TOKEN,
        lookup_table_id: process.env.MP_LOOKUP_ID,
        cohort_id: process.env.MP_COHORT_ID,
        report_id: process.env.MP_REPORT_ID,
        region: "US"
    };
    global.creds = creds;
}

/**
 * If we're running locally, execute the tests. In GAS environment, runTests() needs to be executed manually
 */
(function () {
    /**
     * @param {Boolean} - if true, were're in the GAS environment, otherwise we're running locally
     */
    const IS_GAS_ENV = typeof ScriptApp !== "undefined";
    if (!IS_GAS_ENV) runTests();
})();

/*
----
TEARDOWN
----
*/

function tearDown() {
    clearConfig(null, true);
    clearTriggers(null, true);
    const ss = SpreadsheetApp.getActive();
    const goodSheets = ["events", "users", "groups", "tables", "smol", "adspend"];
    const badSheets = ss
        .getSheets()
        .map(getSheetInfo)
        .filter(sheet => !goodSheets.includes(sheet.sheet_name))
        .map(sheet => getSheet(Number(sheet.sheet_id)));

    for (const bad of badSheets) {
        ss.deleteSheet(bad);
    }
    return true;
}
