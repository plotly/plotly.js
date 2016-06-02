/**
* Copyright 2012-2016, Plotly, Inc.
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
            trace,
        color = container.color,
        isArrayWithOneNumber = false;

    if(Array.isArray(color)) {
        for(var i = 0; i < color.length; i++) {
            if(isNumeric(color[i])) {
                isArrayWithOneNumber = true;
                break;
            }
        }
    }

    return (
        (typeof container === 'object' && container !== null) && (
            isArrayWithOneNumber ||
            container.showscale === true ||
            (isNumeric(container.cmin) && isNumeric(container.cmax)) ||
            isValidScale(container.colorscale) ||
            (typeof container.colorbar === 'object' && container.colorbar !== null)
        )
    );
};
