/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var dateTick0 = require('../../lib').dateTick0;
var numConstants = require('../../constants/numerical');
var ONEWEEK = numConstants.ONEWEEK;

function getPeriod0Dflt(period, calendar) {
    if(period % ONEWEEK === 0) {
        return dateTick0(calendar, 1); // Sunday
    }
    return dateTick0(calendar, 0);
}

module.exports = function handlePeriodDefaults(traceIn, traceOut, layout, coerce, opts) {
    if(!opts) {
        opts = {
            x: true,
            y: true
        };
    }

    if(opts.x) {
        var xperiod = coerce('xperiod');
        if(xperiod) {
            coerce('xperiod0', getPeriod0Dflt(xperiod, traceOut.xcalendar));
            coerce('xperiodalignment');
        }
    }

    if(opts.y) {
        var yperiod = coerce('yperiod');
        if(yperiod) {
            coerce('yperiod0', getPeriod0Dflt(yperiod, traceOut.ycalendar));
            coerce('yperiodalignment');
        }
    }
};
