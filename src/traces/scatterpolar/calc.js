/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');
var BADNUM = require('../../constants/numerical').BADNUM;

var Axes = require('../../plots/cartesian/axes');

var subTypes = require('../scatter/subtypes');
var calcColorscale = require('../scatter/colorscale_calc');
var arraysToCalcdata = require('../scatter/arrays_to_calcdata');
var calcSelection = require('../scatter/calc_selection');

module.exports = function calc(gd, trace) {
    var fullLayout = gd._fullLayout;
    var subplotId = trace.subplot;
    var radialAxis = fullLayout[subplotId].radialaxis;
    var angularAxis = fullLayout[subplotId].angularaxis;
    var rArray = radialAxis.makeCalcdata(trace, 'r');
    var thetaArray = angularAxis.makeCalcdata(trace, 'theta');
    var len = rArray.length;
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

    Axes.expand(radialAxis, rArray, {tozero: true});

    if(angularAxis.type !== 'linear') {
        angularAxis.autorange = true;
        Axes.expand(angularAxis, thetaArray);
    }

    // TODO Dry up with other scatter* traces!
    //
    // TODO needs to bump auto ranges !!!
    var marker, s;
    if(subTypes.hasMarkers(trace)) {
        // Treat size like x or y arrays --- Run d2c
        // this needs to go before ppad computation
        marker = trace.marker;
        s = marker.size;

        if(Array.isArray(s)) {
            var ax = {type: 'linear'};
            Axes.setConvert(ax);
            s = ax.makeCalcdata(trace.marker, 'size');
            if(s.length > len) s.splice(len, s.length - len);
        }
    }

    calcColorscale(trace);
    arraysToCalcdata(cd, trace);
    calcSelection(cd, trace);

    return cd;
};
