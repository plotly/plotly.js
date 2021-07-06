'use strict';

module.exports = function eventData(out, pt, trace, cd, pointNumber) {
    out.location = pt.location;
    out.z = pt.z;

    // include feature properties from input geojson
    var cdi = cd[pointNumber];
    if(cdi.fIn && cdi.fIn.properties) {
        out.properties = cdi.fIn.properties;
    }
    out.ct = cdi.ct;

    return out;
};
