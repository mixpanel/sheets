/* cSpell:disable */
// @ts-nocheck

/*
----
DEBUG
a very simple debugger to be passed to clasp run
----
*/

function repl() {
    //code here!
    const sheet = getSheetInfo(SpreadsheetApp.getActive().getSheetByName("events"));
    const expected = {
        batches: 6,
        total: 10395,
        success: 10395,
        failed: 0,
        errors: [],
        record_type: "event"
    };
    const [resp, imported] = testSyncSheetsToMp(TEST_CONFIG_EVENTS, sheet);
    delete imported.seconds;
    return [isDeepEqual(expected, imported), expected, imported];
}

if (typeof module !== "undefined") {
    module.exports = { repl };
}
