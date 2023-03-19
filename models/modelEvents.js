function modelMpEvents(row, mappings) {
	const {
		distinct_id_col,
		event_name_col,
		time_col,
		insert_id_col } = mappings;

	// required fields
	if (!distinct_id_col) throw new Error('distinct_id_col mapping is required!');
	if (!event_name_col) throw new Error('event_name_col mapping is required!');
	if (!time_col) throw new Error('time_col mapping is required!');
	
	// create a copy, so we don't alter the source
	row = Object.assign({}, row);

	const mpEvent = {
		event: row[event_name_col],
		properties: {
			distinct_id: row[distinct_id_col],
			time: row[time_col].getTime(),
			$source: 'sheets-mixpanel'
		},
	};

	if (insert_id_col) {
		mpEvent.properties.$insert_id = row[insert_id_col]?.toString(); //insert_ids are always strings
	}

	else {
		mpEvent.properties.$insert_id = MD5(`${mpEvent.event} ${mpEvent.properties.distinct_id} ${mpEvent.properties.time}`);
	}

	delete row[distinct_id_col];
	delete row[event_name_col];
	delete row[insert_id_col];
	delete row[time_col];

	try {
		for (const key in row) {
			if (row[key]?.toISOString) {
				mpEvent.properties[key] = row[key].toISOString();
			}
			else {
				mpEvent.properties[key] = row[key];
			}
		}
	}

	catch (e) {
		//noop
	}

	return mpEvent;

}