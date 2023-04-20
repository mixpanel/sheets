// @ts-nocheck

/*
----
TYPES
	google apps script uses jsdoc for it's typings... so we might as well try...
----
*/

/*
----
PRIMITIVES
----
*/

/**
 * @typedef {'event' | 'user' | 'group' | 'table'} RecordTypes
 */

/**
 * @typedef {'US' | 'EU'} Regions
 */

/**
 * @typedef {'$set' | '$set_once' | string} ProfileOperation
 */

/**
 * @typedef {200 | 2000 | number} BatchSize
 */

/**
 * @typedef {'service_account' | 'api_secret'} AuthModes
 */

/**
 * @typedef { 'cohort' | 'report'} EntityTypes
 */

/**
 * @typedef {Function} track
 * @global
 */

/*
----
CORE CONFIGS
----
*/

/**
 * @typedef {Object} ConfigType
 * @property {'sheet-to-mixpanel' | 'mixpanel-to-sheet' } config_type
 */

/**
 * @typedef {Object} SheetMpConfigAlways all the options on a payload from Sheet → Mixpanel
 * @property {'sheet-to-mixpanel'} [config_type] an identifier for where the config came from
 * @property {RecordTypes} record_type the record type being imported
 * @property {string} project_id the project identifier
 * @property {string} token the project token
 * @property {Regions} region US or EU residence
 * @property {AuthModes} auth_type how we will authenticate
 * @property {string} [trigger] triggerId of this sync
 * @property {string} [service_acct] service acct name
 * @property {string} [service_secret] service acct pass
 * @property {string} [api_secret] api secret
 * @property {string} [auth] base64 encoded credentials
 * @property {number} [receipt_sheet] id of the sheet to store sync results
 * @property {boolean} [active_sync] is there a sync active?
 
 *
 */

/**
 * @typedef {Object} MpSheetConfig all the options on a payload from Mixpanel → Sheet
 * @property {'mixpanel-to-sheet'} [config_type] an identifier for where the config came from
 * @property {string} mixpanel_report_url URL from mixpanel report
 * @property {string} project_id the project identifier
 * @property {string} service_acct service acct name
 * @property {string} service_secret service acct pass
 * @property {string} workspace_id service acct pass
 * @property {string} [trigger] triggerId of this sync
 * @property {Regions} region US or EU residence
 * @property {EntityTypes} entity_type is this a cohort or a report...
 * @property {string | number} [cohort_id] id of the cohort
 * @property {string | number} [report_id] id of the report
 * @property {string} [auth] base64 auth string
 * @property {number} [receipt_sheet] id of the sheet to store sync results
 * @property {number} [dest_sheet] id of the sheet to show the data in
 * @property {boolean} [active_sync] is there a sync active?
 *
 */

/**
 * @typedef {object} CleanConfig a validated copy of SheetMpConfig
 * @property {string} auth
 * @property {string} project_id
 * @property {Regions} region
 * @property {BatchSize} batchSize
 * @property {object} results
 * @property {number} results.batches
 * @property {number} results.total
 * @property {number} results.seconds
 * @property {number} results.success
 * @property {number} results.failed
 * @property {Object[]} results.errors
 * @property {RecordTypes} record_type
 * @property {string} token
 * @property {string} [lookup_table_id]
 */

/*
----
MAPPINGS
----
*/

/**
 * @typedef {Object} EventMappings mappings columns to fields for event imports
 * @property {string} event_name_col the sheet's source column name to be mapped to event name
 * @property {string} distinct_id_col the sheet's source column name to be mapped to distinct_id
 * @property {string} time_col the sheet's source column name to be mapped to event time
 * @property {string} [insert_id_col] the sheet's source column name to be mapped to $insert_id
 */

/**
 * @typedef {Object} UserMappings mappings columns to fields for user imports
 * @property {string} distinct_id_col the sheet's source column name to be mapped to $distinct_id
 * @property {ProfileOperation} profile_operation the type of operation to preform when updating the profile
 * @property {string} [name_col] the sheet's source column name to be mapped to $name
 * @property {string} [email_col] the sheet's source column name to be mapped to $email
 * @property {string} [avatar_col] the sheet's source column name to be mapped to $avatar
 * @property {string} [created_col] the sheet's source column name to be mapped to $created
 *
 */

/**
 * @typedef {Object} GroupMappings mappings columns to fields for group imports
 * @property {string} distinct_id_col the sheet's source column name to be mapped to $distinct_id
 * @property {string} group_key the group identifier key
 * @property {ProfileOperation} profile_operation the type of operation to preform when updating the profile
 * @property {string} [name_col] the sheet's source column name to be mapped to $name
 * @property {string} [email_col] the sheet's source column name to be mapped to $email
 * @property {string} [avatar_col] the sheet's source column name to be mapped to $avatar
 * @property {string} [created_col] the sheet's source column name to be mapped to $created
 */

/**
 * @typedef {Object} TableMappings mappings columns to fields for lookup tables
 * @property {string} lookup_table_id the id of the lookup table in mixpanel
 */

/*
----
DATA IMPORTS
----
*/

/**
 * @typedef {Object} ImportResults summary of results of an import
 * @property {number} total # of records attempted
 * @property {number} success # succeeded
 * @property {number} failed # failed
 * @property {number} seconds time elapsed
 * @property {number} startTime
 * @property {number} endTime
 * @property {number} batches batches of requests
 * @property {Object[]} errors any failed requests
 * @property {RecordTypes} record_type type of import
 */

/**
 * @typedef {Object} ImportResponse a mixpanel API response
 * @property {string} status
 * @property {number} num_records_imported
 * @property {number} code
 * @property {Object[]} [failed_records]
 * @property {string} [error]
 */

/*
----
DATA EXPORTS
----
*/

/**
 * @typedef {Object} ReportParams
 * @property {ReportMeta} meta
 * @property {ReportPayload} payload
 */

/**
 * @typedef {Object} ReportPayload report parameters
 */

/**
 * @typedef {Object} ReportMeta metadata about a report
 * @property {number} workspace_id
 * @property {number} project_id
 * @property {number} report_id
 * @property {string} report_desc
 * @property {string} report_type
 * @property {string} report_name
 * @property {string | number} report_creator
 * @property {number} dashboard_id
 */

/**
 * @typedef {Object} CohortMeta metadata about a cohort
 * @property {string} cohort_desc
 * @property {number} project_id
 * @property {string} cohort_name
 * @property {number} cohort_id
 * @property {number} cohort_count
 */

/*
----
COMPLEX TYPES
----
*/

/**
 * @typedef {(SheetMpConfig | MpSheetConfig) & ConfigType } Config
 */

/**
 * @typedef {SheetMpConfigAlways & (EventMappings & UserMappings & GroupMappings & TableMappings)} SheetMpConfig
 *
 */

/**
 * @typedef {Object} Summary
 * @property {ImportResults} results
 */

/*
----
MISC
----
*/

/**
 * @typedef {Object} SheetInfo basic infos about the current sheet
 * @property {string} sheet_name the human readable name of the sheet
 * @property {number} sheet_id the id of the sheet
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
