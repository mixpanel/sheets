type Config = SheetMpConfig | MpSheetConfig;
type SheetMpConfig = SheetMpConfigAlways & (EventMappings | UserMappings | GroupMappings | TableMappings);
/**
 * all the options on a payload from Sheet → Mixpanel
 */
type SheetMpConfigAlways = {
    /**
     * an identifier for where the config came from
     */
    config_type?: 'sheet-to-mixpanel';
    /**
     * the record type being imported
     */
    record_type: 'event' | 'user' | 'group' | 'table';
    /**
     * the project identifier
     */
    project_id: string;
    /**
     * the project token
     */
    token: string;
    /**
     * US or EU residence
     */
    region: 'US' | 'EU';
    /**
     * how we will authenticate
     */
    auth_type: 'service_account' | 'api_secret';
    /**
     * service acct name
     */
    service_acct?: string;
    /**
     * service acct pass
     */
    service_secret?: string;
    /**
     * api secret
     */
    api_secret?: string;
    /**
     * base64 encoded credentials
     */
    auth?: string;
    /**
     * size of batch
     */
    batchSize?: 200 | 2000;
};
/**
 * mappings columns to fields for event imports
 */
type EventMappings = {
    /**
     * the sheet's source column name to be mapped to event name
     */
    event_name_col: string;
    /**
     * the sheet's source column name to be mapped to distinct_id
     */
    distinct_id_col: string;
    /**
     * the sheet's source column name to be mapped to event time
     */
    time_col: string;
    /**
     * the sheet's source column name to be mapped to $insert_id
     */
    insert_id_col?: string;
};
/**
 * mappings columns to fields for user imports
 */
type UserMappings = {
    /**
     * the sheet's source column name to be mapped to $distinct_id
     */
    distinct_id_col: string;
    /**
     * the type of operation to preform when updating the profile
     */
    profile_operation: '$set' | '$set_once' | string;
    /**
     * the sheet's source column name to be mapped to $name
     */
    name_col?: string;
    /**
     * the sheet's source column name to be mapped to $email
     */
    email_col?: string;
    /**
     * the sheet's source column name to be mapped to $avatar
     */
    avatar_col?: string;
    /**
     * the sheet's source column name to be mapped to $created
     */
    created_col?: string;
};
/**
 * mappings columns to fields for group imports
 */
type GroupMappings = {
    /**
     * the sheet's source column name to be mapped to $distinct_id
     */
    distinct_id_col: string;
    /**
     * the group identifier key
     */
    group_key: string;
    /**
     * the type of operation to preform when updating the profile
     */
    profile_operation: '$set' | '$set_once' | string;
    /**
     * the sheet's source column name to be mapped to $name
     */
    name_col?: string;
    /**
     * the sheet's source column name to be mapped to $email
     */
    email_col?: string;
    /**
     * the sheet's source column name to be mapped to $avatar
     */
    avatar_col?: string;
    /**
     * the sheet's source column name to be mapped to $created
     */
    created_col?: string;
};
/**
 * mappings columns to fields for lookup tables
 */
type TableMappings = {
    /**
     * the id of the lookup table in mixpanel
     */
    lookup_table_id: string;
};
/**
 * all the options on a payload from Mixpanel → Sheet
 */
type MpSheetConfig = {
    /**
     * an identifier for where the config came from
     */
    config_type?: 'sheet-to-mixpanel';
    /**
     * DEPRECATED; where to put the data
     */
    sheet_location?: 'current' | 'new';
    /**
     * URL from mixpanel report
     */
    mixpanel_report_url: string;
    /**
     * the project identifier
     */
    project_id: string;
    /**
     * service acct name
     */
    service_acct: string;
    /**
     * service acct pass
     */
    service_secret: string;
    /**
     * service acct pass
     */
    workspace_id: string;
    /**
     * base64 auth string
     */
    auth?: string;
    /**
     * US or EU residence
     */
    region: 'US' | 'EU';
    /**
     * id of the cohort
     */
    cohort_id?: string;
    /**
     * id of the report
     */
    report_id?: string;
    /**
     * is this a cohort or a report...
     */
    entity_type: 'cohort' | 'report';
};
/**
 * basic infos about the current sheet
 */
