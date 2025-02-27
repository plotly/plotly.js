'use strict';

var scatterPlot = require('../scatter/plot');
var BADNUM = require('../../constants/numerical').BADNUM;

module.exports = function plot(gd, subplot, moduleCalcData) {
    var mlayer = subplot.layers.frontplot.select('g.scatterlayer');

    var xa = subplot.xaxis;
    var ya = subplot.yaxis;

    var plotinfo = {
        xaxis: xa,
        yaxis: ya,
        plot: subplot.framework,
        layerClipId: subplot._hasClipOnAxisFalse ? subplot.clipIds.forTraces : null
    };

    var radialAxis = subplot.radialAxis;
    var angularAxis = subplot.angularAxis;

    // convert:
    // 'c' (r,theta) -> 'geometric' (r,theta) -> (x,y)
    for(var i = 0; i < moduleCalcData.length; i++) {
        var cdi = moduleCalcData[i];

        for(var j = 0; j < cdi.length; j++) {
            if(j === 0) {
                cdi[0].trace._xA = xa;
                cdi[0].trace._yA = ya;
            }

            var cd = cdi[j];
            var r = cd.r;

            if(r === BADNUM) {
                cd.x = cd.y = BADNUM;
            } else {
                var rg = radialAxis.c2g(r);
                var thetag = angularAxis.c2g(cd.theta);
                cd.x = rg * Math.cos(thetag);
                cd.y = rg * Math.sin(thetag);
            }
        }
    }

    scatterPlot(gd, plotinfo, moduleCalcData, mlayer);
};
