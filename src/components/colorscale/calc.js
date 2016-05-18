/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var scales = require('./scales');
var flipScale = require('./flip_scale');


module.exports = function calc(trace, vals, containerStr, cLetter) {
    var container, inputContainer;

    if(containerStr) {
        container = Lib.nestedProperty(trace, containerStr).get();
        inputContainer = Lib.nestedProperty(trace._input, containerStr).get();
    } else {
        container = trace;
        inputContainer = trace._input;
    }

    var auto = container[cLetter + 'auto'],
        min = container[cLetter + 'min'],
        max = container[cLetter + 'max'],
        scl = container.colorscale;

    if(auto !== false || min === undefined) {
        min = Lib.aggNums(Math.min, null, vals);
    }

    if(auto !== false || max === undefined) {
        max = Lib.aggNums(Math.max, null, vals);
    }

    if(min === max) {
        min -= 0.5;
        max += 0.5;
    }

    container[cLetter + 'min'] = min;
    container[cLetter + 'max'] = max;

    inputContainer[cLetter + 'min'] = min;
    inputContainer[cLetter + 'max'] = max;

    if(container.autocolorscale) {
        if(min * max < 0) scl = scales.RdBu;
        else if(min >= 0) scl = scales.Reds;
        else scl = scales.Blues;

        // reversescale is handled at the containerOut level
        inputContainer.colorscale = scl;
        if(container.reversescale) scl = flipScale(scl);
        container.colorscale = scl;
    }
};
