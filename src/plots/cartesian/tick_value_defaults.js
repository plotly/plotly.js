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


module.exports = function handleTickValueDefaults(containerIn, containerOut, coerce, axType) {
    var tickmodeDefault = 'auto';

    if(containerIn.tickmode === 'array' &&
            (axType === 'log' || axType === 'date')) {
        containerIn.tickmode = 'auto';
    }

    if(Array.isArray(containerIn.tickvals)) tickmodeDefault = 'array';
    else if(containerIn.dtick && isNumeric(containerIn.dtick)) {
        tickmodeDefault = 'linear';
    }
    var tickmode = coerce('tickmode', tickmodeDefault);

    if(tickmode === 'auto') coerce('nticks');
    else if(tickmode === 'linear') {
        var tick0 = coerce('tick0');
        coerce('dtick');

        // tick0 can have different valType for different axis types, so
        // validate that now. Also for dates, change milliseconds to date strings
        if(axType === 'date') {
            containerOut.tick0 = Lib.cleanDate(tick0, '2000-01-01');
        }
        else if(!isNumeric(tick0)) {
            containerOut.tick0 = 0;
        }
    }
    else {
        var tickvals = coerce('tickvals');
        if(tickvals === undefined) containerOut.tickmode = 'auto';
        else coerce('ticktext');
    }
};
