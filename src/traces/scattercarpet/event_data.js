'use strict';

module.exports = function eventData(out, pt, trace, cd, pointNumber) {
    var cdi = cd[pointNumber];

    out.a = cdi.a;
    out.b = cdi.b;
    out.y = cdi.y;

    if ('x0' in pt) out.x0 = pt.x0;
    if ('x1' in pt) out.x1 = pt.x1;
    if ('y0' in pt) out.y0 = pt.y0;
    if ('y1' in pt) out.y1 = pt.y1;

    return out;
};
