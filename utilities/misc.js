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
    //@ts-ignore
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = date.toLocaleDateString() + " @ " + hours + ":" + minutes + ampm;
    return strTime;
}

function clone(thing, opts) {
    var newObject = {};
    if (thing instanceof Array) {
        return thing.map(function (i) {
            return clone(i, opts);
        });
    } else if (thing instanceof Date) {
        return new Date(thing);
    } else if (thing instanceof RegExp) {
        return new RegExp(thing);
    } else if (thing instanceof Function) {
        // @ts-ignore
        return opts && opts.newFns ? new Function("return " + thing.toString())() : thing;
    } else if (thing instanceof Object) {
        Object.keys(thing).forEach(function (key) {
            newObject[key] = clone(thing[key], opts);
        });
        return newObject;
    } else if ([undefined, null].indexOf(thing) > -1) {
        return thing;
    } else {
        if (thing.constructor.name === "Symbol") {
            return Symbol(
                thing
                    .toString()
                    .replace(/^Symbol\(/, "")
                    .slice(0, -1)
            );
        }
        // return _.clone(thing);  // If you must use _ ;)
        return thing.__proto__.constructor(thing);
    }
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

if (typeof module !== "undefined") {
    module.exports = { comma, JSONtoCSV, sliceIntoChunks, formatDate, serial, isDeepEqual, isObject, clone };
}
