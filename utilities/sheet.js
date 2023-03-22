/*
----
GET, CREATE AND UPDATE SHEETS + TABS
----
*/


// GETTERS

/**
 * fetch headers from current sheet
 * @returns {string[]}
 */
function getHeaders() {
	const sheet = SpreadsheetApp.getActiveSheet();
	const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
	const headers = range.getValues()[0]; //only first 'row'
	return headers;
}

/**
 * get the current sheet's info
 * @returns {SheetInfo}
 */
function getSheetInfos() {
	return {
		sheetName: SpreadsheetApp.getActiveSheet().getName(),
		id: SpreadsheetApp.getActiveSheet().getSheetId()
	};
}



// SETTERS

/**
 * updates a spreadsheet; either by replacing it or appending
 * @param  {SheetInfo} sheetInfo
 * @param  {'string'} csvString
 * @param  {boolean} append=false
 */
function updateSpreadsheet(sheetInfo, csvString, append = false) {	
	const sheet = SpreadsheetApp.getActive().getSheetId(sheetInfo.sheet_id);
	var csvData = Utilities.parseCsv(csvString);
	//todo appends
	sheet.getRange(1, 1, csvData.length, csvData[0].length).setValues(csvData);
}



// CREATORS

/**
 * creates a new 'tab' in the sheet; if tab exists, it returns it
 * @param  {'string'} [title='mixpanel sync log'] title for sheet
 * @returns {SheetInfo}
 */
function createTab(title = 'mixpanel sync log') {
	const ss = SpreadsheetApp.getActive();

	try {
		const newSheet = ss.insertSheet(title);
		const sheetInfos = getSheetInfos();
		return sheetInfos;
	}

	catch (e) {
		const existingSheet = SpreadsheetApp.setActiveSheet(ss.getSheetByName(title));
		const sheetInfos = getSheetInfos();
		return sheetInfos;
	}

}


