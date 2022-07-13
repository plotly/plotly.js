'use strict';

module.exports = function eventData(out, pt, trace, cd, pointNumber) {
    // standard cartesian event data
    out.x = 'xVal' in pt ? pt.xVal : pt.x;
    out.y = 'yVal' in pt ? pt.yVal : pt.y;

    // for 2d histograms
    if('zLabelVal' in pt) out.z = pt.zLabelVal;

    if(pt.xa) out.xaxis = pt.xa;
    if(pt.ya) out.yaxis = pt.ya;

    // specific to histogram - CDFs do not have pts (yet?)
    if(!(trace.cumulative || {}).enabled) {
        var pts = Array.isArray(pointNumber) ?
            cd[0].pts[pointNumber[0]][pointNumber[1]] :
            cd[pointNumber].pts;

        out.pointNumbers = pts;
        out.binNumber = out.pointNumber;
        delete out.pointNumber;
        delete out.pointIndex;

        var pointIndices;
        if(trace._indexToPoints) {
            pointIndices = [];
            for(var i = 0; i < pts.length; i++) {
                pointIndices = pointIndices.concat(trace._indexToPoints[pts[i]]);
            }
        } else {
            pointIndices = pts;
        }

        out.pointIndices = pointIndices;
    }

    return out;
};
