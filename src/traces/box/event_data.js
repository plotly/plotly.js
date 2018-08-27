/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function eventData(out, pt) {
    if(pt.hoverOnBox) out.hoverOnBox = pt.hoverOnBox;

    // TODO Clean up
    if('xVal' in pt) out.x = pt.xVal;
    else if('x' in pt) out.x = pt.x;

    if('yVal' in pt) out.y = pt.yVal;
    else if('y' in pt) out.y = pt.y;

    if(pt.xa) out.xaxis = pt.xa;
    if(pt.ya) out.yaxis = pt.ya;
    if(pt.zLabelVal !== undefined) out.z = pt.zLabelVal;

    return out;
};
