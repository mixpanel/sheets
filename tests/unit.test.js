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


	test.assert(() => {
		const expected = 10395;
		const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_EVENTS, { name: 'events', id: 2064569556 });
		return imported.results.success === expected;
	}, 'can test sync events?');

	test.assert(() => {
		const expected = 6999;
		const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_USERS, { name: 'users', id: 114220481 });
		return imported.results.success === expected;
	}, 'can test sync users?');

	test.assert(() => {
		const expected = 1427;
		const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_GROUPS, { name: 'groups', id: 2092562870 });
		return imported.results.success === expected;
	}, 'can test sync groups?');

	test.assert(() => {
		const expected = 1;
		const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_TABLES, { name: 'tables', id: 819636403 });
		return imported.results.success === expected;
	}, 'can test sync tables?');

	test.assert(() => {
		const expected = {
			report_type: 'insights',
			report_name: 'an insights report',
			report_desc: 'an insights report',
			report_id: 'an insights report',
			project_id: 2943452,
			dashboard_id: 4690699,
			workspace_id: 3466588,
			report_creator_name: 'AK ',
			report_creator_email: undefined
		};

		const results = testSyncMpToSheets(TEST_CONFIG_REPORTS);
		return serial(expected) === serial(results.metadata);
	}, 'can test sync insights report?');


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