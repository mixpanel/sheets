/*
----
VALIDATE CREDENTIALS
----
*/

/**
 * validate service account or API secret credentials
 * @param  {SheetMpConfig | MpSheetConfig | CleanConfig} config
 * @returns {string} a valid auth string
 * @throws {Error} a validation error
 */
function validateCreds(config) {
    // @ts-ignore
    const { api_secret = null, service_acct = null, service_secret = null, project_id = null } = config;

    if (!project_id) throw "missing project id";

    let userPassStr;
    if (service_acct && service_secret) {
        userPassStr = `${service_acct}:${service_secret}`;
    } else if (api_secret) {
        userPassStr = `${api_secret}:`;
    } else {
        throw "missing credentials";
    }

    const auth = Utilities.base64Encode(userPassStr);
    const url = `https://api.mixpanel.com/import?project_id=${project_id}&strict=0&verbose=1`;

    /** @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} */
    const options = {
        method: "post",
        contentType: "application/json",
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json"
        },
        muteHttpExceptions: true,
        payload: JSON.stringify([{}]) //sending an empty event to /import will validate the credentials + project_id
    };

    const expected = {
        code: 200,
        error: "some data points in the request failed validation",
        num_records_imported: 0,
        status: 0
    };

    try {
        const res = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
        if (isDeepEqual(res, expected)) {
            return auth; //this value can now be used to authenticate
        } else {
            const msg = res.error || "could not validate credentials";
            throw msg;
        }
    } catch (e) {
        throw e;
    }
}

if (typeof module !== "undefined") {
    const { isDeepEqual } = require("./misc.js");
    module.exports = { validateCreds };
}
