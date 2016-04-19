/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var tinycolor = require('tinycolor2');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Color = require('../color');


module.exports = function makeScaleFunction(scl, cmin, cmax) {
    var N = scl.length,
        domain = new Array(N),
        range = new Array(N),
        si;

    for(var i = 0; i < N; i++) {
        si = scl[i];
        domain[i] = cmin + si[0] * (cmax - cmin);
        range[i] = tinycolor(si[1]).toRgb();
    }

    var sclFunc = d3.scale.linear()
        .domain(domain)
        .interpolate(d3.interpolateObject)
        .range(range);

    return function(v) {
        if(isNumeric(v)) {
            var sclVal = Lib.constrain(v, cmin, cmax),
                colorObj = sclFunc(sclVal);

            return tinycolor(colorObj).toRgbString();
        }
        else if(tinycolor(v).isValid()) return v;
        else return Color.defaultLine;
    };
};
