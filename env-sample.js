/* cSpell:disable */

/*
----
SECRETS
----
*/


const SERVICE_ACCOUNT = "";
const SERVICE_SECRET = "";
const API_SECRET = "";
const TOKEN = "";

const REPORT_CREATOR = ""
const PROJECT_ID = 0;
const DASHBOARD_ID = 0
const WORKSPACE_ID = 0;

const INSIGHTS_REPORT_ID = 0;
const INSIGHTS_REPORT_NAME = ""
const INSIGHTS_REPORT_DESC = "";

const FUNNELS_REPORT_ID = 0;
const FUNNELS_REPORT_NAME = "";
const FUNNELS_REPORT_DESC = "";


const RETENTION_REPORT_ID = 0
const RETENTION_REPORT_NAME = "";
const RETENTION_REPORT_DESC = "";


const FLOWS_REPORT_ID = 0;

const COHORT_ID = 0;
const COHORT_NAME = "";
const COHORT_DESC = "";
const COHORT_COUNT = 0

/** @type {SheetMpConfigAlways & EventMappings} */
const TEST_CONFIG_EVENTS = {
    record_type: "event",
    event_name_col: "action",
    distinct_id_col: "uuid",
    time_col: "timestamp",
    insert_id_col: "insert",
    project_id: PROJECT_ID,
    token: TOKEN,
    region: "US",
    auth_type: "service_account",
    service_acct: SERVICE_ACCOUNT,
    service_secret: SERVICE_SECRET
};

/** @type {mpEvent[]} */
const TEST_CONFIG_EVENTS_DATA = [
    {
        event: "foo",
        properties: {
            distinct_id: "bar",
            time: 1679835334,
            $insert_id: "123"
        }
    }
];

/** @type {SheetMpConfigAlways & UserMappings} */
const TEST_CONFIG_USERS = {
    record_type: "user",
    distinct_id_col: "uuid",
    project_id: PROJECT_ID,
    token: TOKEN,
    region: "US",
    auth_type: "service_account",
    service_acct: SERVICE_ACCOUNT,
    service_secret: SERVICE_SECRET,
	profile_operation: "$set"
};

/** @type {mpUser[]} */
const TEST_CONFIG_USERS_DATA = [
    {
        $distinct_id: "bar",
        $token: TOKEN,
        $set: {
            qux: "mux"
        }
    }
];

/** @type {SheetMpConfigAlways & GroupMappings} */
const TEST_CONFIG_GROUPS = {
    record_type: "group",
    group_key: "other_id",
    distinct_id_col: "groupId",
    project_id: PROJECT_ID,
    token: TOKEN,
    region: "US",
    auth_type: "service_account",
    service_acct: SERVICE_ACCOUNT,
    service_secret: SERVICE_SECRET,
	profile_operation: "$set"
};

/** @type {mpGroup[]} */
const TEST_CONFIG_GROUPS_DATA = [
    {
        $group_key: "other_id",
        $group_id: "garply",
        $token: TOKEN,
        $set: {
            qux: "mux"
        }
    }
];

/** @type {SheetMpConfigAlways & TableMappings} */
const TEST_CONFIG_TABLES = {
    record_type: "table",
    lookup_table_id: "1d4af3b6-e832-432c-84d4-642994aba4e9",
    project_id: PROJECT_ID,
    token: TOKEN,
    region: "US",
    auth_type: "service_account",
    service_acct: SERVICE_ACCOUNT,
    service_secret: SERVICE_SECRET
};

const TEST_CONFIG_TABLES_DATA = [
    {
        foo: "bar",
        baz: "qux",
        mux: "dux"
    }
];

/** @type {MpSheetConfig} */
const TEST_CONFIG_REPORTS_INSIGHTS = {
    mixpanel_report_url: "https://mixpanel.com/project/2943452/view/3466588/app/boards#id=4690699&editor-card-id=%22report-38075731%22",
    service_acct: SERVICE_ACCOUNT,
    service_secret: SERVICE_SECRET,
    report_id: INSIGHTS_REPORT_ID,
    project_id: PROJECT_ID,
    workspace_id: WORKSPACE_ID,
    region: "US",
    entity_type: "report"
};

/** @type {MpSheetConfig} */
const TEST_CONFIG_REPORTS_FUNNELS = {
    mixpanel_report_url: "https://mixpanel.com/project/2943452/view/3466588/app/funnels/#view/38075728/a-funnel-report",
    service_acct: SERVICE_ACCOUNT,
    service_secret: SERVICE_SECRET,
    report_id: FUNNELS_REPORT_ID,
    project_id: PROJECT_ID,
    workspace_id: WORKSPACE_ID,
    region: "US",
    entity_type: "report"
};

/** @type {MpSheetConfig} */
const TEST_CONFIG_REPORTS_RETENTION = {
    mixpanel_report_url: "https://mixpanel.com/project/2943452/view/3466588/app/retention#report/38075736/a-retention-report/",
    service_acct: SERVICE_ACCOUNT,
    service_secret: SERVICE_SECRET,
    report_id: RETENTION_REPORT_ID,
    project_id: PROJECT_ID,
    workspace_id: WORKSPACE_ID,
    region: "US",
    entity_type: "report"
};

/** @type {MpSheetConfig} */
const TEST_CONFIG_REPORTS_FLOWS = {
    mixpanel_report_url: "https://mixpanel.com/project/2943452/view/3466588/app/retention#report/38075736/a-retention-report/",
    service_acct: SERVICE_ACCOUNT,
    service_secret: SERVICE_SECRET,
    report_id: FLOWS_REPORT_ID,
    project_id: PROJECT_ID,
    workspace_id: WORKSPACE_ID,
    region: "US",
    entity_type: "report"
};

/** @type {MpSheetConfig} */
const TEST_CONFIG_COHORTS = {
    mixpanel_report_url: "https://mixpanel.com/project/2943452/view/3467739/app/entity-management#~(entityType~'cohorts)",
    service_acct: SERVICE_ACCOUNT,
    service_secret: SERVICE_SECRET,
    cohort_id: COHORT_ID,
    project_id: PROJECT_ID,
    workspace_id: WORKSPACE_ID,
    region: "US",
    entity_type: "cohort"
};

const GOOD_SERVICE_ACCOUNT = {
    project_id: PROJECT_ID,
    service_acct: SERVICE_ACCOUNT,
    service_secret: SERVICE_SECRET,
    answer: "c2hlZXRNRS4zYWZjMDYubXAtc2VydmljZS1hY2NvdW50OnNBS0JIb2tyQmZINWpEcWlDNWdNMmZ1bUtpbDk4aFlT"
};

const BAD_SERVICE_ACCOUNT = {
    project_id: PROJECT_ID,
    service_acct: "sheetME.3afc06.mp-service-account   Z",
    service_secret: "sAKBHokrBfH5jDqiC5gM2fumKil98hYS  Z"
};

const BAD_PROJECT_SERVICE_ACCOUNT = {
    project_id: "420",
    service_acct: SERVICE_ACCOUNT,
    service_secret: SERVICE_SECRET
};

const GOOD_API_SECRET = {
    project_id: PROJECT_ID,
    api_secret: API_SECRET,
    answer: "ODJjODc0Nzc3MTU1Y2YwMjAzNDQwMTRjYmRkMWE4MmQ6"
};

const BAD_API_SECRET = {
    project_id: PROJECT_ID,
    api_secret: `${API_SECRET} z`
};

const BAD_PROJECT_API_SECRET = {
    project_id: "420",
    api_secret: API_SECRET
};
