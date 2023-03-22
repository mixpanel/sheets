/*
----
MISCELANOUS TOOLS TO MAKE LIFE EASIER
	(by now you have discovered that everything is one big global 龴ↀ◡ↀ龴
----
*/


function comma(num) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};


function JSONtoCSV(arr) {
	const array = [Object.keys(arr[0])].concat(arr);

	return array.map(it => {
		return Object.values(it).toString();
	}).join('\n');
}


function sliceIntoChunks(arr, chunkSize) {
	const res = [];
	for (let i = 0; i < arr.length; i += chunkSize) {
		const chunk = arr.slice(i, i + chunkSize);
		res.push(chunk);
	}
	return res;
}