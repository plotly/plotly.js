'use strict';

var isNumeric = require('fast-isnumeric');
var BADNUM = require('../../constants/numerical').BADNUM;

var calcColorscale = require('../scatter/colorscale_calc');
var arraysToCalcdata = require('../scatter/arrays_to_calcdata');
var calcSelection = require('../scatter/calc_selection');
var calcMarkerSize = require('../scatter/calc').calcMarkerSize;

module.exports = function calc(gd, trace) {
    var fullLayout = gd._fullLayout;
    var subplotId = trace.subplot;
    var realAxis = fullLayout[subplotId].realaxis;
    var imaginaryAxis = fullLayout[subplotId].imaginaryaxis;
    var realArray = realAxis.makeCalcdata(trace, 'real');
    var imagArray = imaginaryAxis.makeCalcdata(trace, 'imag');
    var len = trace._length;
    var cd = new Array(len);

    for(var i = 0; i < len; i++) {
        var real = realArray[i];
        var imag = imagArray[i];
        var cdi = cd[i] = {};

        if(isNumeric(real) && isNumeric(imag)) {
            cdi.real = real;
            cdi.imag = imag;
        } else {
            cdi.real = BADNUM;
        }
    }

    calcMarkerSize(trace, len);
    calcColorscale(gd, trace);
    arraysToCalcdata(cd, trace);
    calcSelection(cd, trace);

    return cd;
};
