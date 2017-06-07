/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Axes = require('../../plots/cartesian/axes');
var arraysToCalcdata = require('../scatter/arrays_to_calcdata');
var calcColorscales = require('../scatter/colorscale_calc');

module.exports = function calc(gd, trace) {
    var dragmode = gd._fullLayout.dragmode;
    var cd;

    if(dragmode === 'lasso' || dragmode === 'select') {
        var xa = Axes.getFromId(gd, trace.xaxis || 'x');
        var ya = Axes.getFromId(gd, trace.yaxis || 'y');

        var x = xa.makeCalcdata(trace, 'x');
        var y = ya.makeCalcdata(trace, 'y');

        var serieslen = Math.min(x.length, y.length), i;

        // create the "calculated data" to plot
        cd = new Array(serieslen);

        for(i = 0; i < serieslen; i++) {
            cd[i] = {x: x[i], y: y[i]};
        }
    } else {
        cd = [{x: false, y: false, trace: trace, t: {}}];
        arraysToCalcdata(cd, trace);
    }

    calcColorscales(trace);

    return cd;
};
