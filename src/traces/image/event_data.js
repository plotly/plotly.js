/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

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
