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
        avatar_col,
        created_col,       
        profile_operation = "$set",
    } = mappings;
    const { token } = config;
    profile_operation = profile_operation.toLowerCase();

    if (!distinct_id_col) throw "distinct_id_col mapping is required!";
    if (!token) throw "token is required!";

    //create a copy, so we don't alter the source
    row = Object.assign({}, row);

    const mpProfile = {
        $token: token,
        $distinct_id: row[distinct_id_col],
        $ip: "0",
        $ignore_time: true,
        [profile_operation]: {},
    };

    delete row[distinct_id_col];

    // mixpanel reserved keys
    if (name_col) {
        mpProfile[profile_operation].$name = row[name_col];
        delete row[name_col];
    }

    if (email_col) {
        mpProfile[profile_operation].$email = row[email_col];
        delete row[email_col];
    }


    if (avatar_col) {
        mpProfile[profile_operation].$avatar = row[avatar_col];
        delete row[avatar_col];
    }

    if (created_col) {
        if (row[created_col]?.toISOString) {
            mpProfile[profile_operation].$created = row[created_col].toISOString();
        } else {
            mpProfile[profile_operation].$created = row[created_col];
        }
        delete row[created_col];
    }

    try {
        for (const key in row) {
            if (row[key]?.toISOString) {
                mpProfile[profile_operation][key] = row[key].toISOString();
            } else {
                mpProfile[profile_operation][key] = row[key];
            }
        }
    } catch (e) {
        //noop
    }

    return mpProfile;
}

if (typeof module !== "undefined") {
    module.exports = { modelMpUsers };
}
