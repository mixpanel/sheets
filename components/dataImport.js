/*
----
DATA INTO MP
----
*/

/**
 * import data from sheet; if not called with a config, uses last known
 *
 * @param  {SheetMpConfig} [config]
 * @param {GoogleAppsScript.Spreadsheet.Sheet} [sheet]
 * @returns {[ImportResponse[], ImportResults]}
 */
function importData(config, sheet) {
    const runId = Math.random();
    //use last known config if unset
    if (!config) config = getConfig();
    if (!config.auth) config.auth = validateCreds(config);
    const { record_type } = config;

    // console.log('SYNC');
    const startTime = Date.now();
    const mappings = getMappings(config);
    const cleanConfig = getMixpanelConfig(config);
    const transform = getTransformType(cleanConfig);

    const sourceData = getJSON(sheet);

    const targetData = sourceData.slice().map(row => transform(row, mappings, cleanConfig));

    const imported = flushToMixpanel(targetData, cleanConfig);
    const endTime = Date.now();

    const summary = summarizeImport(cleanConfig, imported, startTime, endTime, targetData);

    if (cleanConfig.results.errors.length > 0) {
        Logger.log("FAILED REQUESTS");
        Logger.log(cleanConfig.results.errors);
    }

    return [imported, summary];
}

/**
 * clean version of mappings; don't trust the front-end
 *
 * @param  {SheetMpConfig} config
 * @returns {EventMappings | UserMappings | GroupMappings | TableMappings}
 */
function getMappings(config) {
    const {
        record_type,
        event_name_col,
        distinct_id_col,
        time_col,
        insert_id_col,
        name_col,
        email_col,
        avatar_col,
        created_col,
        profile_operation,
        lookup_table_id,
        group_key
    } = config;

    if (record_type === "event") {
        return {
            distinct_id_col,
            event_name_col,
            time_col,
            insert_id_col
        };
    }

    if (record_type === "user") {
        return {
            distinct_id_col,
            name_col,
            email_col,
            avatar_col,
            created_col,
            profile_operation
        };
    }

    if (record_type === "group") {
        return {
            group_key,
            distinct_id_col,
            name_col,
            email_col,
            avatar_col,
            created_col,
            profile_operation
        };
    }

    if (record_type === "table") {
        return {
            lookup_table_id
        };
    }
}

/**
 * clean version of params + creds; don't trust the front-end
 *
 * @param  {SheetMpConfig} config
 * @returns {SheetMpConfig & Summary}
 */
function getMixpanelConfig(config) {
    const { record_type, lookup_table_id, project_id, token, group_key, region, auth } = config;

    const mixpanel = {
        auth,
        region,
        token,
        project_id,
        record_type,
        batchSize: 2000,
        results: {
            success: 0,
            total: 0,
            failed: 0,
            batches: 0,
            seconds: 0,
            errors: []
        }
    };

    if (record_type === "group") mixpanel.batchSize = 200;
    if (record_type === "group") mixpanel.group_key = group_key;
    if (record_type === "table") mixpanel.lookup_table_id = lookup_table_id;

    return mixpanel;
}

/**
 * find the right "transformer" to model the data
 *
 * @param  {SheetsMpConfig} config
 * @returns {Function}
 */
function getTransformType(config) {
    if (config.record_type === "event") return modelMpEvents;
    if (config.record_type === "user") return modelMpUsers;
    if (config.record_type === "group") return modelMpGroups;
    if (config.record_type === "table") return modelMpTables;
    throw new Error(`${config.record_type} is not a supported record type`);
}

/**
 * uses the responses to update the config
 * @param  {MpSheetConfig} cleanConfig
 * @param  {Responses} responses
 * @param  {number} startTime
 * @param  {number} endTime
 * @param  {mpEvent[] | mpUser[] | mpGroup[] | Object[]} targetData
 * @returns {ImportResults}
 */
function summarizeImport(cleanConfig, responses, startTime, endTime, targetData) {
    config = clone(cleanConfig);
    config.results.startTime = startTime;
    config.results.endTime = endTime;
    config.results.seconds = Math.floor(endTime - startTime) / 1000;
    config.results.total = targetData.length;
    config.results.batches = responses.length;

    for (const res of responses) {
        if (config.record_type === "event") {
            config.results.success += res.num_records_imported || 0;
            config.results.failed += res?.failed_records?.length || 0;
            if (res?.code !== 200) config.results.errors.push(res);
        }
        if (config.record_type === "user" || config.record_type === "group") {
            if (!res.error || res.status) config.results.success += config.batchSize;
            if (res.error || !res.status) config.results.failed += config.batchSize;
            if (res.error) config.results.errors.push(res);
        }

        if (config.record_type === "table") {
            config.results.total = 1;
            if (res.status === "OK" || res.code === 200) config.results.success = 1;
            if (res.error) config.results.failed = 1;
        }
    }

    // normalize for profiles + groups
    if (config.record_type === "user" || config.record_type === "group") {
        if (config.results.success > config.results.total) config.results.success = config.results.total;
        if (config.results.failed > config.results.total) config.results.failed = config.results.total;
    }

    config.results.record_type = config.record_type;
    return config.results;
}

if (typeof module !== "undefined") {
    module.exports = { importData };
    const { getConfig } = require("./storage.js");
    const { validateCreds } = require("../utilities/validate.js");
    const { flushToMixpanel } = require("../utilities/flush.js");
    const { getJSON } = require("../utilities/toJson.js");
    const { clone } = require("../utilities/misc.js");
    const { modelMpEvents } = require("../models/modelEvents.js");
    const { modelMpUsers } = require("../models/modelUsers.js");
    const { modelMpTables } = require("../models/modelTables.js");
    const { modelMpGroups } = require("../models/modelGroups.js");
}
