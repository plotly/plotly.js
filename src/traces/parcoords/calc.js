/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var hasColorscale = require('../../components/colorscale/helpers').hasColorscale;
var calcColorscale = require('../../components/colorscale/calc');
var Lib = require('../../lib');
var wrap = require('../../lib/gup').wrap;

module.exports = function calc(gd, trace) {
    for(var i = 0; i < trace.dimensions.length; i++) {
        trace.dimensions[i].values = convertTypedArray(trace.dimensions[i].values);
    }
    trace.line.color = convertTypedArray(trace.line.color);

    var cs = !!trace.line.colorscale && Array.isArray(trace.line.color);
    var color = cs ? trace.line.color : constHalf(trace._length);
    var cscale = cs ? trace.line.colorscale : [[0, trace.line.color], [1, trace.line.color]];

    if(hasColorscale(trace, 'line')) {
        calcColorscale(gd, trace, {
            vals: color,
            containerStr: 'line',
            cLetter: 'c'
        });
    }

    return wrap({
        lineColor: color,
        cscale: cscale
    });
};

function constHalf(len) {
    var out = new Array(len);
    for(var i = 0; i < len; i++) {
        out[i] = 0.5;
    }
    return out;
}

function convertTypedArray(a) {
    return (Lib.isTypedArray(a)) ? Array.prototype.slice.call(a) : a;
}
