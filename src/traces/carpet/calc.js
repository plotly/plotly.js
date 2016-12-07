/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

var Registry = require('../../registry');
var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var cheaterBasis = require('./cheater_basis');


module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x'),
        ya = Axes.getFromId(gd, trace.yaxis || 'y');

    var xdata;

    if(trace._cheater) {
        xdata = cheaterBasis(trace.a.length, trace.b.length, trace.cheaterslope);
    } else {
        xdata = trace.x;
    }

    var cd0 = {
        x: xdata,
        y: trace.y,
        a: trace.a,
        b: trace.b
    };

    return [cd0];
};
