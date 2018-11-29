/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Registry = require('../../registry');

module.exports = function handleXYDefaults(traceIn, traceOut, layout, coerce) {
    var x = coerce('x');
    var y = coerce('y');
    var len, xlen;

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y'], layout);

    if(x) {
        xlen = Array.isArray(x[0]) ? Lib.maxRowLength(x) : x.length;
        if(y) {
            len = Math.min(xlen, y.length);
        }
        else {
            len = xlen;
            coerce('y0');
            coerce('dy');
        }
    }
    else {
        if(!y) return 0;

        len = traceOut.y.length;
        coerce('x0');
        coerce('dx');
    }

    traceOut._length = len;

    return len;
};
