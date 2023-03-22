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

function formatDate(date = new Date()) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0' + minutes : minutes;
	var strTime = date.toLocaleDateString() + ' @ ' + hours + ':' + minutes + ampm;
	return strTime;
}

function serial(data) {
	return JSON.stringify(data)
}


if (typeof module !== 'undefined') module.exports = { comma, JSONtoCSV, sliceIntoChunks, formatDate, serial };