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
        return (
            Misc.serial(original) === Misc.serial(cloned) &&
            Misc.isDeepEqual(original, cloned) &&
            cloned !== original
        );
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
    if (test.isInGas) test.printHeader(`SERVER SIDE TESTS START\n${formatDate()}`, false);

    //sheets
    test.assert("MISC: retrieves headers from sheet?", () => {
        const correctHeaders = ["uuid", "timestamp", "action", "favorite color", "lucky number", "insert"];
        const sheet = SpreadsheetApp.getActive().getSheetByName("events");
        const gotHeaders = getSheetHeaders(sheet);
        return serial(correctHeaders) === serial(gotHeaders);
    });

    //misc
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

    //flush
    test.assert("FLUSH: events?", () => {
        const expected = [{ code: 200, num_records_imported: 1, status: "OK" }];
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

    //storage
    test.assert("STORAGE: save?", () => {
        clearConfig();
        const expected = { foo: "bar", baz: "qux", mux: "dux" };
        const results = setConfig(expected);
        clearConfig();
        return isDeepEqual(expected, results);
    });

    test.assert("STORAGE: get?", () => {
        clearConfig();
        const expected = { foo: "bar", baz: "qux", mux: "dux" };
        setConfig(expected);
        const results = getConfig();
        clearConfig();
        return isDeepEqual(expected, results);
    });

    test.assert("STORAGE: clear?", () => {
        const expected = {};
        const results = clearConfig();
        return isDeepEqual(expected, results);
    });

    //credentials
    test.assert("CREDS: good service account?", () => {
        const expected = GOOD_SERVICE_ACCOUNT.answer;
        return validateCreds(GOOD_SERVICE_ACCOUNT) === expected;
    });

    test.assert("CREDS: good api secret?", () => {
        const expected = GOOD_API_SECRET.answer;
        return validateCreds(GOOD_API_SECRET) === expected;
    });

    test.catchErr("CREDS: bad service account?", "Not a valid service account username", () => {
        validateCreds(BAD_SERVICE_ACCOUNT);
    });

    test.catchErr("CREDS: bad project?", "not a project member", () => {
        validateCreds(BAD_PROJECT_SERVICE_ACCOUNT);
    });

    test.catchErr(
        "CREDS: bad api secret?",
        "Unauthorized, invalid project secret. See docs for more information: https://developer.mixpanel.com/reference/authentication#project-secret",
        () => {
            validateCreds(BAD_API_SECRET);
        }
    );

    test.catchErr(
        "CREDS: bad api project?",
        `Mismatch between project secret's project ID and URL project ID`,
        () => {
            validateCreds(BAD_PROJECT_API_SECRET);
        }
    );

    /*
	----
	TEST RUNS
	----
	*/

    // Sheet → Mixpanel
    test.assert("TESTS: events?", () => {
        clearConfig();
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
        clearConfig();
        return isDeepEqual(expected, imported);
    });

    test.assert("TESTS: users?", () => {
        clearConfig();
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
        clearConfig();
        return isDeepEqual(expected, imported);
    });

    test.assert("TESTS: groups?", () => {
        clearConfig();
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
        clearConfig();
        return isDeepEqual(expected, imported);
    });

    test.assert("TESTS: tables?", () => {
        clearConfig();
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
        clearConfig();
        return isDeepEqual(expected, imported);
    });

    // Mixpanel → Sheet
    test.assert("TESTS: insights?", () => {
        clearConfig();
        const expected = {
            report_type: "insights",
            report_name: "an insights report",
            report_desc: "an insights report",
            report_id: 38075731,
            project_id: 2943452,
            dashboard_id: 4690699,
            workspace_id: 3466588,
            report_creator: "AK "
        };

        const [sheet, metadata] = testSyncMpToSheets(TEST_CONFIG_REPORTS_INSIGHTS);
        clearConfig();
        return isDeepEqual(expected, metadata);
    });

    test.assert("TESTS: funnels?", () => {
        clearConfig();
        const expected = {
            workspace_id: 3466588,
            project_id: 2943452,
            report_id: 38075728,
            report_desc: "a funnel report",
            report_type: "funnels",
            report_name: "a funnel report",
            report_creator: "AK ",
            dashboard_id: 4690699
        };

        const [sheet, metadata] = testSyncMpToSheets(TEST_CONFIG_REPORTS_FUNNELS);
        clearConfig();
        return isDeepEqual(expected, metadata);
    });

    test.assert("TESTS: retention?", () => {
        clearConfig();
        const expected = {
            workspace_id: 3466588,
            project_id: 2943452,
            report_id: 38075736,
            report_desc: "a retention report",
            report_type: "retention",
            report_name: "a retention report",
            report_creator: "AK ",
            dashboard_id: 4690699
        };

        const [sheet, metadata] = testSyncMpToSheets(TEST_CONFIG_REPORTS_RETENTION);
        clearConfig();
        return isDeepEqual(expected, metadata);
    });

    test.assert("TESTS: cohorts?", () => {
        clearConfig();
        const expected = {
            cohort_desc: "lucky number is bigger than 70",
            project_id: 2943452,
            cohort_name: "cool peeps",
            cohort_id: 2789763,
            cohort_count: 1617
        };

        const [sheet, metadata] = testSyncMpToSheets(TEST_CONFIG_COHORTS);
        clearConfig();
        return isDeepEqual(expected, metadata);
    });

    test.catchErr("TESTS: flows (throws)?", "flows reports are not currently supported for CSV export", () => {
        clearConfig();
        testSyncMpToSheets(TEST_CONFIG_REPORTS_FLOWS);
    });

    /*
	----
	SYNC RUNS
	----
	*/

    // Sheet → Mixpanel
    test.assert("SYNCS: events?", () => {
        clearConfig();
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

    test.assert("SYNCS: users?", () => {
        clearConfig();
        const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("users"));
        const expected = {
            batches: 4,
            total: 6999,
            success: 6999,
            failed: 0,
            errors: [],
            record_type: "user"
        };
        const [resp, imported] = createSyncSheetsToMp(TEST_CONFIG_USERS, sheet);
        delete imported.seconds;
        delete imported.startTime;
        delete imported.endTime;
        return isDeepEqual(expected, imported) && getTriggers().length === 1;
    });

    test.assert("SYNCS: groups?", () => {
        clearConfig();
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
        clearConfig();
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
        clearConfig();
        const expected = {
            report_type: "insights",
            report_name: "an insights report",
            report_desc: "an insights report",
            report_id: 38075731,
            project_id: 2943452,
            dashboard_id: 4690699,
            workspace_id: 3466588,
            report_creator: "AK "
        };

        const [sheet, metadata] = createSyncMpToSheets(TEST_CONFIG_REPORTS_INSIGHTS);
        return isDeepEqual(expected, metadata) && getTriggers().length === 1;
    });

    test.assert("SYNCS: funnels?", () => {
        clearConfig();
        const expected = {
            workspace_id: 3466588,
            project_id: 2943452,
            report_id: 38075728,
            report_desc: "a funnel report",
            report_type: "funnels",
            report_name: "a funnel report",
            report_creator: "AK ",
            dashboard_id: 4690699
        };

        const [sheet, metadata] = createSyncMpToSheets(TEST_CONFIG_REPORTS_FUNNELS);
        return isDeepEqual(expected, metadata) && getTriggers().length === 1;
    });

    test.assert("SYNCS: retention?", () => {
        clearConfig();
        const expected = {
            workspace_id: 3466588,
            project_id: 2943452,
            report_id: 38075736,
            report_desc: "a retention report",
            report_type: "retention",
            report_name: "a retention report",
            report_creator: "AK ",
            dashboard_id: 4690699
        };

        const [sheet, metadata] = createSyncMpToSheets(TEST_CONFIG_REPORTS_RETENTION);
        return isDeepEqual(expected, metadata) && getTriggers().length === 1;
    });

    test.assert("SYNCS: cohorts?", () => {
        clearConfig();
        const expected = {
            cohort_desc: "lucky number is bigger than 70",
            project_id: 2943452,
            cohort_name: "cool peeps",
            cohort_id: 2789763,
            cohort_count: 1617
        };

        const [sheet, metadata] = createSyncMpToSheets(TEST_CONFIG_COHORTS);
        return isDeepEqual(expected, metadata) && getTriggers().length === 1;
    });

    test.catchErr("SYNCS: flows (throws)?", "flows reports are not currently supported for CSV export", () => {
        createSyncMpToSheets(TEST_CONFIG_REPORTS_FLOWS);
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
    clearConfig();
    const ss = SpreadsheetApp.getActive();
    const goodSheets = ["events", "users", "groups", "tables"];
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
