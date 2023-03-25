/*
----
GET, CREATE AND UPDATE SHEETS + TABS
----
*/


// GETTERS

/**
 * fetch headers from current sheet
 * 
 * @returns {string[]}
 */
function getSheetHeaders() {
	const sheet = SpreadsheetApp.getActiveSheet();
	const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
	const headers = range.getValues()[0]; //only first 'row'
	return headers;
}

/**
 * get an existing sheet info or current sheet's info
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} [sheet]
 * @returns {SheetInfo}
 */
function getSheetInfo(sheet) {
	if (sheet) {
		return {
			name: sheet.getSheetName(),
			id: sheet.getSheetId()
		};
	}
	return {
		name: SpreadsheetApp.getActiveSheet().getName(),
		id: SpreadsheetApp.getActiveSheet().getSheetId()
	};
}
/**
 * get sheet reference by Id... idk why google doesn't have this
 * 
 * @param  {number} id sheet id
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheetById(id) {
	return SpreadsheetApp.getActive().getSheets().filter(
		function (s) { return s.getSheetId() === id; }
	)[0];
}

// SETTERS

/**
 * updates a spreadsheet; either by replacing it or appending
 * 
 * @param  {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param  {string} csvString
 * @param  {boolean} append=false
 * @returns {SheetInfo}
 */
function updateSheet(csvString, sheet, append = false) {
	var csvData = Utilities.parseCsv(csvString);
	if (append) {

	}
	sheet.getRange(1, 1, csvData.length, csvData[0].length).setValues(csvData);
	return getSheetInfo(sheet);
}



// CREATORS

/**
 * creates a new 'tab' in the sheet and returns it; if tab exists, it returns it
 * 
 * @param  {'string'} [title='mixpanel sync log'] title for sheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function createSheet(title = 'mixpanel sync log') {
	const ss = SpreadsheetApp.getActive();

	try {
		const newSheet = ss.insertSheet(title);
		return newSheet;
	}

	//sheet probably exists
	catch (e) {
		const existingSheet = ss.getSheetByName(title);
		return existingSheet;
	}

}


