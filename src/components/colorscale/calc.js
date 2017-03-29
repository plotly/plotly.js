/**
* Copyright 2012-2017, Plotly, Inc.
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
    }
    else {
        container = trace;
        inputContainer = trace._input;
    }

    var autoAttr = cLetter + 'auto',
        minAttr = cLetter + 'min',
        maxAttr = cLetter + 'max',
        auto = container[autoAttr],
        min = container[minAttr],
        max = container[maxAttr],
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

    container[minAttr] = min;
    container[maxAttr] = max;

    inputContainer[minAttr] = min;
    inputContainer[maxAttr] = max;

    /*
     * If auto was explicitly false but min or max was missing,
     * we filled in the missing piece here but later the trace does
     * not look auto.
     * Otherwise make sure the trace still looks auto as far as later
     * changes are concerned.
     */
    inputContainer[autoAttr] = (auto !== false ||
        (min === undefined && max === undefined));

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
