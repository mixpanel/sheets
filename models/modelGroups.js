/*
----
MIXPANEL GROUPS
https://developer.mixpanel.com/reference/group-set-property
----
*/

/**
 * model a mixpanel group profile operation from flat JSON
 *
 * @param  {Object} row
 * @param  {GroupMappings} mappings
 * @param  {SheetMpConfig & GroupMappings} config
 */
function modelMpGroups(row, mappings, config) {
    let {
        distinct_id_col,
        name_col,
        email_col,
        avatar_col,
        created_col,
        profile_operation = "$set"
    } = mappings;
    const { token, group_key } = config;
    profile_operation = profile_operation.toLowerCase();

    if (!group_key) throw "group_key is required!";
    if (!distinct_id_col) throw "group_id mapping is required!";
    if (!token) throw "token mapping is required!";

    //create a copy, so we don't alter the source
    row = Object.assign({}, row);

    const mpGroup = {
        $token: token,
        $group_key: group_key,
        $group_id: row[distinct_id_col],
        $ip: "0",
        $ignore_time: true,
        [profile_operation]: {}
    };

    delete row[distinct_id_col];

    // mixpanel reserved keys
    if (name_col) {
        mpGroup[profile_operation].$name = row[name_col];
        delete row[name_col];
    }

    if (email_col) {
        mpGroup[profile_operation].$email = row[email_col];
        delete row[email_col];
    }

    if (avatar_col) {
        mpGroup[profile_operation].$avatar = row[avatar_col];
        delete row[avatar_col];
    }

    if (created_col) {
        if (row[created_col]?.toISOString) {
            mpGroup[profile_operation].$created = row[created_col].toISOString();
        } else {
            mpGroup[profile_operation].$created = row[created_col];
        }
        delete row[created_col];
    }

    try {
        for (const key in row) {
            if (row[key]?.toISOString) {
                mpGroup[profile_operation][key] = row[key].toISOString();
            } else {
                mpGroup[profile_operation][key] = row[key];
            }
        }
    } catch (e) {
        //noop
    }

    return mpGroup;
}

if (typeof module !== "undefined") {
    module.exports = { modelMpGroups };
}
