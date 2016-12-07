/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Registry = require('../../registry');


module.exports = function handleOHLC(traceIn, traceOut, coerce, layout) {
    var len;

    var x = coerce('x'),
        open = coerce('open'),
        high = coerce('high'),
        low = coerce('low'),
        close = coerce('close');

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x'], layout);

    len = Math.min(open.length, high.length, low.length, close.length);

    if(x) {
        len = Math.min(len, x.length);
        if(len < x.length) traceOut.x = x.slice(0, len);
    }

    if(len < open.length) traceOut.open = open.slice(0, len);
    if(len < high.length) traceOut.high = high.slice(0, len);
    if(len < low.length) traceOut.low = low.slice(0, len);
    if(len < close.length) traceOut.close = close.slice(0, len);

    return len;
};
