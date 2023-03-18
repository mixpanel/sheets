function modelMpGroups(row, mappings, config) {
	let {
		distinct_id_col,
		name_col,
		email_col,
		phone_col,
		avatar_col,
		created_col,
		latitude_col,
		longitude_col,
		ip_col,
		profileOperation = '$set',
	} = mappings;
	const { token, group_key } = config;
	profileOperation = profileOperation.toLowerCase();

	if (!group_key) throw new Error('group_key is required!');
	if (!distinct_id_col) throw new Error('group_id mapping is required!');
	if (!token) throw new Error('token mapping is required!');

	//create a copy, so we don't alter the source
	row = Object.assign({}, row);

	const mpGroup = {
		$token: token,
		$group_key: group_key,
		$group_id: row[distinct_id_col],
		$ip: "0",
		$ignore_time: true,
		[profileOperation]: {}
	};

	// mixpanel reserved keys
	if (name_col) {
		mpGroup[profileOperation].$name = row[name_col];
		delete row[name_col];
	}

	if (email_col) {
		mpGroup[profileOperation].$email = row[email_col];
		delete row[email_col];
	}

	if (phone_col) {
		mpGroup[profileOperation].$phone = row[phone_col];
		delete row[phone_col];
	}

	if (avatar_col) {
		mpGroup[profileOperation].$avatar = row[avatar_col];
		delete row[avatar_col];
	}

	if (created_col) {
		if (row[created_col]?.toISOString) {
			mpGroup[profileOperation].$created = row[created_col].toISOString();
		}
		else {
			mpGroup[profileOperation].$created = row[created_col];
		}
		delete row[created_col];
	}

	if (ip_col) {
		mpGroup.$ip = row[ip_col];
		mpGroup[profileOperation]["IP Address"] = row[ip_col];
		delete row[ip_col];
	}

	if (latitude_col) {
		mpGroup.$latitude = row[latitude_col];
		mpGroup[profileOperation]["Latitude"] = row[latitude_col];
		delete row[latitude_col];
	}

	if (longitude_col) {
		mpGroup.$longitude = row[longitude_col];
		mpGroup[profileOperation]["Longitude"] = row[longitude_col];
		delete row[longitude_col];
	}


	try {
		for (const key in row) {
			if (row[key]?.toISOString) {
				mpGroup.properties[key] = row[key].toISOString();
			}
			else {
				mpGroup.properties[key] = row[key];
			}
		}
	}

	catch (e) {
		//noop
	}

	return mpGroup;

}