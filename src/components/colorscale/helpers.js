/**
* Copyright 2012-2019, Plotly, Inc.
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

var isValidScale = require('./scales').isValid;

function hasColorscale(trace, containerStr) {
    var container = containerStr ?
        Lib.nestedProperty(trace, containerStr).get() || {} :
        trace;
    var color = container.color;

    var isArrayWithOneNumber = false;
    if(Lib.isArrayOrTypedArray(color)) {
        for(var i = 0; i < color.length; i++) {
            if(isNumeric(color[i])) {
                isArrayWithOneNumber = true;
                break;
            }
        }
    }

    return (
        Lib.isPlainObject(container) && (
            isArrayWithOneNumber ||
            container.showscale === true ||
            (isNumeric(container.cmin) && isNumeric(container.cmax)) ||
            isValidScale(container.colorscale) ||
            Lib.isPlainObject(container.colorbar)
        )
    );
}

/**
 * Extract colorscale into numeric domain and color range.
 *
 * @param {object} cont colorscale container (e.g. trace, marker)
 *  - colorscale {array of arrays}
 *  - cmin/zmin {number}
 *  - cmax/zmax {number}
 *  - reversescale {boolean}
 * @param {object} opts
 *  - cLetter {string} 'c' (for cmin/cmax) or 'z' (for zmin/zmax)
 *
 * @return {object}
 *  - domain {array}
 *  - range {array}
 */
function extractScale(cont, opts) {
    var cLetter = opts.cLetter;

    var scl = cont.reversescale ?
        flipScale(cont.colorscale) :
        cont.colorscale;

    // minimum color value (used to clamp scale)
    var cmin = cont[cLetter + 'min'];
    // maximum color value (used to clamp scale)
    var cmax = cont[cLetter + 'max'];

    var N = scl.length;
    var domain = new Array(N);
    var range = new Array(N);

    for(var i = 0; i < N; i++) {
        var si = scl[i];
        domain[i] = cmin + si[0] * (cmax - cmin);
        range[i] = si[1];
    }

    return {
        domain: domain,
        range: range
    };
}

function flipScale(scl) {
    var N = scl.length;
    var sclNew = new Array(N);

    for(var i = N - 1, j = 0; i >= 0; i--, j++) {
        var si = scl[i];
        sclNew[j] = [1 - si[0], si[1]];
    }
    return sclNew;
}

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
function makeColorScaleFunc(specs, opts) {
    opts = opts || {};

    var domain = specs.domain;
    var range = specs.range;
    var N = range.length;
    var _range = new Array(N);

    for(var i = 0; i < N; i++) {
        var rgba = tinycolor(range[i]).toRgb();
        _range[i] = [rgba.r, rgba.g, rgba.b, rgba.a];
    }

    var _sclFunc = d3.scale.linear()
        .domain(domain)
        .range(_range)
        .clamp(true);

    var noNumericCheck = opts.noNumericCheck;
    var returnArray = opts.returnArray;
    var sclFunc;

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
}

function colorArray2rbga(colorArray) {
    var colorObj = {
        r: colorArray[0],
        g: colorArray[1],
        b: colorArray[2],
        a: colorArray[3]
    };

    return tinycolor(colorObj).toRgbString();
}

module.exports = {
    hasColorscale: hasColorscale,
    extractScale: extractScale,
    flipScale: flipScale,
    makeColorScaleFunc: makeColorScaleFunc
};
