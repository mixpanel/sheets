/*
----
DATA OUT OF MP
----
*/

/**
 * export data; if not called with a config, uses last known
 *
 * @param  {MpSheetConfig} [config={}]
 * @returns {[string, ReportMeta & CohortMeta]} string + metadata `[csv, {}]`
 */
function exportData(config = {}) {
    const startTime = Date.now();
    const runId = Math.random();
    //use last known config if unset
    if (JSON.stringify(config) === "{}") config = getConfig();
    if (!config.auth) config.auth = validateCreds(config);

    const type = config.entity_type;

    if (type === "report") {
        try {
            const report = getParams(config, type);
            const { meta, payload } = report;
            const csv = getReportCSV(meta.report_type, payload, config);
            return [csv, meta];
        } catch (e) {
            throw e;
        }
    }

    if (type === "cohort") {
        try {
            const meta = getCohortMeta(config);
            const profiles = getCohort(config);
            const csv = JSONtoCSV(profiles);
            return [csv, meta];
        } catch (e) {
            throw e;
        }
    }

    throw `${type} is unsupported`;
}

/**
 * use the params parsed from a URL to get the report's metadata
 *
 * @param  {MpSheetConfig} config
 * @returns {ReportParams}
 */
function getParams(config) {
    const { project_id, workspace_id, region, report_id, auth } = config;
    let subdomain = ``;
    if (region === "EU") subdomain = `eu.`;
    const URL = `https://${subdomain}mixpanel.com/api/app/workspaces/${workspace_id}/bookmarks/${report_id}?v=2`;
    const options = {
        method: "GET",
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json"
        },
        muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(URL, options).getContentText();
    const data = JSON.parse(res);
    const result = {
        meta: {
            report_type: data?.results?.type || data?.results?.original_type,
            report_name: data?.results?.name,
            report_desc: data?.results?.description,
            report_id: data?.results?.id,
            project_id: data?.results?.project_id,
            dashboard_id: data?.results?.dashboard_id,
            workspace_id: data?.results?.workspace_id,
            report_creator: data?.results?.creator_name || data?.results?.email || data?.results?.creator_id || "unknown"
        },
        payload: data?.results?.params
    };

    return result;
}

/**
 * turn report metadata into a CSV of it's results
 *
 * @param  {'insights', 'funnels', 'retention'} report_type
 * @param  {Object} params a whole bookmark's payload
 * @param  {MpSheetConfig} config
 */
function getReportCSV(report_type, params, config) {
    const { project_id, workspace_id, region, auth } = config;
    let subdomain = ``;
    if (region === "EU") subdomain = `eu.`;

    if (!["insights", "funnels", "retention"].includes(report_type)) {
        throw `${report_type} reports are not currently supported for CSV export`;
    }

    let route = report_type;
    if (report_type === "funnels") {
        route = `arb_funnels`;
    }

    const URL = `https://${subdomain}mixpanel.com/api/query/${route}?workspace_id=${workspace_id}&project_id=${project_id}`;
    const payload = {
        bookmark: params,
        use_query_cache: false,
        format: "csv"
    };

    const options = {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`
        },
        muteHttpExceptions: true,
        payload: JSON.stringify(payload)
    };

    const csv = UrlFetchApp.fetch(URL, options).getContentText();
    return csv;
}

/**
 * turn a cohort id into a flattened list of profile objects
 *
 * @param  {MpSheetConfig} config
 * @returns {mpUser[] | mpGroup[]}
 */
function getCohort(config) {
    const { project_id, workspace_id, region, auth, cohort_id } = config;
    let subdomain = ``;
    if (region === "EU") subdomain = `eu.`;

    let URL = `https://${subdomain}mixpanel.com/api/2.0/engage?workspace_id=${workspace_id}&project_id=${project_id}`;

    const payload = {
        filter_by_cohort: `{"id":${cohort_id}}`,
        page: 0,
        include_all_users: false
    };

    const options = {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": `application/x-www-form-urlencoded`
        },
        muteHttpExceptions: true,
        payload: JSON.stringify(payload)
    };

    const profiles = [];

    //first batch
    let res = JSON.parse(UrlFetchApp.fetch(URL, options).getContentText());
    let gotProfiles = res.results.length;
    profiles.push(res.results.map(unNest));

    let { page, page_size, total, session_id } = res;

    // subsequent batches
    while (gotProfiles >= page_size) {
        page++;
        payload.page = page;
        payload.session_id = session_id;
        options.payload = JSON.stringify(payload);

        res = JSON.parse(UrlFetchApp.fetch(URL, options).getContentText());

        ({ page, page_size, total, session_id } = res);
        gotProfiles = res.results.length || 0;
        profiles.push(res.results.map(unNest));
    }

    return profiles.flat();
}

/**
 * get's meta information about a cohort
 * @param  {MpSheetConfig} config
 * @returns {CohortInfo}
 */
function getCohortMeta(config) {
    const { project_id, workspace_id, region, auth, cohort_id } = config;
    let subdomain = ``;
    if (region === "EU") subdomain = `eu.`;

    let URL = `https://${subdomain}mixpanel.com/api/2.0/cohorts/list?workspace_id=${workspace_id}&project_id=${project_id}`;

    const options = {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: `application/json`
        },
        muteHttpExceptions: true
    };

    const res = JSON.parse(UrlFetchApp.fetch(URL, options).getContentText());
    const cohortInfos = res.find(cohort => cohort.id.toString() === cohort_id) || {};
    return {
        cohort_id: cohortInfos.id,
        cohort_name: cohortInfos.name,
        cohort_desc: cohortInfos.description,
        cohort_count: cohortInfos.count,
        project_id: cohortInfos.project_id
    };
}

/**
 * un-nest properties from profile so they go nicely to CSV
 *
 * @param  {mpUser | mpGroup} profile
 * @returns {Object<string, PropValues>}
 */
function unNest(profile) {
    return { distinct_id: profile.$distinct_id, ...profile.$properties };
}


if (typeof module !== "undefined") {
    module.exports = { exportData };
    const { getConfig } = require("./storage.js");
    const { validateCreds } = require("../utilities/validate.js");    
}
