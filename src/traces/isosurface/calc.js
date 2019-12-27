/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorscaleCalc = require('../../components/colorscale/calc');
var processGrid = require('../streamtube/calc').processGrid;
var filter = require('../streamtube/calc').filter;

module.exports = function calc(gd, trace) {
    trace._len = Math.min(
        trace.x.length,
        trace.y.length,
        trace.z.length,
        trace.value.length
    );

    ['value', 'x', 'y', 'z'].forEach(function(e) {
        trace['_' + e] = filter(trace[e], trace._len);
    });

    var grid = processGrid(trace);
    trace._gridFill = grid.fill;
    trace._Xs = grid.Xs;
    trace._Ys = grid.Ys;
    trace._Zs = grid.Zs;
    trace._len = grid.len;

    var min = Infinity;
    var max = -Infinity;
    for(var i = 0; i < trace._len; i++) {
        var v = trace._value[i];
        min = Math.min(min, v);
        max = Math.max(max, v);
    }

    trace._minValues = min;
    trace._maxValues = max;
    trace._vMin = (trace.isomin === undefined || trace.isomin === null) ? min : trace.isomin;
    trace._vMax = (trace.isomax === undefined || trace.isomin === null) ? max : trace.isomax;

    colorscaleCalc(gd, trace, {
        vals: [trace._vMin, trace._vMax],
        containerStr: '',
        cLetter: 'c'
    });
};
