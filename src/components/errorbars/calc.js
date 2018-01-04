/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Registry = require('../../registry');
var Axes = require('../../plots/cartesian/axes');

var makeComputeError = require('./compute_error');


module.exports = function calc(gd) {
    var calcdata = gd.calcdata;

    for(var i = 0; i < calcdata.length; i++) {
        var calcTrace = calcdata[i],
            trace = calcTrace[0].trace;

        if(!Registry.traceIs(trace, 'errorBarsOK')) continue;

        var xa = Axes.getFromId(gd, trace.xaxis),
            ya = Axes.getFromId(gd, trace.yaxis);

        calcOneAxis(calcTrace, trace, xa, 'x');
        calcOneAxis(calcTrace, trace, ya, 'y');
    }
};

function calcOneAxis(calcTrace, trace, axis, coord) {
    var opts = trace['error_' + coord] || {},
        isVisible = (opts.visible && ['linear', 'log'].indexOf(axis.type) !== -1),
        vals = [];

    if(!isVisible) return;

    var computeError = makeComputeError(opts);

    for(var i = 0; i < calcTrace.length; i++) {
        var calcPt = calcTrace[i],
            calcCoord = calcPt[coord];

        if(!isNumeric(axis.c2l(calcCoord))) continue;

        var errors = computeError(calcCoord, i);
        if(isNumeric(errors[0]) && isNumeric(errors[1])) {
            var shoe = calcPt[coord + 's'] = calcCoord - errors[0],
                hat = calcPt[coord + 'h'] = calcCoord + errors[1];
            vals.push(shoe, hat);
        }
    }

    Axes.expand(axis, vals, {padded: true});
}
