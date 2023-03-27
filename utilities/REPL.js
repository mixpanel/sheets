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
    const expected = { foo: "bar", baz: "qux", mux: "dux" };
    const results = setConfig(expected);
    clearConfig();
    return [expected, results];
}



if (typeof module !== "undefined") {
    module.exports = { repl };
}