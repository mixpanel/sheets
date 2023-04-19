/* cSpell:disable */
// @ts-nocheck

/*
----
DEBUG
a very simple debugger to be passed to clasp run
----
*/

function repl() {
    return 'hello there!'
}

if (typeof module !== "undefined") {
    module.exports = { repl };
}
