/*
----
DEBUG
a very simple debugger to be passed to clasp run
----
*/

function repl() {
	return {
		// repl code here

		all: SpreadsheetApp.getActive().getSheets()
			.map(sheet => { return { sheetName: sheet.getName(), id: sheet.getSheetId() }; }),

		current: {
			sheetName: SpreadsheetApp.getActiveSheet().getName(),
			id: SpreadsheetApp.getActiveSheet().getSheetId()
		}
	};
}