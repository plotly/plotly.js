/**
* Copyright 2012-2018, Plotly, Inc.
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
    var container = trace;
    var inputContainer = trace._input;
    var fullInputContainer = trace._fullInput;

    // set by traces with groupby transforms
    var updateStyle = trace.updateStyle;

    function doUpdate(attr, inputVal, fullVal) {
        if(fullVal === undefined) fullVal = inputVal;

        if(updateStyle) {
            updateStyle(trace._input, containerStr ? (containerStr + '.' + attr) : attr, inputVal);
        }
        else {
            inputContainer[attr] = inputVal;
        }

        container[attr] = fullVal;
        if(fullInputContainer && (trace !== trace._fullInput)) {
            if(updateStyle) {
                updateStyle(trace._fullInput, containerStr ? (containerStr + '.' + attr) : attr, fullVal);
            }
            else {
                fullInputContainer[attr] = fullVal;
            }
        }
    }

    if(containerStr) {
        container = Lib.nestedProperty(container, containerStr).get();
        inputContainer = Lib.nestedProperty(inputContainer, containerStr).get();
        fullInputContainer = Lib.nestedProperty(fullInputContainer, containerStr).get() || {};
    }

    var autoAttr = cLetter + 'auto';
    var minAttr = cLetter + 'min';
    var maxAttr = cLetter + 'max';
    var auto = container[autoAttr];
    var min = container[minAttr];
    var max = container[maxAttr];
    var scl = container.colorscale;

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

    doUpdate(minAttr, min);
    doUpdate(maxAttr, max);

    /*
     * If auto was explicitly false but min or max was missing,
     * we filled in the missing piece here but later the trace does
     * not look auto.
     * Otherwise make sure the trace still looks auto as far as later
     * changes are concerned.
     */
    doUpdate(autoAttr, (auto !== false || (min === undefined && max === undefined)));

    if(container.autocolorscale) {
        if(min * max < 0) scl = scales.RdBu;
        else if(min >= 0) scl = scales.Reds;
        else scl = scales.Blues;

        // reversescale is handled at the containerOut level
        doUpdate('colorscale', scl, container.reversescale ? flipScale(scl) : scl);

        // We pushed a colorscale back to input, which will change the default autocolorscale next time
        // to avoid spurious redraws from Plotly.react, update resulting autocolorscale now
        // This is a conscious decision so that changing the data later does not unexpectedly
        // give you a new colorscale
        if(!inputContainer.autocolorscale) {
            doUpdate('autocolorscale', false);
        }
    }
};
