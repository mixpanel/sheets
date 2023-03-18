
function importData(userConfig) {
	console.log('SYNC');
	const startTime = Date.now();
	const mappings = getMappings(userConfig);
	const config = getMixpanelConfig(userConfig);
	const problems = validateUserInput(config, mappings);
	const transform = getTransformType(config);

	console.log('GET');
	const sourceData = getJSON(SpreadsheetApp.getActiveSheet());
	console.log(`TRANSFORM: ${comma(sourceData.length)} ${config.record_type}s`);
	const targetData = sourceData.slice().map((row) => transform(row, mappings));
	console.log(`FLUSH: ${comma(targetData.length)} ${config.record_type}s`);
	const imported = flushToMixpanel(targetData, config);
	const endTime = Date.now();
	const runTime = Math.floor(endTime - startTime) / 1000;
	console.log(`FINISHED: ${runTime} seconds`);
	updateConfig(config, imported, runTime, targetData);
	if (config.results.errors.length > 0) {
		Logger.log('FAILED REQUESTS');
		Logger.log(config.results.errors);
	}
	displayImportResults(config);
	return imported;

}


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
		group_key,
		lookup_table_id,
	} = config;

	if (record_type === 'event') {
		return {
			distinct_id_col,
			event_name_col,
			time_col,
			insert_id_col,
		};
	}

	if (record_type === 'user') {
		return {
			distinct_id_col,
			name_col,
			email_col,
			avatar_col,
			created_col,
			profile_operation
		};
	}


	if (record_type === 'group') {
		return {
			distinct_id_col,
			name_col,
			email_col,
			avatar_col,
			created_col,
			profile_operation,
			group_key
		};
	}

	if (record_type === 'table') {
		return {};
	}
}

function getMixpanelConfig(config) {
	const {
		record_type,
		lookup_table_id,
		project_id,
		token,
		region,
		auth_type,
		service_acct,
		service_secret,
		api_secret
	} = config;

	const mixpanel = {
		region,
		token,
		project_id,
		record_type,
		batchSize: 2000,
		results: {
			success: 0,
			total: 0,
			failed: 0,
			requests: 0,
			seconds: 0,
			errors: []
		}
	};

	if (record_type === 'table') mixpanel.lookup_table_id = lookup_table_id;
	if (auth_type === 'service_account') mixpanel.auth = `${service_acct}:${service_secret}`;
	if (auth_type === 'api_secret') mixpanel.auth = `${api_secret}:`;

	return mixpanel;

}


function getTransformType(config) {
	if (config.record_type === 'event') return modelMpEvents;
	if (config.record_type === 'user') return modelMpProfiles;
	throw new Error(`${config.record_type} is not a supported record type`);
}

function validateUserInput(config, mappings) {
	const problems = [];
	if (config.record_type === 'event') {
		if (!config.secret && (!config.service_acct || !config.service_pass)) problems.push('a service account or api secret is required to send events');
		if (!config.projectId && config.service_acct && config.service_pass) problems.push('a project ID is required when using service accounts');
		if (!mappings.distinct_id_col) problems.push('a distinct_id mapping is required for sending events');
		if (!mappings.time_col) problems.push('a time mapping is required for sending events');
		if (!mappings.event_name_col) problems.push('an event name mapping is required for sending events');
	}

	if (config.record_type === 'user') {
		if (!config.token) problems.push('token is required for sending user profiles');
		if (!mappings.distinct_id_col) problems.push('a distinct_id mapping is required for sending user profiles');
	}

	if (config.record_type === ' group') {
		if (!config.token) problems.push('token is required for sending group profiles');
		if (!config.groupKey) problems.push('a group key is required for sending group profiles');
		if (!mappings.distinct_id_col) problems.push('a distinct_id / group_id mapping is required for sending group profiles');
	}

	return problems;

}

// SFX
function updateConfig(config, responses, runTime, targetData) {
	config.results.seconds = runTime;
	config.results.total = targetData.length;
	config.results.batches = responses.length;

	for (const res of responses) {
		if (config.record_type === 'event') {
			config.results.success += res.num_records_imported || 0;
			config.results.failed += res?.failed_records?.length || 0;
		}
		if (config.record_type === 'user' || config.record_type === 'group') {
			if (!res.error || res.status) config.results.success += config.batchSize;
			if (res.error || !res.status) config.results.failed += config.batchSize;
		}

		if (config.record_type === 'table') {
			config.results.success += targetData.length;
		}
	}
}
