/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var Lib = require('../../lib');
var isValidScale = require('./is_valid_scale');

module.exports = function hasColorscale(trace, containerStr) {
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
};
