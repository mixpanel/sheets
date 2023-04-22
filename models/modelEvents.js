/*
----
MIXPANEL EVENTS
https://developer.mixpanel.com/reference/import-events
----
*/

/**
 * model a mixpanel event from flat JSON
 *
 * @param  {Object} row
 * @param  {EventMappings} mappings
 * @returns {mpEvent}
 */
function modelMpEvents(row, mappings) {
    const { distinct_id_col, event_name_col, time_col, insert_id_col } = mappings;

    // required fields
    if (!distinct_id_col) throw "distinct_id_col mapping is required!";
    if (!event_name_col) throw "event_name_col mapping is required!";
    if (!time_col) throw "time_col mapping is required!";

    // create a copy, so we don't alter the source
    row = Object.assign({}, row);

    const mpEvent = {
        event: row[event_name_col].toString(),
        properties: {
            distinct_id: row[distinct_id_col].toString(),
            $source: "sheets-mixpanel"
        }
    };

    //time
    if (time_col) {
        try {
            // google sheet 'date' objects are javascript date objects:
            // ? https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime
            mpEvent.properties.time = row[time_col].getTime();
        } catch (e) {
            //todo ... parse other date formats... maybe dayjs? needs to be bundled...
            // ? https://medium.com/geekculture/the-ultimate-guide-to-npm-modules-in-google-apps-script-a84545c3f57c
            mpEvent.properties.time = row[time_col];
        }
    }

    //insert_id
    if (insert_id_col) {
        mpEvent.properties.$insert_id = row[insert_id_col]?.toString(); //insert_ids are always strings
    } else {
        mpEvent.properties.$insert_id = MD5(
            `${mpEvent.event} ${mpEvent.properties.distinct_id} ${mpEvent.properties.time}`
        );
    }

    delete row[distinct_id_col];
    delete row[event_name_col];
    delete row[insert_id_col];
    delete row[time_col];

    try {
        for (const key in row) {
            if (row[key]?.toISOString) {
				// other fields that are dates
                mpEvent.properties[key] = row[key].toISOString();
            } else {
                mpEvent.properties[key] = row[key];
            }
        }
    } catch (e) {
        //noop
    }

    // @ts-ignore
    return mpEvent;
}

if (typeof module !== "undefined") {
    const { MD5 } = require("../utilities/md5.js");
    module.exports = { modelMpEvents };
}
