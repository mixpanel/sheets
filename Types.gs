/*
----
TYPES
	google apps script uses jsdoc for it's typings... so we might as well try...
----
*/

/**
 * @typedef {SheetMpConfig | MpSheetConfig} Config
 */


/**
 * @typedef {SheetMpConfigAlways & (EventMappings | UserMappings | GroupMappings | TableMappings)} SheetMpConfig
 *
 */

/**
 * @typedef {Object} SheetMpConfigAlways all the options on a payload from Sheet → Mixpanel
 * @property {'sheet-to-mixpanel'} configType an identifier for where the config came from
 * @property {'event' | 'user' | 'group' | 'table'} record_type the record type being imported
 * @property {'string'} project_id the project identifier
 * @property {'string'} token the project token
 * @property {'US' | 'EU'} region US or EU residence
 * @property {'service_account' | 'api_secret'} auth_type how we will authenticate
 * @property {'string'} [service_acct] service acct name
 * @property {'string'} [service_secret] service acct pass
 * @property {'string'} [api_secret] api secret
 *
 */

/**
 * @typedef {Object} EventMappings mappings columns to fields for event imports
 * @property {'string'} event_name_col the sheet's source column name to be mapped to event name
 * @property {'string'} distinct_id_col the sheet's source column name to be mapped to distinct_id
 * @property {'string'} time_col the sheet's source column name to be mapped to event time
 * @property {'string'} [insert_id_col] the sheet's source column name to be mapped to $insert_id
 */

/**
 * @typedef {Object} UserMappings mappings columns to fields for user imports
 * @property {'string'} distinct_id_col the sheet's source column name to be mapped to $distinct_id
 * @property {'$set' | '$set_once'} profile_operation the type of operation to preform when updating the profile
 * @property {'string'} [name_col] the sheet's source column name to be mapped to $name
 * @property {'string'} [email_col] the sheet's source column name to be mapped to $email
 * @property {'string'} [avatar_col] the sheet's source column name to be mapped to $avatar
 * @property {'string'} [created_col] the sheet's source column name to be mapped to $created
 */


/**
 * @typedef {Object} GroupMappings mappings columns to fields for group imports
 * @property {'string'} distinct_id_col the sheet's source column name to be mapped to $distinct_id
 * @property {'string'} group_key the group identifier key
 * @property {'$set' | '$set_once'} profile_operation the type of operation to preform when updating the profile
 * @property {'string'} [name_col] the sheet's source column name to be mapped to $name
 * @property {'string'} [email_col] the sheet's source column name to be mapped to $email
 * @property {'string'} [avatar_col] the sheet's source column name to be mapped to $avatar
 * @property {'string'} [created_col] the sheet's source column name to be mapped to $created
 */

/**
 * @typedef {Object} TableMappings mappings columns to fields for lookup tables
 * @property {'string'} lookup_table_id the id of the lookup table in mixpanel
 */


/**
 * @typedef {Object} MpSheetConfig all the options on a payload from Mixpanel → Sheet
 * @property {'sheet-to-mixpanel'} configType an identifier for where the config came from
 * @property {'current' | 'new'} sheet_location DEPRECATED; where to put the data
 * @property {'string'} project_id the project identifier
 * @property {'string'} service_acct service acct name
 * @property {'string'} service_secret service acct pass
 * @property {'string'} workspace_id service acct pass
 * @property {'US' | 'EU'} region US or EU residence
 * @property {'string'} [cohort_id] id of the cohort
 * @property {'string'} [report_id] id of the report
 * @property {boolean} cohorts is this a cohort or not..
 * 
 */



/**
 * @typedef {Object} SheetInfo basic infos about the current sheet
 * @property {'string'} sheet_name the human readable name of the sheet
 * @property {'string'} sheet_id the uid of the sheet
 */

/**
 * @typedef {Object} Summary
 * @property {Results} results
 */

/**
 * @typedef {Object} Results summary of results of an import
 * @property {'number'} total # of records attempted
 * @property {'number'} success
 * @property {'number'} failed
 * @property {'number'} seconds
 * @property {Object[]} errors any failed requests
 */

/**
 * @typedef {Object} Response a mixpanel API response
 * @property {'string'} status
 * @property {'number'} num_records_imported
 * @property {'number'} code
 */

/*

results: {
			success: 0,
			total: 0,
			failed: 0,
			requests: 0,
			seconds: 0,
			errors: []
		}
*/



/*
----
MIXPANEL TYPINGS
----
*/


/**
 * a mixpanel event payload
 * @typedef {Object} mpEvent - a mixpanel event
 * @property {string} event - the event name
 * @property {mpEvProperties} properties - the event's properties
 */



/**
 * a user profile update payload
 * @typedef {mpUserStandardProps & ProfileData} mpUser
 */

/**
 * a group profile update payload
 * @typedef {mpGroupStandardProps & ProfileData} mpGroup
 */

/**
 * mixpanel's required event properties
 * @typedef {Object} mpEvStandardProps
 * @property {string} distinct_id - uuid of the end user
 * @property {number} time - the UTC time of the event (unix epoch)
 * @property {string} [$insert_id] - unique row id; used for deduplication
 */

/**
 * event properties payload
 * @typedef {Object<string, PropValues> & mpEvStandardProps} mpEvProperties
 */

/**
 * valid mixpanel property values; {@link https://help.mixpanel.com/hc/en-us/articles/115004547063-Properties-Supported-Data-Types more info}
 * @typedef { string | string[] | number | number[] | boolean | boolean[] | Date} PropValues
 */


/**
 * valid profile update types; {@link https://developer.mixpanel.com/reference/profile-set more info}
 * @typedef {'$set' | '$set_once' | '$add' | '$union' | '$append' | '$remove' | '$unset' } ProfileOperation
 * 
 */


/**
 * object of k:v pairs to update the profile
 * @typedef {Partial<Record<ProfileOperation, Object<string, PropValues>>>} ProfileData
 * 
 */

/**
 * @typedef {Object} mpUserStandardProps
 * @property {string} $distinct_id - the `distinct_id` of the profile to update
 * @property {string} $token - the mixpanel project identifier
 * @property {string | number} [$ip] - the IP of the end user (used for geo resolution) or `0` to turn off
 * @property {boolean} [$ignore_time] - whether or not to update `$last_seen`; default `true`
 */

/**
 * @typedef {Object} mpGroupStandardProps - a mixpanel user profile
 * @property {string} $group_key - the group (analytics) key for the entity
 * @property {string} $group_id - the uuid of the group; like `$distinct_id` for user profiles
 * @property {string} $token - the mixpanel project identifier
 */
