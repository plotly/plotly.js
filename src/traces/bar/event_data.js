/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function eventData(out, pt, trace) {
    // standard cartesian event data
    out.x = 'xVal' in pt ? pt.xVal : pt.x;
    out.y = 'yVal' in pt ? pt.yVal : pt.y;
    if(pt.xa) out.xaxis = pt.xa;
    if(pt.ya) out.yaxis = pt.ya;

    if(trace.orientation === 'h') {
        out.label = out.y;
        out.value = out.x;
    } else {
        out.label = out.x;
        out.value = out.y;
    }

    return out;
};
