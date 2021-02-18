'use strict';

module.exports = function eventData(out, pt /* , trace, cd, pointNumber */) {
    // standard cartesian event data
    out.x = 'xVal' in pt ? pt.xVal : pt.x;
    out.y = 'yVal' in pt ? pt.yVal : pt.y;

    // for funnel
    if('initial' in pt) out.initial = pt.initial;
    if('delta' in pt) out.delta = pt.delta;
    if('final' in pt) out.final = pt.final;

    if(pt.xa) out.xaxis = pt.xa;
    if(pt.ya) out.yaxis = pt.ya;

    if ('x0' in pt) out.x0 = pt.x0;
    if ('x1' in pt) out.x1 = pt.x1;
    if ('y0' in pt) out.y0 = pt.y0;
    if ('y1' in pt) out.y1 = pt.y1;

    return out;
};
