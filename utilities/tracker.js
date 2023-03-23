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
function tracker(superProps = {}, distinct_id, token = "703d5a3c06f359bdd838cb4cbc8abe7a" ) {
	// identity resolution; could be better
	if (!distinct_id);
	try {
		distinct_id = Session.getActiveUser().getEmail();
	}
	catch (e) {
		distinct_id = `anonymous`;
	}

	return function (eventName = "ping", props = {}) {
		const responses = [];

		const eventURL = `https://api.mixpanel.com/track?verbose=1`;
		const profileURL = `https://api.mixpanel.com/engage?verbose=1`;

		const reqOptions = {
			method: 'POST',
			contentType: 'application/json',
			headers: {
				Accept: 'text/plain'
			},
			muteHttpExceptions: true
		};

		const eventPayload = [
			{
				event: eventName,
				properties: {
					token: token,
					distinct_id: distinct_id,
					$source: 'google apps script',
					ip: "0",
					...props,
					...superProps
				}
			}
		];

		const profilePayload = [{
			$token: token,
			$distinct_id: distinct_id,
			$ip: "0",
			$set: {
				$name: distinct_id,
				$email: distinct_id
			}
		}];

		// send event
		try {
			reqOptions.payload = JSON.stringify(eventPayload);
			const resEvent = JSON.parse(UrlFetchApp.fetch(eventURL, reqOptions).getContentText());
			responses.push(resEvent);
		}
		catch (e) {
			//noop
		}

		// send profile
		try {
			reqOptions.payload = JSON.stringify(profilePayload);
			const resProfile = JSON.parse(UrlFetchApp.fetch(profileURL, reqOptions).getContentText());
			responses.push(resProfile);
		}

		catch (e) {
			//noop
		}

		return responses;

	};
};
