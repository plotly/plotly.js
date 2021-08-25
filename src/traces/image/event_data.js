'use strict';

module.exports = function eventData(out, pt) {
    if('xVal' in pt) out.x = pt.xVal;
    if('yVal' in pt) out.y = pt.yVal;
    if(pt.xa) out.xaxis = pt.xa;
    if(pt.ya) out.yaxis = pt.ya;
    out.color = pt.color;
    out.colormodel = pt.trace.colormodel;
    if(!out.z) out.z = pt.color;
    return out;
};