type SheetInfo = {
    /**
     * the human readable name of the sheet
     */
    name: string;
    /**
     * the id of the sheet
     */
    id: number;
};
/**
 * summary of results of an import
 */
type ImportResults = {
    /**
     * # of records attempted
     */
    total: number;
    /**
     * # succeeded
     */
    success: number;
    /**
     * # failed
     */
    failed: number;
    /**
     * time elapsed
     */
    seconds: number;
    startTime: number;
    endTime: number;
    /**
     * batches of requests
     */
    batches: number;
    /**
     * any failed requests
     */
    errors: any[];
    /**
     * type of import
     */
    record_type: 'event' | 'user' | 'group' | 'table';
};
/**
 * a mixpanel API response
 */
type ImportResponse = {
    status: string;
    num_records_imported: number;
    code: number;
};
type ReportParams = {
    meta: ReportMeta;
    payload: ReportPayload;
};
/**
 * report parameters
 */
type ReportPayload = any;
/**
 * metadata about a report
 */
type ReportMeta = {
    workspace_id: number;
    project_id: number;
    report_id: number;
    report_desc: string;
    report_type: string;
    report_name: string;
    report_creator: string | number;
    dashboard_id: number;
};
/**
 * metadata about a cohort
 */
type CohortMeta = {
    cohort_desc: string;
    project_id: number;
    cohort_name: string;
    cohort_id: number;
    cohort_count: number;
};
/**
 * - a mixpanel event
 */
type mpEvent = {
    /**
     * - the event name
     */
    event: string;
    /**
     * - the event's properties
     */
    properties: mpEvProperties;
};
/**
 * a user profile update payload
 */
type mpUser = mpUserStandardProps & ProfileData;
/**
 * a group profile update payload
 */
type mpGroup = mpGroupStandardProps & ProfileData;
/**
 * mixpanel's required event properties
 */
type mpEvStandardProps = {
    /**
     * - uuid of the end user
     */
    distinct_id: string;
    /**
     * - the UTC time of the event (unix epoch)
     */
    time: number;
    /**
     * - unique row id; used for deduplication
     */
    $insert_id?: string;
};
/**
 * event properties payload
 */
type mpEvProperties = {
    [x: string]: PropValues;
} & mpEvStandardProps;
/**
 * valid mixpanel property values; {@link https://help.mixpanel.com/hc/en-us/articles/115004547063-Properties-Supported-Data-Types more info}
 */
type PropValues = string | string[] | number | number[] | boolean | boolean[] | Date;
/**
 * valid profile update types; {@link https://developer.mixpanel.com/reference/profile-set more info}
 */
type ProfileOperation = '$set' | '$set_once' | '$add' | '$union' | '$append' | '$remove' | '$unset';
/**
 * object of k:v pairs to update the profile
 */
type ProfileData = Partial<Record<ProfileOperation, {
    [x: string]: PropValues;
}>>;
type mpUserStandardProps = {
    /**
     * - the `distinct_id` of the profile to update
     */
    $distinct_id: string;
    /**
     * - the mixpanel project identifier
     */
    $token: string;
    /**
     * - the IP of the end user (used for geo resolution) or `0` to turn off
     */
    $ip?: string | number;
    /**
     * - whether or not to update `$last_seen`; default `true`
     */
    $ignore_time?: boolean;
};
/**
 * - a mixpanel user profile
 */
type mpGroupStandardProps = {
    /**
     * - the group (analytics) key for the entity
     */
    $group_key: string;
    /**
     * - the uuid of the group; like `$distinct_id` for user profiles
     */
    $group_id: string;
    /**
     * - the mixpanel project identifier
     */
    $token: string;
};
