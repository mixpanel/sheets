/*
----
GET, CREATE AND UPDATE SHEETS + TABS
----
*/

// GETTERS

/**
 * utility to get reference to a sheet by any possible identifier
 *
 * @param  {GoogleAppsScript.Spreadsheet.Sheet | number | string} [sheetIdentifier]
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(sheetIdentifier) {
    const { sheet_id } = getSheetInfo(sheetIdentifier);
    const sheet = getSheetById(sheet_id);
    return sheet;
}

/**
 * utility to get an existing sheet's name and id OR current sheet's info
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet | number | string} [sheet]
 * @returns {SheetInfo}
 */
function getSheetInfo(sheet) {
    if (typeof sheet === "object") {
        return {
            sheet_name: sheet.getSheetName(),
            sheet_id: sheet.getSheetId()
        };
    }

    if (typeof sheet === "string") {
        const foundSheet = SpreadsheetApp.getActive().getSheetByName(sheet);
        return {
            sheet_name: foundSheet.getSheetName(),
            sheet_id: foundSheet.getSheetId()
        };
    }

    if (typeof sheet === "number") {
        const foundSheet = getSheetById(sheet);
        return {
            sheet_name: foundSheet.getSheetName(),
            sheet_id: foundSheet.getSheetId()
        };
    }

    return {
        sheet_name: SpreadsheetApp.getActiveSheet().getName(),
        sheet_id: SpreadsheetApp.getActiveSheet().getSheetId()
    };
}

/**
 * fetch headers from sheet or current sheet
 * @param {GoogleAppsScript.Spreadsheet.Sheet} [sheet]
 * @returns {string[]}
 */
function getSheetHeaders(sheet) {
    if (!sheet) sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    const headers = range.getValues()[0]; //only first 'row'
    return headers;
}

/**
 * get sheet reference by Id... idk why google doesn't have this
 *
 * @param  {number} id sheet id
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheetById(id) {
    return SpreadsheetApp.getActive()
        .getSheets()
        .filter(function (s) {
            return s.getSheetId() === id;
        })[0];
}

/**
 * get the first empty row
 * @param  {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {number}
 */
function getEmptyRow(sheet) {
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSheet();
    }
    var range = sheet.getDataRange();
    var values = range.getValues();
    var row = 0;
    for (var row = 0; row < values.length; row++) {
        if (!values[row].join("")) break;
    }
    return row + 1;
}

// SETTERS

/**
 * overwrites the contents of a spreadsheet with new data
 *
 * @param  {string} csvString
 * @param  {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {SheetInfo}
 */
function overwriteSheet(csvString, sheet) {
    var csvData = Utilities.parseCsv(csvString);
    sheet.getRange(1, 1, csvData.length, csvData[0].length).setValues(csvData);
    return getSheetInfo(sheet);
}

// CREATORS

/**
 * creates a new 'tab' in the sheet and returns it; if tab exists, it returns it
 *
 * @param  {string} [title='mixpanel sync log'] title for sheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function createSheet(title = "mixpanel sync log") {
    const ss = SpreadsheetApp.getActive();

    try {
        const newSheet = ss.insertSheet(title);
        return newSheet;
    } catch (e) {
        //sheet probably exists
        const existingSheet = ss.getSheetByName(title);
        return existingSheet;
    }
}

// DELETE

/**
 * deletes a sheet, by name, Id, or sheet itself
 * @param  {GoogleAppsScript.Spreadsheet.Sheet | string | number} sheet
 * @returns {{}}
 */
function deleteSheet(sheet) {
    const ss = SpreadsheetApp.getActive();

    if (typeof sheet === "string") sheet = ss.getSheetByName(sheet);
    if (typeof sheet === "number") sheet = getSheetById(sheet);

    ss.deleteSheet(sheet);
    return {};
}

if (typeof module !== "undefined") {
    module.exports = {
        overwriteSheet,
        createSheet,
        deleteSheet,
        getSheetHeaders,
        getSheetInfo,
        getSheetById,
        getSheet,
		getEmptyRow
    };
}
