/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

module.exports = function calc(gd, trace, opts) {
    var fullLayout = gd._fullLayout;
    var vals = opts.vals;
    var containerStr = opts.containerStr;
    var cLetter = opts.cLetter;

    var container = containerStr ?
        Lib.nestedProperty(trace, containerStr).get() :
        trace;

    var autoAttr = cLetter + 'auto';
    var minAttr = cLetter + 'min';
    var maxAttr = cLetter + 'max';
    var midAttr = cLetter + 'mid';
    var auto = container[autoAttr];
    var min = container[minAttr];
    var max = container[maxAttr];
    var mid = container[midAttr];
    var scl = container.colorscale;

    if(auto !== false || min === undefined) {
        min = Lib.aggNums(Math.min, null, vals);
    }

    if(auto !== false || max === undefined) {
        max = Lib.aggNums(Math.max, null, vals);
    }

    if(auto !== false && mid !== undefined) {
        if(max - mid > mid - min) {
            min = mid - (max - mid);
        }
        else if(max - mid < mid - min) {
            max = mid + (mid - min);
        }
    }

    if(min === max) {
        min -= 0.5;
        max += 0.5;
    }

    container['_' + minAttr] = container[minAttr] = min;
    container['_' + maxAttr] = container[maxAttr] = max;

    if(container.autocolorscale) {
        if(min * max < 0) scl = fullLayout.colorscale.diverging;
        else if(min >= 0) scl = fullLayout.colorscale.sequential;
        else scl = fullLayout.colorscale.sequentialminus;

        container._colorscale = container.colorscale = scl;
    }
};
