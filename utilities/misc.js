/*
----
MISCELANOUS TOOLS TO MAKE LIFE EASIER
	...by now you have discovered that everything is one big global 龴ↀ◡ↀ龴
----
*/

function comma(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function JSONtoCSV(arr) {
    const headers = Object.keys(arr[0]);
    const array = [headers].concat(arr);

    return array
        .map(it => {
            return Object.values(it).toString();
        })
        .join("\n");
}

function sliceIntoChunks(arr, chunkSize = 2000) {
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
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = date.toLocaleDateString() + " @ " + hours + ":" + minutes + ampm;
    return strTime;
}

//this functions are used mostly for testing equality

function serial(data) {
    return JSON.stringify(data);
}

function isDeepEqual(object1, object2) {
    const objKeys1 = Object.keys(object1);
    const objKeys2 = Object.keys(object2);

    if (objKeys1.length !== objKeys2.length) return false;

    for (var key of objKeys1) {
        const value1 = object1[key];
        const value2 = object2[key];

        const isObjects = isObject(value1) && isObject(value2);

        if ((isObjects && !isDeepEqual(value1, value2)) || (!isObjects && value1 !== value2)) {
            return false;
        }
    }
    return true;
}

function isObject(object) {
    return object != null && typeof object === "object";
}

if (typeof module !== "undefined") module.exports = { comma, JSONtoCSV, sliceIntoChunks, formatDate, serial, isDeepEqual, isObject };
