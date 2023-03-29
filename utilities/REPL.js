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
    return testSyncMpToSheets(TEST_CONFIG_REPORTS_FUNNELS);
    
}

if (typeof module !== "undefined") {
    module.exports = { repl };
}
