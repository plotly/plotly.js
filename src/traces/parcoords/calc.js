/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var hasColorscale = require('../../components/colorscale/has_colorscale');
var calcColorscale = require('../../components/colorscale/calc');
var Lib = require('../../lib');
var wrap = require('../../lib/gup').wrap;

module.exports = function calc(gd, trace) {
    var cs = !!trace.line.colorscale && Lib.isArray(trace.line.color);
    var color = cs ? trace.line.color : Array.apply(0, Array(trace.dimensions.reduce(function(p, n) {return Math.max(p, n.values.length);}, 0))).map(function() {return 0.5;});
    var cscale = cs ? trace.line.colorscale : [[0, trace.line.color], [1, trace.line.color]];

    if(hasColorscale(trace, 'line')) {
        calcColorscale(trace, trace.line.color, 'line', 'c');
    }

    return wrap({
        lineColor: color,
        cscale: cscale
    });
};
