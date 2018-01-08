/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var tinycolor = require('tinycolor2');
var isNumeric = require('fast-isnumeric');

var Color = require('../color');

/**
 * General colorscale function generator.
 *
 * @param {object} specs output of Colorscale.extractScale or precomputed domain, range.
 *  - domain {array}
 *  - range {array}
 *
 * @param {object} opts
 *  - noNumericCheck {boolean} if true, scale func bypasses numeric checks
 *  - returnArray {boolean} if true, scale func return 4-item array instead of color strings
 *
 * @return {function}
 */
module.exports = function makeColorScaleFunc(specs, opts) {
    opts = opts || {};

    var domain = specs.domain,
        range = specs.range,
        N = range.length,
        _range = new Array(N);

    for(var i = 0; i < N; i++) {
        var rgba = tinycolor(range[i]).toRgb();
        _range[i] = [rgba.r, rgba.g, rgba.b, rgba.a];
    }

    var _sclFunc = d3.scale.linear()
        .domain(domain)
        .range(_range)
        .clamp(true);

    var noNumericCheck = opts.noNumericCheck,
        returnArray = opts.returnArray,
        sclFunc;

    if(noNumericCheck && returnArray) {
        sclFunc = _sclFunc;
    }
    else if(noNumericCheck) {
        sclFunc = function(v) {
            return colorArray2rbga(_sclFunc(v));
        };
    }
    else if(returnArray) {
        sclFunc = function(v) {
            if(isNumeric(v)) return _sclFunc(v);
            else if(tinycolor(v).isValid()) return v;
            else return Color.defaultLine;
        };
    }
    else {
        sclFunc = function(v) {
            if(isNumeric(v)) return colorArray2rbga(_sclFunc(v));
            else if(tinycolor(v).isValid()) return v;
            else return Color.defaultLine;
        };
    }

    // colorbar draw looks into the d3 scale closure for domain and range

    sclFunc.domain = _sclFunc.domain;

    sclFunc.range = function() { return range; };

    return sclFunc;
};

function colorArray2rbga(colorArray) {
    var colorObj = {
        r: colorArray[0],
        g: colorArray[1],
        b: colorArray[2],
        a: colorArray[3]
    };

    return tinycolor(colorObj).toRgbString();
}
