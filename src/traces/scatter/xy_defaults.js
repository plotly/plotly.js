/**
* Copyright 2012-2020, Plotly, Inc.
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
    var len;

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y'], layout);

    var shapeX = x && x.shape ? x.shape[0] : 0;
    var shapeY = y && y.shape ? y.shape[0] : 0;

    if(x) {
        var xlen = shapeX || Lib.minRowLength(x);
        if(y) {
            len = shapeY || Math.min(xlen, Lib.minRowLength(y));
        } else {
            len = shapeX || xlen;
            coerce('y0');
            coerce('dy');
        }
    } else {
        if(!y) return 0;

        len = shapeY || Lib.minRowLength(y);
        coerce('x0');
        coerce('dx');
    }

    traceOut._length = len;

    return len;
};
