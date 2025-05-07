/*
----
VALIDATE CREDENTIALS
----
*/

/**
 * validate service account or API secret credentials
 * @overload
 * @param {SheetMpConfig} config
 * @returns {string}
 * @overload
 * @param  {MpSheetConfig} config
 * @returns {string} a valid auth string
 * @throws {Error} a validation error
 */
function validateCreds(config) {
    const { api_secret = null, service_acct = null, service_secret = null, project_id = null } = config;
    if (!project_id) throw "missing project id";

    if (config.config_type === "sheet-to-mixpanel") {
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
            error: "data, missing or empty",
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

    if (config.config_type === "mixpanel-to-sheet") {
        //always a service account
        const userPassStr = `${service_acct}:${service_secret}`;
        const auth = Utilities.base64Encode(userPassStr);
        const url = `https://mixpanel.com/api/app/me`;

        /** @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} */
        const options = {
            method: "get",
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json"
            },
            muteHttpExceptions: false
        };

        try {
            const res = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
            //check project
            if (!res.results.projects[project_id.toString()]) {
                throw `access: ${service_acct} does not have access to ${project_id.toString()}`;
            }

            const permissionNeeded = "view_base_reports";
            const permissionsGranted = res.results.projects[project_id.toString()].permissions;

            //check permissions
            if (permissionsGranted.includes(permissionNeeded)) {
                return auth;
            } else {
                throw `permissions: ${service_acct} does not have permission to view reports on project ${project_id.toString()}`;
            }
        } catch (e) {
            throw `401 Unauthorized: invalid service account credentials`;
        }
    }

    //otherwise blow up
    throw "cloud not figure out how to validate credentials";
}

if (typeof module !== "undefined") {
    const { isDeepEqual } = require("./misc.js");
    module.exports = { validateCreds };
}
