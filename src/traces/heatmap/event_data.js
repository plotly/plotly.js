'use strict';

module.exports = function eventData(out, pt) {
    if ('index' in pt) {
        out.pointNumber = pt.index;
        out.pointIndex = pt.index;
    }

    if ('xVal' in pt) out.x = pt.xVal;
    else if ('x' in pt) out.x = pt.x;
    else if ('xLabelVal' in pt) out.x = pt.xLabelVal;

    if ('yVal' in pt) out.y = pt.yVal;
    else if ('y' in pt) out.y = pt.y;
    else if ('yLabelVal' in pt) out.y = pt.yLabelVal;

    if (pt.xa) out.xaxis = pt.xa;
    if (pt.ya) out.yaxis = pt.ya;

    if ('zLabelVal' in pt) {
        out.z = pt.zLabelVal;
    } else if ('z' in pt) {
        out.z = pt.z;
    }

    return out;
};