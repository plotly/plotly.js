/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var layoutAttributes = require('./layout_attributes');


/**
 * options: inherits outerTicks from axes.handleAxisDefaults
 */
module.exports = function handleTickDefaults(containerIn, containerOut, coerce, options) {
    var tickLen = Lib.coerce2(containerIn, containerOut, layoutAttributes, 'ticklen'),
        tickWidth = Lib.coerce2(containerIn, containerOut, layoutAttributes, 'tickwidth'),
        tickColor = Lib.coerce2(containerIn, containerOut, layoutAttributes, 'tickcolor', containerOut.color),
        showTicks = coerce('ticks', (options.outerTicks || tickLen || tickWidth || tickColor) ? 'outside' : '');

    if(!showTicks) {
        delete containerOut.ticklen;
        delete containerOut.tickwidth;
        delete containerOut.tickcolor;
    }
};
