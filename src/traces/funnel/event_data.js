/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function eventData(out, pt /* , trace, cd, pointNumber */) {
    // standard cartesian event data
    out.x = 'xVal' in pt ? pt.xVal : pt.x;
    out.y = 'yVal' in pt ? pt.yVal : pt.y;

    // for funnel
    if('percentInitial' in pt) out.percentInitial = pt.percentInitial;
    if('percentPrevious' in pt) out.percentPrevious = pt.percentPrevious;
    if('percentTotal' in pt) out.percentTotal = pt.percentTotal;

    if(pt.xa) out.xaxis = pt.xa;
    if(pt.ya) out.yaxis = pt.ya;

    return out;
};
