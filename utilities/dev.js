/* cSpell:disable */

/*
----
DEBUG
a very simple debugger to be passed to clasp run
----
*/

function repl() {
	//code here! 

	// return [
	// 	getSheetInfo(SpreadsheetApp.getActive().getSheetByName('events')),
	// 	getSheetInfo(SpreadsheetApp.getActive().getSheetByName('users')),
	// 	getSheetInfo(SpreadsheetApp.getActive().getSheetByName('groups')),
	// 	getSheetInfo(SpreadsheetApp.getActive().getSheetByName('tables')),
	// ]

	return testSyncSheetsToMp(TEST_CONFIG_TABLES, { name: 'tables', id: 819636403 })


	// repl code here
	// return getSheetInfo()
	// const foo = tracker({ foo: "bar", baz: "qux" });
	// return foo('hey', { you: 'guys' });

	// return {


	// 	all: SpreadsheetApp.getActive().getSheets()
	// 		.map(sheet => { return { sheetName: sheet.getName(), id: sheet.getSheetId() }; }),

	// 	current: {
	// 		sheetName: SpreadsheetApp.getActiveSheet().getName(),
	// 		id: SpreadsheetApp.getActiveSheet().getSheetId()
	// 	}
	// };
}