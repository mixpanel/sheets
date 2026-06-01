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
    if (!project_id) throw "Project ID is required. You can find it in your Mixpanel project settings at https://mixpanel.com/settings/project";

    if (config.config_type === "sheet-to-mixpanel") {
        let userPassStr;
        if (service_acct && service_secret) {
            userPassStr = `${service_acct}:${service_secret}`;
        } else if (api_secret) {
            userPassStr = `${api_secret}:`;
        } else {
            throw "Please enter your Mixpanel service account credentials or API secret. If you previously saved credentials, they may have been cleared.";
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
                const msg = res.error || "Unable to validate credentials. Please check your service account or API secret.";
                throw msg;
            }
        } catch (e) {
            // Network or connection errors
            if (e.toString().includes("Exception")) {
                throw "Unable to connect to Mixpanel. Please check your internet connection and try again.";
            }
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
                throw `Service account "${service_acct}" doesn't have access to project ${project_id}. Please verify the project ID and ensure your service account is added to this project.`;
            }

            const permissionNeeded = "view_base_reports";
            const permissionsGranted = res.results.projects[project_id.toString()].permissions;

            //check permissions
            if (permissionsGranted.includes(permissionNeeded)) {
                return auth;
            } else {
                throw `Service account "${service_acct}" needs "view_base_reports" permission to export data. Please ask your project admin to grant Consumer role or higher.`;
            }
        } catch (e) {
            // If we already threw a helpful error above, re-throw it
            if (e.toString().includes("Service account") || e.toString().includes("permission")) {
                throw e;
            }
            // Network or auth errors
            if (e.toString().includes("Exception")) {
                throw "Unable to connect to Mixpanel. Please check your internet connection and try again.";
            }
            throw `Your service account credentials are invalid or have been revoked. Please check your username and secret.`;
        }
    }

    //otherwise blow up
    throw "Unable to validate credentials. Please ensure you've selected the correct data import/export type.";
}

if (typeof module !== "undefined") {
    const { isDeepEqual } = require("./misc.js");
    module.exports = { validateCreds };
}
