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

	/*
	----
	LOCAL TESTS
	tests are run locally
	----
	*/

	test.runInGas(false);
	test.printHeader('LOCAL TESTS');

	//misc.js
	test.assert('do tests work?', () => { return true; });

	test.assert('formats numbers?', () => {
		const expected = '1,000,000';
		return Misc.comma(1000000) === expected;
	},);

	test.assert('correctly batches?', () => {
		const expected = 2;
		return Misc.sliceIntoChunks([{}, {}, {}, {}], 2).length === expected;
	},);

	test.assert('turns JSON[] into CSV string?', () => {
		const expected = `foo,baz\nbar,qux`;
		return Misc.JSONtoCSV([{ foo: "bar", baz: "qux" }]) === expected;
	},);

	test.assert('forms pretty dates?', () => {
		const expected = `3/3/1901 @ 4:20am`;
		return Misc.formatDate(new Date(1, 2, 3, 4, 20)) === expected;
	},);

	test.assert('serializes objects?', () => {
		const expected = `[{"foo":"bar","baz":"qux"}]`;
		return Misc.serial([{ foo: "bar", baz: "qux" }]) === expected;
	},);

	test.assert('tests for deep equality?', () => {
		const ObjOne = { foo: "bar", baz: { qux: "mux" } };
		const ObjTwo = { baz: { qux: "mux" }, foo: "bar" };
		return Misc.isDeepEqual(ObjOne, ObjTwo);
	},);

	console.log('\n\n');

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
	test.assert('retrieves headers from sheet?', () => {
		const correctHeaders = ['uuid', 'timestamp', 'action', 'favorite color', 'lucky number', 'insert'];
		const gotHeaders = getSheetHeaders();
		return serial(correctHeaders) === serial(gotHeaders);
	});

	//misc
	test.assert('tracks data?', () => {
		const expected = [{ error: null, status: 1 }, { error: null, status: 1 }];
		const trackLocal = tracker(undefined, 'ROBOT@aktunes.com');
		const results = trackLocal('server-side test');
		return serial(results) === serial(expected);
	});

	test.assert('constructs MD5 signatures?', () => {
		const expected = `2c18fe59700b6df244c24bae1bdfe403`;
		const results = MD5('yes, it is me, i am the one who knocks');
		return expected === results;
	});

	//flush
	//todo

	//storage
	//todo

	//timers
	//todo

	//credentials
	test.assert('validates good service account?', () => {
		const expected = GOOD_SERVICE_ACCOUNT.answer;
		return validateCreds(GOOD_SERVICE_ACCOUNT) === expected;
	});

	test.assert('validates good api secret?', () => {
		const expected = GOOD_API_SECRET.answer;
		return validateCreds(GOOD_API_SECRET) === expected;
	});

	test.catchErr('throws bad service account?', 'Not a valid service account username', () => {
		validateCreds(BAD_SERVICE_ACCOUNT);
	});

	test.catchErr('throws bad project?', 'not a project member', () => {
		validateCreds(BAD_PROJECT_SERVICE_ACCOUNT);
	});

	test.catchErr('throws bad api secret?', 'Unauthorized, invalid project secret. See docs for more information: https://developer.mixpanel.com/reference/authentication#project-secret', () => {
		validateCreds(BAD_API_SECRET);
	});

	test.catchErr('throws bad api project?', `Mismatch between project secret's project ID and URL project ID`, () => {
		validateCreds(BAD_PROJECT_API_SECRET);
	});

	// syncs: Sheet → Mixpanel
	test.assert('syncs events?', () => {
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
	});

	test.assert('syncs users?', () => {
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
	});

	test.assert('syncs groups?', () => {
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
	});

	test.assert('syncs tables?', () => {
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
	});

	//syncs: Mixpanel → Sheet
	test.assert('syncs insights reports?', () => {
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
	});

	test.assert('syncs funnels reports?', () => {
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
	});


	test.assert('syncs retention reports?', () => {
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
	});

	test.assert('syncs cohorts?', () => {
		const expected = {
			cohort_desc: 'lucky number is bigger than 70',
			project_id: 2943452,
			cohort_name: 'cool peeps',
			cohort_id: 2789763,
			cohort_count: 1617
		};

		const results = testSyncMpToSheets(TEST_CONFIG_COHORTS);
		return isDeepEqual(expected, results.metadata);
	});

	if (test.isInGas) test.printHeader(`SERVER SIDE TESTS END\n${formatDate()}`, false);

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