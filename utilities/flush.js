function flushToMixpanel(data, config) {
	const batches = sliceIntoChunks(data, config.batchSize);
	
	//todo url types
	const URL = config.region === 'US' ? "https://api.mixpanel.com/import?strict=1" : "https://api-eu.mixpanel.com/import";
	const options = {
		'method': 'POST',
		'contentType': 'application/json',
		'headers': {
			Authorization: `Basic ${Utilities.base64Encode(config.auth)}`,
			Accept: 'application/json'
		}
	};
	const responses = [];
	for (const batch of batches) {
		options.payload = JSON.stringify(batch);
		const res = UrlFetchApp.fetch(URL, options);
		responses.push(JSON.parse(res.getContentText()));		
	}

	return responses
}


//todo batch also by size
function sliceIntoChunks(arr, chunkSize) {
	const res = [];
	for (let i = 0; i < arr.length; i += chunkSize) {
		const chunk = arr.slice(i, i + chunkSize);
		res.push(chunk);
	}
	return res;
}