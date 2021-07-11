'use strict';

var scatterPlot = require('../scatter/plot');
var BADNUM = require('../../constants/numerical').BADNUM;

function sq(x) {
    return x * x;
}

function gammaTransformReal(re, im) {
    var denom = sq(re + 1.0) + sq(im);
    var result = (sq(re) + sq(im) - 1.0) / denom;
    return result;
}

function gammaTransformImaginary(re, im) {
    var denom = sq(re + 1.0) + sq(im);
    var result = (2 * im) / denom;
    return result;
}

module.exports = function plot(gd, subplot, moduleCalcData) {
    var mlayer = subplot.layers.frontplot.select('g.scatterlayer');

    var plotinfo = {
        xaxis: subplot.xaxis,
        yaxis: subplot.yaxis,
        plot: subplot.framework,
        layerClipId: subplot._hasClipOnAxisFalse ? subplot.clipIds.forTraces : null
    };

    // convert:
    // 'c' (r,theta) -> 'geometric' (r,theta) -> (x,y)
    for(var i = 0; i < moduleCalcData.length; i++) {
        var cdi = moduleCalcData[i];

        for(var j = 0; j < cdi.length; j++) {
            var cd = cdi[j];
            var re = cd.re;
            var im = cd.im;

            if(re === BADNUM) {
                cd.x = cd.y = BADNUM;
            } else {
                cd.x = gammaTransformReal(re, im);
                cd.y = gammaTransformImaginary(re, im);
            }
        }
    }

    scatterPlot(gd, plotinfo, moduleCalcData, mlayer);
};
