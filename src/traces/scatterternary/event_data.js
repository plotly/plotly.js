'use strict';

module.exports = function eventData(out, pt, trace, cd, pointNumber) {
    if(pt.xa) out.xaxis = pt.xa;
    if(pt.ya) out.yaxis = pt.ya;

    if ('x0' in pt) out.x0 = pt.x0;
    if ('x1' in pt) out.x1 = pt.x1;
    if ('y0' in pt) out.y0 = pt.y0;
    if ('y1' in pt) out.y1 = pt.y1;

    if(cd[pointNumber]) {
        var cdi = cd[pointNumber];

        // N.B. These are the normalized coordinates.
        out.a = cdi.a;
        out.b = cdi.b;
        out.c = cdi.c;
    } else {
        // for fill-hover only
        out.a = pt.a;
        out.b = pt.b;
        out.c = pt.c;
    }

    return out;
};
