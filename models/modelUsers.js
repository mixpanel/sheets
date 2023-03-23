/*
----
MIXPANEL USER PROFILES
https://developer.mixpanel.com/reference/profile-set
----
*/

/**
 * model a mixpanel user profile operation from flat JSON
 * 
 * @param  {Object} row
 * @param  {UserMappings} mappings
 * @param  {SheetMpConfig} config
 */
function modelMpUsers(row, mappings, config) {
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
	const { token } = config;
	profileOperation = profileOperation.toLowerCase();

	if (!distinct_id_col) throw new Error('distinct_id_col mapping is required!');
	if (!token) throw new Error('token is required!');

	//create a copy, so we don't alter the source
	row = Object.assign({}, row);

	const mpProfile = {
		$token: token,
		$distinct_id: row[distinct_id_col],
		$ip: "0",
		$ignore_time: true,
		[profileOperation]: {}
	};

	delete row[distinct_id_col];

	// mixpanel reserved keys
	if (name_col) {
		mpProfile[profileOperation].$name = row[name_col];
		delete row[name_col];
	}

	if (email_col) {
		mpProfile[profileOperation].$email = row[email_col];
		delete row[email_col];
	}

	if (phone_col) {
		mpProfile[profileOperation].$phone = row[phone_col];
		delete row[phone_col];
	}

	if (avatar_col) {
		mpProfile[profileOperation].$avatar = row[avatar_col];
		delete row[avatar_col];
	}

	if (created_col) {
		if (row[created_col]?.toISOString) {
			mpProfile[profileOperation].$created = row[created_col].toISOString();
		}
		else {
			mpProfile[profileOperation].$created = row[created_col];
		}
		delete row[created_col];
	}

	if (ip_col) {
		mpProfile.$ip = row[ip_col];
		mpProfile[profileOperation]["IP Address"] = row[ip_col];
		delete row[ip_col];
	}

	if (latitude_col) {
		mpProfile.$latitude = row[latitude_col];
		mpProfile[profileOperation]["Latitude"] = row[latitude_col];
		delete row[latitude_col];
	}

	if (longitude_col) {
		mpProfile.$longitude = row[longitude_col];
		mpProfile[profileOperation]["Longitude"] = row[longitude_col];
		delete row[longitude_col];
	}


	try {
		for (const key in row) {
			if (row[key]?.toISOString) {
				mpProfile[profileOperation][key] = row[key].toISOString();
			}
			else {
				mpProfile[profileOperation][key] = row[key];
			}
		}
	}

	catch (e) {
		//noop
	}

	return mpProfile;

}