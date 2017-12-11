/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var scatterPlot = require('../scatter/plot');

module.exports = function plot(subplot, moduleCalcData) {
    var xa = subplot.xaxis;
    var ya = subplot.yaxis;
    var radius = subplot.radius;

    var plotinfo = {
        xaxis: xa,
        yaxis: ya,
        plot: subplot.framework,
        layerClipId: subplot.hasClipOnAxisFalse ? subplot.clipIds.circle : null
    };

    scatterPlot(subplot.graphDiv, plotinfo, moduleCalcData);

    function pt2deg(p) {
        return Lib.rad2deg(Math.atan2(radius - p[1], p[0] - radius));
    }

    // TODO
    // fix polygon testers for segments that wrap around themselves
    // about the origin.
    for(var i = 0; i < moduleCalcData.length; i++) {
        var trace = moduleCalcData[i][0].trace;

        if(Array.isArray(trace._polygons)) {
            for(var j = 0; j < trace._polygons.length; j++) {
                var pts = trace._polygons[j].pts.slice();
                pts.pop();

                var a0 = pt2deg(pts[0]);
                for(var k = 1; k < pts.length; k++) {
                    var a1 = pt2deg(pts[k]);
                    var arc = Math.abs(a1 - a0);
                    var arcWrapped = Math.abs(Lib.wrap360(a1) - Lib.wrap360(a0));

                    if(arc !== arcWrapped) {
                        // pts.push(radius, radius);
                    }

                    a0 = a1;
                }
            }
        }
    }
};
