/*
----
DATA OUT OF MP
----
*/

/**
 * export data; if not called with a config, uses last known
 *
 * @param  {MpSheetConfig} [config]
 * @returns {[string | string[][], ReportMeta | CohortMeta | DashMeta]} string + metadata `[csv, {}]`
 */
function exportData(config) {
    //use last known config if unset
    if (!config) config = getConfig();

    if (!config.auth) config.auth = validateCreds(config);

    const type = config.entity_type;

    if (type === "report") {
        try {
            const report = getParams(config);
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
            const csv = profilesToCsvArray(profiles);
            return [csv, meta];
        } catch (e) {
            throw e;
        }
    }

    if (type === "dashboard") {
        try {
            const dashMeta = enumDashboard(config);
            const CSVs = [];
            loopReports: for (const report of dashMeta.reports) {
                try {
                    const { meta, payload } = getParams({ report_id: report.id, ...config });
                    CSVs.push(getReportCSV(meta.report_type, payload, config));
                } catch (e) {
                    CSVs.push({ error: e });
                }
            }
            //todo
            //this feature is NOT ready and should not yet be included in the UI
            //current this function is expected to return [csvString, {reportMeta}]
            //allowing it to return MULTIPLE reports would require a refactor of Mixpanel → Sheet functions
			//because we would have to build MULTIPLE sheets to store + sync the data
            return [CSVs, dashMeta];
        } catch (e) {
            throw e;
        }
    }

    throw `${type} is unsupported`;
}

/**
 * @param  {MpSheetConfig} config
 * @returns {DashMeta}
 */
function enumDashboard(config) {
    const { project_id, workspace_id, region, auth, dash_id } = config;
    let subdomain = ``;
    if (region === "EU") subdomain = `eu.`;

    const URL = `https://${subdomain}mixpanel.com/api/app/workspaces/${Number(
        workspace_id
    )}/dashboards/${Number(dash_id)}`;

    /** @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} */
    const options = {
        method: "get",
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json"
        },
        muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(URL, options);
    const statusCode = res.getResponseCode();
    switch (statusCode) {
        case 200:
            //noop
            break;
        case 404:
            throw `404: the board ${
                dash_id || ""
            } could not be found; check your project, workspace, and board id's and try again`;
            break;
        case 429:
            throw `429: your project has been rate limited; this should resolve by itself`;
            break;
        case 410:
            throw `410: unauthorized; your service account cannot access board ${dash_id}`;
        case 500:
            throw `500: mixpanel server error; board ${dash_id || ""} may no longer exist`;
        case 504:
            throw `504: mixpanel timed out when fetching board ${dash_id || ""}; this should resolve by itself`;
        default:
            throw `${statusCode}: an unknown error has occurred`;
            break;
    }
    const text = res.getContentText();

    const data = JSON.parse(text).results;
    const results = {
        name: data.title,
        id: data.id,
        reports: []
    };
    const foundReports = data.contents.report;
    for (const report_id in foundReports) {
        results.reports.push({
            id: report_id,
            name: foundReports[report_id].name
        });
    }

    return results;
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
    const URL = `https://${subdomain}mixpanel.com/api/app/workspaces/${Number(workspace_id)}/bookmarks/${Number(
        report_id
    )}?v=2`;

    /** @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} */
    const options = {
        method: "get",
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json"
        },
        muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(URL, options);
    const statusCode = res.getResponseCode();
    switch (statusCode) {
        case 200:
            //noop
            break;
        case 404:
            throw `404: the report ${
                report_id || ""
            } could not be found; check your project, workspace, and report id's and try again`;
            break;
        case 429:
            throw `429: your project has been rate limited; this should resolve by itself`;
            break;
        case 410:
            throw `410: unauthorized; your service account cannot access report ${report_id}`;
        case 500:
            throw `500: mixpanel server error; report ${report_id || ""} may no longer exist`;
        case 504:
            throw `504: mixpanel timed out when fetching report ${
                report_id || ""
            }; this should resolve by itself`;
        default:
            throw `${statusCode}: an unknown error has occurred`;
            break;
    }
    const text = res.getContentText();

    const data = JSON.parse(text).results;
    const result = {
        meta: {
            report_type: data.type || data.original_type,
            report_name: data.name,
            report_desc: data.description,
            report_id: data.id,
            project_id: data.project_id,
            dashboard_id: data.dashboard_id,
            workspace_id: data.workspace_id,
            report_creator: data.creator_name || data.email || data.creator_id || "unknown"
        },
        payload: data.params
    };

    return result;
}

