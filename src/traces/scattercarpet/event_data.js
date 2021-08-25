'use strict';

module.exports = function eventData(out, pt, trace, cd, pointNumber) {
    var cdi = cd[pointNumber];

    out.a = cdi.a;
    out.b = cdi.b;
    out.y = cdi.y;

    return out;
};
