'use strict';

module.exports = function (out, pt, trace, cd, pointNumber) {
    if (pt.xa) out.xaxis = pt.xa;
    if (pt.ya) out.yaxis = pt.ya;

    // normalized coordinates are stored in trace._a, _b and _c in ../calc.js
    out.a = trace._a[pointNumber];
    out.b = trace._b[pointNumber];
    out.c = trace._c[pointNumber];

    // no fill-hover because scattergl (scatterternarygl) does not currently support hoveron

    return out;
};
