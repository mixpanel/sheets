/*
----
SEND TO MIXPANEL
----
*/

/**
 * flushes data to mixpanel
 * todo size batching : https://developer.mixpanel.com/reference/import-events#high-level-requirements
 *
 * @param  {mpEvent[] | mpUser[] | mpGroup[] | Object[]} data
 * @param  {SheetMpConfig} config
 * @param  {1 | 0} strict use or don't use strict mode
 */
function flushToMixpanel(data, config, strict = 1) {
    const { region, record_type } = config;

    if (!config.auth) config.auth = validateCreds(config);
    const batches = sliceIntoChunks(data, config.batchSize);
    let sub = `api`;
    if (region === "EU") sub = `api-eu`;
    let URL;
    if (record_type === "event") URL = `https://${sub}.mixpanel.com/import?strict=${strict}&project_id=${config.project_id}`;
    if (record_type === "user") URL = `https://${sub}.mixpanel.com/engage?verbose=1`;
    if (record_type === "group") URL = `https://${sub}.mixpanel.com/groups?verbose=1`;
    if (record_type === "table") URL = `https://${sub}.mixpanel.com/lookup-tables/${config.lookup_table_id}?project_id=${config.project_id}`;
	
    const options = {
        method: "POST",
        contentType: "application/json",
        headers: {
            Authorization: `Basic ${config.auth}`,
            Accept: "application/json",
        },
        muteHttpExceptions: true,
    };
    if (record_type === "table") {
        options.method = "PUT";
        options.contentType = `text/csv`;
        options.payload = JSONtoCSV(data);
        const res = UrlFetchApp.fetch(URL, options);
        return [JSON.parse(res.getContentText())];
    }
    const responses = [];
    for (const batch of batches) {
        options.payload = JSON.stringify(batch);
        const res = UrlFetchApp.fetch(URL, options);
        responses.push(JSON.parse(res.getContentText()));
    }

    return responses;
}
