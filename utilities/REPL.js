/* cSpell:disable */
// @ts-nocheck

/*
----
DEBUG
a very simple debugger to be passed to clasp run
----
*/

function repl() {
    clearConfig();
     return testSyncMpToSheets(TEST_CONFIG_COHORTS);
}

if (typeof module !== "undefined") {
    module.exports = { repl };
}
