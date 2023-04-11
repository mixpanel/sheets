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
 * @param  {CleanConfig} config
 * @param  {1 | 0} strict use or don't use strict mode
 */
function flushToMixpanel(data, config, strict = 1) {
    const { region, record_type } = config;

    if (!config.auth) config.auth = validateCreds(config);
    const batches = sliceIntoChunks(data, config.batchSize);
    let sub = `api`;
    if (region === "EU") sub = `api-eu`;
    let URL;
    let projIdQs = `project_id=${config.project_id}`;
    if (record_type === "event") URL = `https://${sub}.mixpanel.com/import?strict=${strict}&${projIdQs}`;
    if (record_type === "user") URL = `https://${sub}.mixpanel.com/engage?verbose=1`;
    if (record_type === "group") URL = `https://${sub}.mixpanel.com/groups?verbose=1`;
    if (record_type === "table")
        URL = `https://${sub}.mixpanel.com/lookup-tables/${config.lookup_table_id}?${projIdQs}`;

    /** @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} */
    const options = {
        method: "post",
        contentType: "application/json",
        headers: {
            Authorization: `Basic ${config.auth}`,
            Accept: "application/json"
        },
        muteHttpExceptions: true
    };
    if (record_type === "table") {
        options.method = "put";
        options.contentType = `text/csv`;
        options.payload = JSONtoCSV(data);
        const res = UrlFetchApp.fetch(URL, options);
        return [JSON.parse(res.getContentText())];
    }

    const requests = batches.map(batch => {
        const req = clone(options);
        req.payload = JSON.stringify(batch);
        req.url = URL;
        return req;
    });

    // note: fetchAll is faster than fetch by ~5x
    // ? https://tanaikech.github.io/2018/04/19/benchmark-fetchall-method-in-urlfetch-service-for-google-apps-script/?ref=script.gs
    const responses = UrlFetchApp.fetchAll(requests).map(res => JSON.parse(res.getContentText()));

    // const responses = [];
    // for (const batch of batches) {
    //     options.payload = JSON.stringify(batch);
    //     const res = UrlFetchApp.fetch(URL, options);
    //     responses.push(JSON.parse(res.getContentText()));
    // }

    return responses;
}

if (typeof module !== "undefined") {
    const { JSONtoCSV, sliceIntoChunks } = require("./misc.js");
    const { validateCreds } = require("./validate");
    module.exports = { flushToMixpanel };
}
