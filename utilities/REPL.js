/* cSpell:disable */
// @ts-nocheck

/*
----
DEBUG
a very simple debugger to be passed to clasp run
----
*/

function repl() {
   //the code you write here will run server-side in GAS
   //use npm run watch-server-debug for a near REPL experience
	return true
}

if (typeof module !== "undefined") {
    module.exports = { repl };
}
