'use strict';

var scatterPlot = require('../scatter/plot');
var BADNUM = require('../../constants/numerical').BADNUM;
var helpers = require('../../plots/smith/helpers');
var smith = helpers.smith;

module.exports = function plot(gd, subplot, moduleCalcData) {
    var mlayer = subplot.layers.frontplot.select('g.scatterlayer');

    var plotinfo = {
        xaxis: subplot.xaxis,
        yaxis: subplot.yaxis,
        plot: subplot.framework,
        layerClipId: subplot._hasClipOnAxisFalse ? subplot.clipIds.forTraces : null
    };

    // convert:
    // 'c' (real,imag) -> (x,y)
    for(var i = 0; i < moduleCalcData.length; i++) {
        var cdi = moduleCalcData[i];

        for(var j = 0; j < cdi.length; j++) {
            var cd = cdi[j];
            var real = cd.real;

            if(real === BADNUM) {
                cd.x = cd.y = BADNUM;
            } else {
                var t = smith([real, cd.imag]);

                cd.x = t[0];
                cd.y = t[1];
            }
        }
    }

    scatterPlot(gd, plotinfo, moduleCalcData, mlayer);
};
