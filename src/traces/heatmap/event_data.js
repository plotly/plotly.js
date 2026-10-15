'use strict';

module.exports = function eventData(out, pt) {
    // Standard cartesian event data
    if('xLabelVal' in pt) out.x = pt.xLabelVal;
    if('yLabelVal' in pt) out.y = pt.yLabelVal;
    if(pt.xa) out.xaxis = pt.xa;
    if(pt.ya) out.yaxis = pt.ya;
    if(pt.zLabelVal !== undefined) out.z = pt.zLabelVal;
    return out;
};
