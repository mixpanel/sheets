/*
----
MIXPANEL TABLES
----
*/

function modelMpTables(row) {
    // tables don't need to be modeled
    return row;
}


if (typeof module !== "undefined") {
    module.exports = { modelMpTables };
}