/**
 * turn report metadata into a CSV of it's results
 *
 * @param  {'insights' | 'funnels' | 'retention' | string} report_type
 * @param  {Object} params a whole bookmark's payload
 * @param  {MpSheetConfig} config
 */
function getReportCSV(report_type, params, config) {
    const { project_id, workspace_id, region, auth } = config;
    let subdomain = ``;
    if (region === "EU") subdomain = `eu.`;

    if (!["insights", "funnels", "retention"].includes(report_type)) {
        throw `${report_type || "your supplied"} report is not currently supported for CSV export`;
    }

    let route = report_type;
    if (report_type === "funnels") {
        route = `arb_funnels`;
    }

    const URL = `https://${subdomain}mixpanel.com/api/query/${route}?workspace_id=${Number(
        workspace_id
    )}&project_id=${Number(project_id)}`;
    const payload = {
        bookmark: params,
        use_query_cache: false,
        format: "csv"
    };

    /** @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} */
    const options = {
        method: "post",
        headers: {
            Authorization: `Basic ${auth}`
        },
        muteHttpExceptions: true,
        payload: JSON.stringify(payload)
    };

    const res = UrlFetchApp.fetch(URL, options);
    const statusCode = res.getResponseCode();
    switch (statusCode) {
        case 200:
            //noop
            break;
        case 404:
            throw `404: report could not be found; check your project, workspace, and report id's and try again`;
            break;
        case 429:
            throw `429: your project has been rate limited; this should resolve by itself`;
            break;
        case 410:
            throw `410: unauthorized; your service account cannot access report`;
        case 500:
            throw `500: mixpanel server error; report may no longer exist`;
        case 504:
            throw `504: mixpanel timed out when fetching report; this should resolve by itself`;
        default:
            throw `${statusCode}: an unknown error has occurred`;
            break;
    }
    const csv = res.getContentText();
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

    /** @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} */
    const options = {
        method: "post",
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
 * @returns {CohortMeta}
 */
function getCohortMeta(config) {
    const { project_id, workspace_id, region, auth, cohort_id } = config;
    let subdomain = ``;
    if (region === "EU") subdomain = `eu.`;

    let URL = `https://${subdomain}mixpanel.com/api/2.0/cohorts/list?workspace_id=${workspace_id}&project_id=${project_id}`;

    /** @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} */
    const options = {
        method: "post",
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: `application/json`
        },
        muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(URL, options);
    const statusCode = res.getResponseCode();
    switch (statusCode) {
        case 200:
            //noop
            break;
        case 404:
            throw `404: cohort could not be found; check your project, workspace, and report id's and try again`;
            break;
        case 429:
            throw `429: your project has been rate limited; this should resolve by itself`;
            break;
        case 410:
            throw `410: unauthorized; your service account cannot access cohort`;
        case 500:
            throw `500: mixpanel server error; cohort may no longer exist`;
        case 504:
            throw `504: mixpanel timed out when fetching cohort; this should resolve by itself`;
        default:
            throw `${statusCode}: an unknown error has occurred`;
            break;
    }
    const data = JSON.parse(res.getContentText());
    const cohortInfos = data.find(cohort => cohort.id.toString() === cohort_id.toString()) || {};

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
    //@ts-ignore
    return { distinct_id: profile?.$distinct_id || profile?.group_id, ...profile.$properties };
}

if (typeof module !== "undefined") {
    module.exports = { exportData };
    const { getConfig } = require("../utilities/storage.js");
    const { validateCreds } = require("../utilities/validate.js");
    const { JSONtoCSV, profilesToCsvArray } = require("../utilities/misc.js");
}
