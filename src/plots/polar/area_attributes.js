/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterAttrs = require('../../traces/scatter/attributes');
var scatterMarkerAttrs = scatterAttrs.marker;

module.exports = {
    r: scatterAttrs.r,
    t: scatterAttrs.t,
    marker: {
        color: scatterMarkerAttrs.color,
        size: scatterMarkerAttrs.size,
        symbol: scatterMarkerAttrs.symbol,
        opacity: scatterMarkerAttrs.opacity
    }
};
