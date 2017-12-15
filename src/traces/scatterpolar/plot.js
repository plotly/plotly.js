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
var BADNUM = require('../../constants/numerical').BADNUM;

module.exports = function plot(subplot, moduleCalcData) {
    var i, j;

    var plotinfo = {
        xaxis: subplot.xaxis,
        yaxis: subplot.yaxis,
        plot: subplot.framework,
        layerClipId: subplot.hasClipOnAxisFalse ? subplot.clipIds.circle : null
    };

    var radialRange = subplot.radialAxis.range;

    // map (r, theta) first to a 'geometric' r and then to (x,y)
    // on-par with what scatterPlot expects.

    for(i = 0; i < moduleCalcData.length; i++) {
        for(j = 0; j < moduleCalcData[i].length; j++) {
            var cdi = moduleCalcData[i][j];
            var r = cdi.r;

            if(r !== BADNUM) {
                var rr = r - radialRange[0];
                if(rr >= 0) {
                    var rad = cdi.rad;
                    cdi.x = rr * Math.cos(rad);
                    cdi.y = rr * Math.sin(rad);
                    continue;
                }
            }

            cdi.x = BADNUM;
            cdi.y = BADNUM;
        }
    }

    scatterPlot(subplot.graphDiv, plotinfo, moduleCalcData);

    var radius = subplot.radius;

    function pt2deg(p) {
        return Lib.rad2deg(Math.atan2(radius - p[1], p[0] - radius));
    }

    // TODO
    // fix polygon testers for segments that wrap around themselves
    // about the origin.
    for(i = 0; i < moduleCalcData.length; i++) {
        var trace = moduleCalcData[i][0].trace;

        if(Array.isArray(trace._polygons)) {
            for(j = 0; j < trace._polygons.length; j++) {
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
