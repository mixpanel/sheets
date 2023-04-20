type RecordTypes = 'event' | 'user' | 'group' | 'table';
type Regions = 'US' | 'EU';
type ProfileOperation = '$set' | '$set_once' | string;
type BatchSize = 200 | 2000 | number;
type AuthModes = 'service_account' | 'api_secret';
type EntityTypes = 'cohort' | 'report';
type track = Function;
type ConfigType = {
    config_type: 'sheet-to-mixpanel' | 'mixpanel-to-sheet';
};
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
    record_type: RecordTypes;
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
    region: Regions;
    /**
     * how we will authenticate
     */
    auth_type: AuthModes;
    /**
     * triggerId of this sync
     */
    trigger?: string;
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
     * id of the sheet to store sync results
     */
    receipt_sheet?: number;
    /**
     * is there a sync active?
     */
    active_sync?: boolean;
};
/**
 * all the options on a payload from Mixpanel → Sheet
 */
type MpSheetConfig = {
    /**
     * an identifier for where the config came from
     */
    config_type?: 'mixpanel-to-sheet';
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
     * triggerId of this sync
     */
    trigger?: string;
    /**
     * US or EU residence
     */
    region: Regions;
    /**
     * is this a cohort or a report...
     */
    entity_type: EntityTypes;
    /**
     * id of the cohort
     */
    cohort_id?: string | number;
    /**
     * id of the report
     */
    report_id?: string | number;
    /**
     * base64 auth string
     */
    auth?: string;
    /**
     * id of the sheet to store sync results
     */
    receipt_sheet?: number;
    /**
     * id of the sheet to show the data in
     */
    dest_sheet?: number;
    /**
     * is there a sync active?
     */
    active_sync?: boolean;
};
/**
 * a validated copy of SheetMpConfig
 */
type CleanConfig = {
    auth: string;
    project_id: string;
    region: Regions;
    batchSize: BatchSize;
    results: {
        batches: number;
        total: number;
        seconds: number;
        success: number;
        failed: number;
        errors: any[];
    };
    record_type: RecordTypes;
    token: string;
    lookup_table_id?: string;
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
    profile_operation: ProfileOperation;
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
    profile_operation: ProfileOperation;
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
    record_type: RecordTypes;
};
/**
 * a mixpanel API response
 */
type ImportResponse = {
    status: string;
    num_records_imported: number;
    code: number;
    failed_records?: any[];
    error?: string;
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
type Config = (SheetMpConfig | MpSheetConfig) & ConfigType;
type SheetMpConfig = SheetMpConfigAlways & (EventMappings & UserMappings & GroupMappings & TableMappings);
type Summary = {
    results: ImportResults;
};
/**
 * basic infos about the current sheet
 */
type SheetInfo = {
    /**
     * the human readable name of the sheet
     */
    sheet_name: string;
    /**
     * the id of the sheet
     */
    sheet_id: number;
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
