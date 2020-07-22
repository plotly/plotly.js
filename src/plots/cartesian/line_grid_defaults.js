/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorMix = require('tinycolor2').mix;
var lightFraction = require('../../components/color/attributes').lightFraction;
var Lib = require('../../lib');

/**
 * @param {object} opts :
 *   - dfltColor {string} : default axis color
 *   - bgColor {string} : combined subplot bg color
 *   - blend {number, optional} : blend percentage (to compute dflt grid color)
 *   - showLine {boolean} : show line by default
 *   - showGrid {boolean} : show grid by default
 *   - noZeroLine {boolean} : don't coerce zeroline* attributes
 *   - attributes {object} : attribute object associated with input containers
 */
module.exports = function handleLineGridDefaults(containerIn, containerOut, coerce, opts) {
    opts = opts || {};

    var dfltColor = opts.dfltColor;

    function coerce2(attr, dflt) {
        return Lib.coerce2(containerIn, containerOut, opts.attributes, attr, dflt);
    }

    function _coerce(attr, dflt) {
        var val = coerce2(attr, dflt);

        if(
            val && opts.hideGrid &&
            containerOut[attr] !== containerIn[attr] &&
            containerOut[attr] === containerOut._template[attr]
        ) return false;

        return val;
    }

    var lineColor = coerce2('linecolor', dfltColor);
    var lineWidth = coerce2('linewidth');
    var showLine = coerce('showline', opts.showLine || !!lineColor || !!lineWidth);

    if(!showLine) {
        delete containerOut.linecolor;
        delete containerOut.linewidth;
    }

    var gridColorDflt = colorMix(dfltColor, opts.bgColor, opts.blend || lightFraction).toRgbString();
    var gridColor = _coerce('gridcolor', gridColorDflt);
    var gridWidth = _coerce('gridwidth');
    var showGridLines = coerce('showgrid', opts.showGrid || !!gridColor || !!gridWidth);

    if(!showGridLines) {
        delete containerOut.gridcolor;
        delete containerOut.gridwidth;
    }

    if(!opts.noZeroLine) {
        var zeroLineColor = _coerce('zerolinecolor', dfltColor);
        var zeroLineWidth = _coerce('zerolinewidth');
        var showZeroLine = coerce('zeroline', opts.showGrid || !!zeroLineColor || !!zeroLineWidth);

        if(!showZeroLine) {
            delete containerOut.zerolinecolor;
            delete containerOut.zerolinewidth;
        }
    }
};
