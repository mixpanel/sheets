
function importData(userConfig = {}) {
	//use last known config if unset
	if (JSON.stringify(userConfig) === '{}') userConfig = getConfig();

	console.log('SYNC');
	const startTime = Date.now();
	const mappings = getMappings(userConfig);
	const config = getMixpanelConfig(userConfig);
	const transform = getTransformType(config);

	console.log('GET');
	const sourceData = getJSON(SpreadsheetApp.getActiveSheet());

	console.log(`TRANSFORM: ${comma(sourceData.length)} ${config.record_type}s`);
	const targetData = sourceData.slice().map((row) => transform(row, mappings, config));

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
	console.log(config);
	return [imported, config];

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
		profile_operation
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
			profile_operation
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
		group_key,
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

	if (record_type === 'group') mixpanel.batchSize = 200;
	if (record_type === 'group') mixpanel.group_key = group_key;
	if (record_type === 'table') mixpanel.lookup_table_id = lookup_table_id;
	if (auth_type === 'service_account') mixpanel.auth = `${service_acct}:${service_secret}`;
	if (auth_type === 'api_secret') mixpanel.auth = `${api_secret}:`;

	return mixpanel;

}


function getTransformType(config) {
	if (config.record_type === 'event') return modelMpEvents;
	if (config.record_type === 'user') return modelMpProfiles;
	if (config.record_type === 'group') return modelMpGroups;
	if (config.record_type === 'table') return modelMpTables;
	throw new Error(`${config.record_type} is not a supported record type`);
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
			if (res?.code !== 200) config.results.errors.push(res);
		}
		if (config.record_type === 'user' || config.record_type === 'group') {
			if (!res.error || res.status) config.results.success += config.batchSize;
			if (res.error || !res.status) config.results.failed += config.batchSize;
			if (res.error) config.results.errors.push(res);
		}

		if (config.record_type === 'table') {
			config.results.total = 1;
			if (res.status === 'OK' || res.code === 200) config.results.success = 1;
			if (res.error) config.results.failed = 1;
		}
	}

	// normalize for profiles + groups
	if (config.record_type === 'user' || config.record_type === 'group') {
		if (config.results.success > config.results.total) config.results.success = config.results.total;
		if (config.results.failed > config.results.total) config.results.failed = config.results.total;
	}
}


