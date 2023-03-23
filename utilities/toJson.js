/* cSpell:disable */

/*
----
GET JSON DATA FROM SHEET
https://gist.github.com/jalcantarab/0eb43b13c97e4f784bd0be327f6ced52 (forked)
----
*/



/** 
 * getRowsData(Sheet) iterates row by row in the sheer and returns an array of objects.
 * Each object contains all the data for a given row, indexed by its normalized column name.
 * 
 * @params sheet - SpreadsheetApp>Sheet Class, the sheet object that contains the data to be processed.
 * @returns Object[] - an Array of objects with the headers as keys.
*/
function getJSON(sheet) {		
	// AK edit: we don't care if headers are frozen or not...
	const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
	const headers = range.getValues()[0];
	var dataRange = sheet.getRange(2, 1, sheet.getMaxRows(), sheet.getMaxColumns());
	
	// var headersRange = sheet.getRange(1, 1, sheet.getFrozenRows(), sheet.getMaxColumns());
	// var headers = headersRange.getValues()[0];
	// var dataRange = sheet.getRange(sheet.getFrozenRows() + 1, 1, sheet.getMaxRows(), sheet.getMaxColumns());
	
	return getObjects(dataRange.getValues(), normalizeHeaders(headers));
}

/** 
 * getObjects(String[], String[]), For every row in the data, generates an object.  
 * Names of object fields are defined in keys.
 * 
 * @params data - JavaScript 2d array.
 * @params keys - Array of Strings that define the property names for the objects to create.
 * @returns Object[] - JSON, an Array of objects.
*/
function getObjects(data, keys) {
	var objects = [];
	for (var i = 0; i < data.length; ++i) {
		var object = {};
		var hasData = false;
		for (var j = 0; j < data[i].length; ++j) {
			var cellData = data[i][j];
			if (isCellEmpty(cellData)) {
				continue;
			}
			object[keys[j]] = cellData;
			hasData = true;
		}
		if (hasData) {
			objects.push(object);
		}
	}
	return objects;
}

/** 
 * getColumnsData(Sheet Object, RangeElement[], int) iterates column by column in the input range and returns an array of objects.
 * Each object contains all the data for a given column, indexed by its normalized row name.
 * 
 * @params sheet - the sheet object that contains the data to be processed
 * @params range - the exact range of cells where the data is stored
 * @params (optional)rowHeadersColumnIndex - specifies the column number where the row names are stored.
 * @returns Object[] - an Array of objects.
*/
function getColumnsData(sheet, range, rowHeadersColumnIndex) {
	rowHeadersColumnIndex = rowHeadersColumnIndex || range.getColumnIndex() - 1;
	var headersTmp = sheet.getRange(range.getRow(), rowHeadersColumnIndex, range.getNumRows(), 1).getValues();
	var headers = normalizeHeaders(arrayTranspose(headersTmp)[0]);
	return getObjects(arrayTranspose(range.getValues()), headers);
}

/** 
 * normalizeHeaders(String[]) Returns an Array of normalized Strings.
 * 
 * @params headers - Array of raw headers
 * @returns String[] - Array of normalized headers.
*/
function normalizeHeaders(headers) {
	var keys = [];
	for (var i = 0; i < headers.length; ++i) {
		var key = normalizeHeader(headers[i]);
		if (key.length > 0) {
			keys.push(key);
		}
	}
	return keys;
}

/**
 * normalizeHeaders(String[]) Normalizes a string by removing all alphanumeric characters 
 * Uses camelCase to separate words. The output will always start with a lower case letter.
 * This function is designed to produce JavaScript object property names.
 * 
 * @params headers - Array of raw headers
 * @returns String[] - Array of normalized headers.
 * 
 * Examples:
 *   "First Name" -> "firstName"
 *   "Market Cap (millions) -> "marketCapMillions
 *   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
*/
function normalizeHeader(header) {
	//AK edit: don't noramlize headers; just return them
	return header;

	var key = "";
	var upperCase = false;
	for (var i = 0; i < header.length; ++i) {
		var letter = header[i];
		if (letter == " " && key.length > 0) {
			upperCase = true;
			continue;
		}
		if (!isAlnum(letter)) {
			continue;
		}
		if (key.length == 0 && isDigit(letter)) {
			continue; // first character must be a letter
		}
		if (upperCase) {
			upperCase = false;
			key += letter.toUpperCase();
		} else {
			key += letter.toLowerCase();
		}
	}
	return key;
}

/** 
 * isCellEmpty(String) Returns true if the cell where cellData was read from is empty.
 * 
 * @params cellData - an SpreadsheetApp Cell Object. 
 * @returns boolean - false if the string is empty. 
*/
function isCellEmpty(cellData) {
	return typeof (cellData) == "string" && cellData == "";
}

/**
 * isAlnum(char) Returns true if the character char is alphabetical, false otherwise.
 * 
 * @params char - a single character.
 * @returns boolean.
*/
function isAlnum(char) {
	return char >= 'A' && char <= 'Z' ||
		char >= 'a' && char <= 'z' ||
		isDigit(char);
}

/**
 * isDigit(char) Returns true if the character char is a digit, false otherwise.
 * 
 * @params char - a single character.
 * @returns boolean.
*/
function isDigit(char) {
	return char >= '0' && char <= '9';
}

/** 
 * isDigit(String[]) returns the transposed table of given 2d Array.
 * 
 * @params data - JavaScript 2d array.
 * @returns String[] - transposed 2d array.
 * Example: 
 *     arrayTranspose([[1,2,3],[4,5,6]]) returns [[1,4],[2,5],[3,6]]
*/
function arrayTranspose(data) {
	if (data.length == 0 || data[0].length == 0) {
		return null;
	}
	var ret = [];
	for (var i = 0; i < data[0].length; ++i) {
		ret.push([]);
	}

	for (var i = 0; i < data.length; ++i) {
		for (var j = 0; j < data[i].length; ++j) {
			ret[j][i] = data[i][j];
		}
	}
	return ret;
}