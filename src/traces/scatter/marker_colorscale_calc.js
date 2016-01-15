/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var hasColorscale = require('../../components/colorscale/has_colorscale');
var calcColorscale = require('../../components/colorscale/calc');

var subTypes = require('./subtypes');


// common to 'scatter', 'scatter3d' and 'scattergeo'
module.exports = function calcMarkerColorscale(trace) {
    if(!subTypes.hasMarkers(trace)) return;

    var marker = trace.marker;

    // auto-z and autocolorscale if applicable
    if(hasColorscale(trace, 'marker')) {
        calcColorscale(trace, marker.color, 'marker', 'c');
    }

    if(hasColorscale(trace, 'marker.line')) {
        calcColorscale(trace, marker.line.color, 'marker.line', 'c');
    }
};
