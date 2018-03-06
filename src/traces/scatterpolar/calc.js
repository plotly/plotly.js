/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


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
    var radialAxis = fullLayout[subplotId].radialaxis;
    var angularAxis = fullLayout[subplotId].angularaxis;
    var rArray = radialAxis.makeCalcdata(trace, 'r');
    var thetaArray = angularAxis.makeCalcdata(trace, 'theta');
    var len = trace._length;
    var cd = new Array(len);

    function c2rad(v) {
        return angularAxis.c2rad(v, trace.thetaunit);
    }

    for(var i = 0; i < len; i++) {
        var r = rArray[i];
        var theta = thetaArray[i];
        var cdi = cd[i] = {};

        if(isNumeric(r) && isNumeric(theta)) {
            cdi.r = r;
            cdi.theta = theta;
            cdi.rad = c2rad(theta);
        } else {
            cdi.r = BADNUM;
        }
    }

    var ppad = calcMarkerSize(trace, len);
    Axes.expand(radialAxis, rArray, {ppad: ppad});

    calcColorscale(trace);
    arraysToCalcdata(cd, trace);
    calcSelection(cd, trace);

    return cd;
};
