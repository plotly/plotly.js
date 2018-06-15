/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterPlot = require('../scatter/plot');
var BADNUM = require('../../constants/numerical').BADNUM;

module.exports = function plot(gd, subplot, moduleCalcData) {
    var i, j;

    var plotinfo = {
        xaxis: subplot.xaxis,
        yaxis: subplot.yaxis,
        plot: subplot.framework,
        layerClipId: subplot._hasClipOnAxisFalse ? subplot.clipIds.forTraces : null
    };

    var radialAxis = subplot.radialAxis;
    var radialRange = radialAxis.range;
    var rFilter;

    if(radialRange[0] > radialRange[1]) {
        rFilter = function(v) { return v <= 0; };
    } else {
        rFilter = function(v) { return v >= 0; };
    }

    // map (r, theta) first to a 'geometric' r and then to (x,y)
    // on-par with what scatterPlot expects.

    for(i = 0; i < moduleCalcData.length; i++) {
        for(j = 0; j < moduleCalcData[i].length; j++) {
            var cdi = moduleCalcData[i][j];
            var r = cdi.r;

            if(r !== BADNUM) {
                // convert to 'r' data to fit with mocked polar x/y axis
                // which are always `type: 'linear'`
                var rr = radialAxis.c2r(r) - radialRange[0];
                if(rFilter(rr)) {
                    var rad = cdi.rad;
                    cdi.x = rr * Math.cos(rad);
                    cdi.y = rr * Math.sin(rad);
                    continue;
                } else {
                    // flag for scatter/line_points.js
                    // to extend line (and fills) into center
                    cdi.intoCenter = [subplot.cxx, subplot.cyy];
                }
            }

            cdi.x = BADNUM;
            cdi.y = BADNUM;
        }
    }

    var scatterLayer = subplot.layers.frontplot.select('g.scatterlayer');

    scatterPlot(gd, plotinfo, moduleCalcData, scatterLayer);
};
