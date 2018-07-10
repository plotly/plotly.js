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
var ONEDAY = require('../../constants/numerical').ONEDAY;


module.exports = function handleTickValueDefaults(containerIn, containerOut, coerce, axType) {
    var tickmode;

    if(containerIn.tickmode === 'array' &&
            (axType === 'log' || axType === 'date')) {
        tickmode = containerOut.tickmode = 'auto';
    }
    else {
        var tickmodeDefault =
            Array.isArray(containerIn.tickvals) ? 'array' :
            containerIn.dtick ? 'linear' :
            'auto';
        tickmode = coerce('tickmode', tickmodeDefault);
    }

    if(tickmode === 'auto') coerce('nticks');
    else if(tickmode === 'linear') {
        // dtick is usually a positive number, but there are some
        // special strings available for log or date axes
        // default is 1 day for dates, otherwise 1
        var dtickDflt = (axType === 'date') ? ONEDAY : 1;
        var dtick = coerce('dtick', dtickDflt);
        if(isNumeric(dtick)) {
            containerOut.dtick = (dtick > 0) ? Number(dtick) : dtickDflt;
        }
        else if(typeof dtick !== 'string') {
            containerOut.dtick = dtickDflt;
        }
        else {
            // date and log special cases are all one character plus a number
            var prefix = dtick.charAt(0),
                dtickNum = dtick.substr(1);

            dtickNum = isNumeric(dtickNum) ? Number(dtickNum) : 0;
            if((dtickNum <= 0) || !(
                    // "M<n>" gives ticks every (integer) n months
                    (axType === 'date' && prefix === 'M' && dtickNum === Math.round(dtickNum)) ||
                    // "L<f>" gives ticks linearly spaced in data (not in position) every (float) f
                    (axType === 'log' && prefix === 'L') ||
                    // "D1" gives powers of 10 with all small digits between, "D2" gives only 2 and 5
                    (axType === 'log' && prefix === 'D' && (dtickNum === 1 || dtickNum === 2))
                )) {
                containerOut.dtick = dtickDflt;
            }
        }

        // tick0 can have different valType for different axis types, so
        // validate that now. Also for dates, change milliseconds to date strings
        var tick0Dflt = (axType === 'date') ? Lib.dateTick0(containerOut.calendar) : 0;
        var tick0 = coerce('tick0', tick0Dflt);
        if(axType === 'date') {
            containerOut.tick0 = Lib.cleanDate(tick0, tick0Dflt);
        }
        // Aside from date axes, dtick must be numeric; D1 and D2 modes ignore tick0 entirely
        else if(isNumeric(tick0) && dtick !== 'D1' && dtick !== 'D2') {
            containerOut.tick0 = Number(tick0);
        }
        else {
            containerOut.tick0 = tick0Dflt;
        }
    }
    else {
        var tickvals = coerce('tickvals');
        if(tickvals === undefined) containerOut.tickmode = 'auto';
        else coerce('ticktext');
    }
};
