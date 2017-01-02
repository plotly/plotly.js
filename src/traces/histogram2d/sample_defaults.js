/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Registry = require('../../registry');
var handleBinDefaults = require('../histogram/bin_defaults');


module.exports = function handleSampleDefaults(traceIn, traceOut, coerce, layout) {
    var x = coerce('x'),
        y = coerce('y');

    // we could try to accept x0 and dx, etc...
    // but that's a pretty weird use case.
    // for now require both x and y explicitly specified.
    if(!(x && x.length && y && y.length)) {
        traceOut.visible = false;
        return;
    }

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y'], layout);

    // if marker.color is an array, we can use it in aggregation instead of z
    var hasAggregationData = coerce('z') || coerce('marker.color');

    if(hasAggregationData) coerce('histfunc');

    var binDirections = ['x', 'y'];
    handleBinDefaults(traceIn, traceOut, coerce, binDirections);
};
