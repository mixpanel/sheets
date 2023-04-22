/*
----
USAGE TRACKER
----
*/

/**
 * track stuff to mixpanel
 * - ex: `var t = track(); t('foo', {bar: "baz"})`
 *
 * @param  {Object} [superProps] - k:v pairs to remember
 * @param  {string} [distinct_id] - distinct_id
 * @param  {string} [token] - mixpanel token
 * @returns {function} func with signature: `(event, props = {}, cb = (res)=>{})`
 */
function tracker(superProps = {}, distinct_id, token = "41a033e6987a1340255ded808b237a38") {
    // identity resolution; could be better
    if (!distinct_id) {
        //noop
    }
    try {
        distinct_id = Session.getActiveUser().getEmail();
    } catch (e) {
        distinct_id = `anonymous`;
    }

    try {
        return function (eventName = "ping", props = {}) {
            try {
                const responses = [];

                const eventURL = `https://api.mixpanel.com/track?verbose=1`;
                const profileURL = `https://api.mixpanel.com/engage?verbose=1`;

                /** @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} */
                const reqOptions = {
                    method: "post",
                    contentType: "application/json",
                    headers: {
                        Accept: "text/plain"
                    },
                    muteHttpExceptions: true
                };

                const eventPayload = [
                    {
                        event: eventName,
                        properties: {
                            token: token,
                            distinct_id: distinct_id,
                            $source: "google apps script",
                            ip: "0",
                            "GCP User Id": Session.getTemporaryActiveUserKey() || "",
                            // @ts-ignore
                            "app version": APP_VERSION,
                            ...props,
                            ...superProps
                        }
                    }
                ];

                const profilePayload = [
                    {
                        $token: token,
                        $distinct_id: distinct_id,
                        $ip: "0",
                        $set: {
                            $name: distinct_id,
                            $email: distinct_id,
                            // @ts-ignore
                            "app version": APP_VERSION
                        }
                    }
                ];

                // send event
                try {
                    reqOptions.payload = JSON.stringify(eventPayload);
                    const resEvent = JSON.parse(UrlFetchApp.fetch(eventURL, reqOptions).getContentText());
                    responses.push(resEvent);
                } catch (e) {
                    //noop
                }

                // send profile
                try {
                    reqOptions.payload = JSON.stringify(profilePayload);
                    const resProfile = JSON.parse(UrlFetchApp.fetch(profileURL, reqOptions).getContentText());
                    responses.push(resProfile);
                } catch (e) {
                    //noop
                }

                return responses;
            } catch (e) {
                //noop: track should not break anything else
            }
        };
    } catch (e) {
        //if for some reason we can't return a tracker, return a noop function
        return function () {};
    }
}

if (typeof module !== "undefined") {
    module.exports = { tracker };
}
