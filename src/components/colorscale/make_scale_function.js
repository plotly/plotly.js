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

var Color = require('../color');

/**
 * General colorscale function generator.
 *
 * By default, the routine compute that domain and range,
 * but optional can be called with pre-computed values.
 *
 * @param {array} scl
 *  plotly.js colorscale array of arrays as found in fullData
 * @param {number} cmin
 *  minimum color value (used to clamp scale)
 * @param {number} cmax
 *  maximum color value (used to clamp scale)
 * @param {object} opts [optional]
 *      - domain {array} precomputed domain
 *      - range {array} precomputed range
 *      - noNumericCheck {boolean} if true, scale func bypasses numeric checks
 *      - returnArray {boolean} if true, scale func return 4-item array instead of color strings
 *
 * @return {function}
 *
 */
module.exports = function makeScaleFunction(scl, cmin, cmax, opts) {
    opts = opts || {};

    var N = scl.length;

    var domain, rangeOrig, i;

    if(opts.domain && opts.range) {
        domain = opts.domain;
        rangeOrig = opts.range;
    }
    else {
        domain = new Array(N);
        rangeOrig = new Array(N);

        for(i = 0; i < N; i++) {
            var si = scl[i];

            domain[i] = cmin + si[0] * (cmax - cmin);
            rangeOrig[i] = si[1];
        }
    }

    var range = new Array(N);

    for(i = 0; i < N; i++) {
        var rgba = tinycolor(rangeOrig[i]).toRgb();

        range[i] = [ rgba.r, rgba.g, rgba.b, rgba.a ];
    }

    var _sclFunc = d3.scale.linear()
        .domain(domain)
        .range(range)
        .clamp(true);

    var sclFunc = function(v) {
        if(opts.noNumericCheck || isNumeric(v)) {
            var colorArray = _sclFunc(v);

            if(opts.returnArray) return colorArray;

            var colorObj = {
                r: colorArray[0],
                g: colorArray[1],
                b: colorArray[2],
                a: colorArray[3]
            };

            return tinycolor(colorObj).toRgbString();
        }
        else if(tinycolor(v).isValid()) return v;
        else return Color.defaultLine;
    };

    // colorbar draw looks into the d3 scale closure for domain and range

    sclFunc.domain = _sclFunc.domain;

    sclFunc.range = function() { return rangeOrig; };

    return sclFunc;
};
