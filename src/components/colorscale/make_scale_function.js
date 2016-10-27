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
 * Can be called in two forms:
 *
 *  (1) makeScaleFunction(scl, { cmin: 0, cmax: 20 })
 *    where cmin and cmax are used to compute the scale domain and range.
 *
 *  (2) makeScaleFunction(scl, { domain: [0, 1, 3], range: [ 'red', 'green', 'blue'] })
 *    where domain and range are the precomputed values.
 *
 * @param {array} scl
 *  plotly.js colorscale array of arrays as found in fullData
 *
 * @param {object} opts
 *  - cmin {number} minimum color value (used to clamp scale)
 *  - cmax {number} maximum color value (used to clamp scale)
 *  - domain {array} precomputed domain
 *  - range {array} precomputed range
 *  - noNumericCheck {boolean} if true, scale func bypasses numeric checks
 *  - returnArray {boolean} if true, scale func return 4-item array instead of color strings
 *
 * @return {function}
 */
module.exports = function makeScaleFunction(scl, opts) {
    opts = opts || {};

    var N = scl.length;

    var domain, rangeOrig, i;

    if(opts.domain && opts.range) {
        domain = opts.domain;
        rangeOrig = opts.range;
    }
    else {
        var cmin = opts.cmin,
            cmax = opts.cmax;

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

        range[i] = [rgba.r, rgba.g, rgba.b, rgba.a];
    }

    var _sclFunc = d3.scale.linear()
        .domain(domain)
        .range(range)
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

    sclFunc.range = function() { return rangeOrig; };

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
