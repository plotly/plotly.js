'use strict';

var isNumeric = require('fast-isnumeric');
var BADNUM = require('../../constants/numerical').BADNUM;

var Axes = require('../../plots/cartesian/axes');

var calcColorscale = require('../scatter/colorscale_calc');
var arraysToCalcdata = require('../scatter/arrays_to_calcdata');
var calcSelection = require('../scatter/calc_selection');
var calcMarkerSize = require('../scatter/calc').calcMarkerSize;

module.exports = function calc(gd, trace) {
    var fullLayout = gd._fullLayout;
    var subplotId = trace.subplot;
    var radialAxis = fullLayout[subplotId].realaxis;
    var angularAxis = fullLayout[subplotId].imaginaryaxis;
    var reArray = radialAxis.makeCalcdata(trace, 're');
    var imArray = angularAxis.makeCalcdata(trace, 'im');
    var len = trace._length;
    var cd = new Array(len);

    for(var i = 0; i < len; i++) {
        var re = reArray[i];
        var im = imArray[i];
        var cdi = cd[i] = {};

        if(isNumeric(re) && isNumeric(im)) {
            cdi.re = re;
            cdi.im = im;
        } else {
            cdi.re = BADNUM;
        }
    }

    var ppad = calcMarkerSize(trace, len);
    trace._extremes.x = Axes.findExtremes(radialAxis, reArray, {ppad: ppad});

    calcColorscale(gd, trace);
    arraysToCalcdata(cd, trace);
    calcSelection(cd, trace);

    return cd;
};
