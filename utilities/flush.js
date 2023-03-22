/*
----
SEND TO MIXPANEL
----
*/


/**
 * flushes data to mixpanel
 * @param  {mpEvent[] | mpUser[] | mpGroup[] | Object[]} data
 * @param  {SheetMpConfig} config
 * @param  {1 | 0} strict use or don't use strict mode
 */
function flushToMixpanel(data, config, strict = 1) {
	//todo batch by size
	// ? https://developer.mixpanel.com/reference/import-events#high-level-requirements
	const batches = sliceIntoChunks(data, config.batchSize);
	let subdomain = `api`;
	if (config.region === 'EU') subdomain = `api-eu`;
	let URL;
	if (config.record_type === 'event') URL = `https://${subdomain}.mixpanel.com/import?strict=${strict}&project_id=${config.project_id}`;
	if (config.record_type === 'user') URL = `https://${subdomain}.mixpanel.com/engage?verbose=1`;
	if (config.record_type === 'group') URL = `https://${subdomain}.mixpanel.com/groups?verbose=1`;
	if (config.record_type === 'table') URL = `https://${subdomain}.mixpanel.com/lookup-tables/${config.lookup_table_id}?project_id=${config.project_id}`;

	const options = {
		'method': 'POST',
		'contentType': 'application/json',
		'headers': {
			Authorization: `Basic ${Utilities.base64Encode(config.auth)}`,
			Accept: 'application/json'
		},
		muteHttpExceptions: true
	};
	if (config.record_type === 'table') {
		options.method = 'PUT';
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






