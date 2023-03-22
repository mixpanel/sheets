/*
----
DATA OUT OF MP
----
*/

/**
 * export data; if not called with a config, uses last known
 * @param  {MpSheetConfig} [userConfig={}]
 * @returns {string} a csv file
 */
function exportData(userConfig = {}) {
	const startTime = Date.now();
	const runId = Math.random();
	//use last known config if unset
	if (JSON.stringify(userConfig) === '{}') userConfig = getConfig();
	userConfig.auth = Utilities.base64Encode(`${userConfig.service_acct}:${userConfig.service_secret}`);
	const type = userConfig.cohorts ? `cohort` : `report`;

	if (type === 'report') {
		console.log(`GET ${type} params`);
		track(`GET ${type}`, { runId });

		const report = getParams(userConfig, type);
		const { report_type, report_payload } = report;

		console.log(`QUERY ${type} data`);
		track(`QUERY ${type}`, { runId });
		const csv = getReportCSV(report_type, report_payload, userConfig);

		track(`CSV ${type} done`, { runId });
		return csv;
	}

	if (type === 'cohort') {
		console.log(`POST ${type}`);
		const profiles = getCohort(userConfig);
		const csv = JSONtoCSV(profiles);
		return csv;
	}

	throw new Error(`${type} is unsupported`);

}

/**
 * use the params parsed from a URL to get the report's metadata
 * @param  {MpSheetConfig} config
 * @returns {{report_type: string, report_payload: Object}}
 */
function getParams(config) {
	const { project_id, workspace_id, region, report_id, auth } = config;
	let subdomain = ``;
	if (region === 'EU') subdomain = `eu.`;
	const URL = `https://${subdomain}mixpanel.com/api/app/workspaces/${workspace_id}/bookmarks/${report_id}?v=2`;
	const options = {
		'method': 'GET',
		'headers': {
			Authorization: `Basic ${auth}`,
			Accept: 'application/json'
		},
		muteHttpExceptions: true
	};

	const res = UrlFetchApp.fetch(URL, options).getContentText();
	const data = JSON.parse(res);

	return {
		report_type: data?.results?.original_type,
		report_payload: data?.results?.params
	};


}

/**
 * turn report metadata into a CSV of it's results
 * @param  {string} report_type
 * @param  {Object} params
 * @param  {MpSheetConfig} config
 */
function getReportCSV(report_type, params, config) {
	const { project_id, workspace_id, region, auth } = config;
	let subdomain = ``;
	if (region === 'EU') subdomain = `eu.`;

	if (!['insights', 'funnels', 'retention'].includes(report_type)) {
		throw new Error(`${report_type} reports are not currently supported for CSV export`);
	}

	let route = report_type;
	if (report_type === 'funnels') {
		route = `arb_funnels`;
	}

	const URL = `https://${subdomain}mixpanel.com/api/query/${route}?workspace_id=${workspace_id}&project_id=${project_id}`;
	const payload = {
		bookmark: params,
		use_query_cache: false,
		format: 'csv'
	};

	const options = {
		method: 'POST',
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
 * @param  {MpSheetConfig} config
 * @returns {mpUser[] | mpGroup[]}
 */
function getCohort(config) {
	const { project_id, workspace_id, region, auth, cohort_id } = config;
	let subdomain = ``;
	if (region === 'EU') subdomain = `eu.`;

	let URL = `https://${subdomain}mixpanel.com/api/2.0/engage?workspace_id=${workspace_id}&project_id=${project_id}`;

	const payload = {
		filter_by_cohort: `{"id":${cohort_id}}`,
		page: 0,
		include_all_users: false
	};

	const options = {
		method: 'POST',
		headers: {
			Authorization: `Basic ${auth}`,
			contentType: ` application/x-www-form-urlencoded`
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
 * un-nest properties from profile so they go nicely to CSV
 * @param  {mpUser | mpGroup} profile
 * @returns {Object<string, PropValues>}
 */
function unNest(profile) {
	return { distinct_id: profile.$distinct_id, ...profile.$properties };
}