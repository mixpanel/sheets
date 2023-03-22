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
	}, 'properly forms pretty dates?');

	test.assert(() => {
		const expected = `[{"foo":"bar","baz":"qux"}]`;
		return Misc.serial([{ foo: "bar", baz: "qux" }]) === expected;
	}, 'can serialize objects?');

	console.log('\n\n');
	test.runInGas(true);

	/*
	----
	ONLINE TESTS
	----
	*/

	if (test.isInGas) test.printHeader(`SERVER SIDE TESTS\n${formatDate()}`, false);

	test.assert(() => {
		const correctHeaders = ['uuid', 'timestamp', 'action', 'favorite color', 'lucky number', 'insert'];
		const gotHeaders = getHeaders();
		return serial(correctHeaders) === serial(gotHeaders);
	}, 'can properly retrieve headers from spreadsheet?');

	test.assert(() => {
		const correctSheet = { sheetName: 'events', id: 2064569556 };
		const gotSheet = getSheetInfos();
		return serial(correctSheet) === serial(gotSheet);

	}, 'can resolve sheet metadata?');

	test.assert(() => {
		const expected = [{ error: null, status: 1 }, { error: null, status: 1 }];
		const trackLocal = tracker(undefined, 'ROBOT@aktunes.com');
		const results = trackLocal('server-side test');
		return serial(results) === serial(expected);
	}, 'can properly track data?');

	test.assert(() => {
		const expected = `2c18fe59700b6df244c24bae1bdfe403`;
		const results = MD5('yes, it is me, i am the one who knocks');
		return expected === results;
	}, 'can properly construct MD5 signatures?');


	// TRYING SOME E2E tests too...
	// these will not work as CREDS is not available server-side
	// test.assert(() => {

		// const sourceData = [['event_name', 'timestamp', 'uuid', 'misc'], ['foo', new Date('March 4, 2023 13:00:00 -0500'), 'bar', 'hey'], ['baz', new Date('March 4, 2023 14:00:00 -0500');, 'qux', 'you']];
	// 	/** @type {EventMappings} */
	// 	const mappings = { event_name_col: "action", distinct_id_col: "uuid", insert_id_col: "", time_col: "timestamp" };
	// 	const imported = importData({ ...creds, ...mappings, record_type: "event" });
	// 	console.log(imported)
	// 	return true;
	// }, 'can send events to /import? (no insert id)');

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