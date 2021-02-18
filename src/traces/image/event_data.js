'use strict';

module.exports = function eventData(out, pt) {
    if('xVal' in pt) out.x = pt.xVal;
    if('yVal' in pt) out.y = pt.yVal;

    if ('x0' in pt) out.x0 = pt.x0;
    if ('x1' in pt) out.x1 = pt.x1;
    if ('y0' in pt) out.y0 = pt.y0;
    if ('y1' in pt) out.y1 = pt.y1;

    if(pt.xa) out.xaxis = pt.xa;
    if(pt.ya) out.yaxis = pt.ya;
    out.color = pt.color;
    out.colormodel = pt.trace.colormodel;
    if(!out.z) out.z = pt.color;
    return out;
};
