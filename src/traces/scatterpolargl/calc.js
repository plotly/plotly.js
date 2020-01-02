/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var calcColorscale = require('../scatter/colorscale_calc');
var calcMarkerSize = require('../scatter/calc').calcMarkerSize;
var convert = require('../scattergl/convert');
var Axes = require('../../plots/cartesian/axes');
var TOO_MANY_POINTS = require('../scattergl/constants').TOO_MANY_POINTS;

module.exports = function calc(gd, trace) {
    var fullLayout = gd._fullLayout;
    var subplotId = trace.subplot;
    var radialAxis = fullLayout[subplotId].radialaxis;
    var angularAxis = fullLayout[subplotId].angularaxis;
    var rArray = trace._r = radialAxis.makeCalcdata(trace, 'r');
    var thetaArray = trace._theta = angularAxis.makeCalcdata(trace, 'theta');
    var len = trace._length;
    var stash = {};

    if(len < rArray.length) rArray = rArray.slice(0, len);
    if(len < thetaArray.length) thetaArray = thetaArray.slice(0, len);

    stash.r = rArray;
    stash.theta = thetaArray;

    calcColorscale(gd, trace);

    // only compute 'style' options in calc, as position options
    // depend on the radial range and must be set in plot
    var opts = stash.opts = convert.style(gd, trace);

    // For graphs with very large number of points and array marker.size,
    // use average marker size instead to speed things up.
    var ppad;
    if(len < TOO_MANY_POINTS) {
        ppad = calcMarkerSize(trace, len);
    } else if(opts.marker) {
        ppad = 2 * (opts.marker.sizeAvg || Math.max(opts.marker.size, 3));
    }
    trace._extremes.x = Axes.findExtremes(radialAxis, rArray, {ppad: ppad});

    return [{x: false, y: false, t: stash, trace: trace}];
};
