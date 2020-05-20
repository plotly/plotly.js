/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var cleanTicks = require('./clean_ticks');
var isArrayOrTypedArray = require('../../lib').isArrayOrTypedArray;

module.exports = function handleTickValueDefaults(containerIn, containerOut, coerce, axType) {
    function readInput(attr) {
        var v = containerIn[attr];
        return (
            v !== undefined
        ) ? v : (containerOut._template || {})[attr];
    }

    var _tick0 = readInput('tick0');
    var _dtick = readInput('dtick');
    var _tickvals = readInput('tickvals');

    var tickmodeDefault = isArrayOrTypedArray(_tickvals) ? 'array' :
        _dtick ? 'linear' :
        'auto';
    var tickmode = coerce('tickmode', tickmodeDefault);

    if(tickmode === 'auto') coerce('nticks');
    else if(tickmode === 'linear') {
        // dtick is usually a positive number, but there are some
        // special strings available for log or date axes
        // tick0 also has special logic
        var dtick = containerOut.dtick = cleanTicks.dtick(
            _dtick, axType);
        containerOut.tick0 = cleanTicks.tick0(
            _tick0, axType, containerOut.calendar, dtick);
    } else if(axType !== 'multicategory') {
        var tickvals = coerce('tickvals');
        if(tickvals === undefined) containerOut.tickmode = 'auto';
        else coerce('ticktext');
    }
};
