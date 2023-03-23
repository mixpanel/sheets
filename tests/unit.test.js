/*
----
TEST RUNNER
? https://github.com/WildH0g/UnitTestingApp#readme
----
*/

if (typeof require !== 'undefined') {
	//running locally; can require modules
	const UnitTestingApp = require('./UnitTestingApp.js');
	global.UnitTestingApp = UnitTestingApp;
	const Misc = require('../utilities/misc.js');
	global.Misc = Misc;

	//IMPORTANT: where secrets go
	//see .env-sample for an example configuration
	require('dotenv').config();
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
 * Runs the tests; insert online and offline tests where specified by comments
 * @returns {void}
 */
function runTests() {
	const test = new UnitTestingApp();
	test.enable();
	test.clearConsole();

	test.runInGas(false);
	test.printHeader('LOCAL TESTS');
	/*
	----
	LOCAL TESTS
	----
	*/

	//misc.js
	test.assert(() => {
		return true;
	}, 'do tests work?');

	test.assert(() => {
		const expected = '1,000,000';
		return Misc.comma(1000000) === expected;
	}, 'can numbers be formatted?');

	test.assert(() => {
		const expected = 2;
		return Misc.sliceIntoChunks([{}, {}, {}, {}], 2).length === expected;
	}, 'does batching work?');

	test.assert(() => {
		const expected = `foo,baz\nbar,qux`;
		return Misc.JSONtoCSV([{ foo: "bar", baz: "qux" }]) === expected;
	}, 'can turn JSON[] into CSV string');

	test.assert(() => {
		const expected = `3/3/1901 @ 4:20am`;
		return Misc.formatDate(new Date(1, 2, 3, 4, 20)) === expected;
	}, 'forms pretty dates?');

	test.assert(() => {
		const expected = `[{"foo":"bar","baz":"qux"}]`;
		return Misc.serial([{ foo: "bar", baz: "qux" }]) === expected;
	}, 'can serialize objects?');

	test.assert(() => {
		const ObjOne = { foo: "bar", baz: { qux: "mux" } };
		const ObjTwo = { baz: { qux: "mux" }, foo: "bar" };
		return Misc.isDeepEqual(ObjOne, ObjTwo);
	}, 'can test for deep equality?');

	console.log('\n\n');
	test.runInGas(true);

	/*
	----
	ONLINE TESTS
	 ... attempting E2E ... it's dicey
	----
	*/

	if (test.isInGas) test.printHeader(`SERVER SIDE TESTS\n${formatDate()}`, false);

	test.assert(() => {
		const correctHeaders = ['uuid', 'timestamp', 'action', 'favorite color', 'lucky number', 'insert'];
		const gotHeaders = getSheetHeaders();
		return serial(correctHeaders) === serial(gotHeaders);
	}, 'can retrieve headers from spreadsheet?');


	test.assert(() => {
		const expected = [{ error: null, status: 1 }, { error: null, status: 1 }];
		const trackLocal = tracker(undefined, 'ROBOT@aktunes.com');
		const results = trackLocal('server-side test');
		return serial(results) === serial(expected);
	}, 'can track data?');

	test.assert(() => {
		const expected = `2c18fe59700b6df244c24bae1bdfe403`;
		const results = MD5('yes, it is me, i am the one who knocks');
		return expected === results;
	}, 'can construct MD5 signatures?');

	/*
	----
	these tests depend on sheets to be named
	'events', 'users', 'groups', 'tables'
	see ./testData if you need to rebuild test data
	----
	*/

	test.assert(() => {
		const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName('events'));
		const expected = {
			batches: 6,
			total: 10395,
			success: 10395,
			failed: 0,
			errors: []
		};
		const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_EVENTS, sheet);
		delete imported.results.seconds;
		return isDeepEqual(expected, imported.results);
	}, 'can test sync events?');

	test.assert(() => {
		const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName('users'));
		const expected = {
			batches: 4,
			total: 6999,
			success: 6999,
			failed: 0,
			errors: []
		};
		const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_USERS, sheet);
		delete imported.results.seconds;
		return isDeepEqual(expected, imported.results);
	}, 'can test sync users?');

	test.assert(() => {
		const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName('groups'));
		const expected = {
			batches: 8,
			total: 1427,
			success: 1427,
			failed: 0,
			errors: []
		};
		const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_GROUPS, sheet);
		delete imported.results.seconds;
		return isDeepEqual(expected, imported.results);
	}, 'can test sync groups?');

	test.assert(() => {
		const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName('tables'));
		const expected = {
			batches: 1,
			total: 1,
			success: 1,
			failed: 0,
			errors: []
		};
		const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_TABLES, sheet);
		delete imported.results.seconds;
		return isDeepEqual(expected, imported.results);
	}, 'can test sync tables?');

	test.assert(() => {
		const expected = {
			report_type: 'insights',
			report_name: 'an insights report',
			report_desc: 'an insights report',
			report_id: 38075731,
			project_id: 2943452,
			dashboard_id: 4690699,
			workspace_id: 3466588,
			report_creator: 'AK '			
		};

		const results = testSyncMpToSheets(TEST_CONFIG_REPORTS_INSIGHTS);
		return isDeepEqual(expected, results.metadata);
	}, 'can test sync insights report?');

	test.assert(() => {
		const expected = {
			workspace_id: 3466588,
			project_id: 2943452,
			report_id: 38075728,
			report_desc: 'a funnel report',
			report_type: 'funnels',
			report_name: 'a funnel report',
			report_creator: 'AK ',
			dashboard_id: 4690699
		};

		const results = testSyncMpToSheets(TEST_CONFIG_REPORTS_FUNNELS);
		return isDeepEqual(expected, results.metadata);
	}, 'can test sync funnels report?');


	test.assert(() => {
		const expected = {
			workspace_id: 3466588,
			project_id: 2943452,
			report_id: 38075736,
			report_desc: 'a retention report',
			report_type: 'retention',
			report_name: 'a retention report',
			report_creator: 'AK ',
			dashboard_id: 4690699
		};

		const results = testSyncMpToSheets(TEST_CONFIG_REPORTS_RETENTION);
		return isDeepEqual(expected, results.metadata);
	}, 'can test sync retention report?');

	test.assert(() => {
		const expected = {
			cohort_desc: 'lucky number is bigger than 70',
			project_id: 2943452,
			cohort_name: 'cool peeps',
			cohort_id: 2789763,
			cohort_count: 1617
		};

		const results = testSyncMpToSheets(TEST_CONFIG_COHORTS);
		return isDeepEqual(expected, results.metadata);
	}, 'can test sync cohort?');


	//no way to see server-side output in console :( 
	return `\nAppsScript: https://script.google.com/home/projects/1-e_9mTJFnWHvceBDod0OEkYP7B7fgfcxTYqggyoZGLyWOCfWvFge3hZO/executions\n\nGCP: https://cloudlogging.app.goo.gl/8Tkd7KQrnoLo9YCD8\n`;
}

/**
 * If we're running locally, execute the tests. In GAS environment, runTests() needs to be executed manually
 */
(function () {
	/**
   * @param {Boolean} - if true, were're in the GAS environment, otherwise we're running locally
   */
	const IS_GAS_ENV = typeof ScriptApp !== 'undefined';
	if (!IS_GAS_ENV) runTests();
})();