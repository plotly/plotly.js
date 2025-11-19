'use strict';

module.exports = function eventData(out, pt, trace, cd, pointNumber) {
    out.x = pt.x;
    out.y = pt.y;
    out.u = trace.u[pointNumber];
    out.v = trace.v[pointNumber];
    out.pointNumber = pointNumber;
    out.trace = trace;
};
