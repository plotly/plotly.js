'use strict';


module.exports = function eventData(out, pt) {
    out.lon = pt.lon;
    out.lat = pt.lat;

    return out;
};
