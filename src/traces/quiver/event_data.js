'use strict';

module.exports = function eventData(out, pt, trace, cd, pointNumber) {
    out.x = pt.x;
    out.y = pt.y;
    out.u = trace.u ? trace.u[pointNumber] : undefined;
    out.v = trace.v ? trace.v[pointNumber] : undefined;
    
    return out;
};
