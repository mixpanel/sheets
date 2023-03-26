/*
----
TRIGGERS
----
*/

//todo

function clearTriggers() {
    const syncs = ScriptApp.getProjectTriggers();
    for (const sync of syncs) {
        ScriptApp.deleteTrigger(sync);
    }
    return {};
}

function getTriggers() {
    return ScriptApp.getProjectTriggers();
}
