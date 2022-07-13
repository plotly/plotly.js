'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');

module.exports = function handleOHLC(traceIn, traceOut, coerce, layout) {
    var x = coerce('x');
    var open = coerce('open');
    var high = coerce('high');
    var low = coerce('low');
    var close = coerce('close');

    coerce('hoverlabel.split');

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x'], layout);

    if(!(open && high && low && close)) return;

    var len = Math.min(open.length, high.length, low.length, close.length);
    if(x) len = Math.min(len, Lib.minRowLength(x));
    traceOut._length = len;

    return len;
};
