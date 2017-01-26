/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');
var Color = require('../../components/color');

var handleBinDefaults = require('./bin_defaults');
var handleStyleDefaults = require('../bar/style_defaults');
var errorBarsSupplyDefaults = require('../../components/errorbars/defaults');
var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var x = coerce('x'),
        y = coerce('y');

    var cumulative = coerce('cumulative.enabled');
    if(cumulative) {
        coerce('cumulative.direction');
        coerce('cumulative.currentbin');
    }

    coerce('text');

    var orientation = coerce('orientation', (y && !x) ? 'h' : 'v'),
        sample = traceOut[orientation === 'v' ? 'x' : 'y'];

    if(!(sample && sample.length)) {
        traceOut.visible = false;
        return;
    }

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y'], layout);

    var hasAggregationData = traceOut[orientation === 'h' ? 'x' : 'y'];
    if(hasAggregationData) coerce('histfunc');

    var binDirections = (orientation === 'h') ? ['y'] : ['x'];
    handleBinDefaults(traceIn, traceOut, coerce, binDirections);

    handleStyleDefaults(traceIn, traceOut, coerce, defaultColor, layout);

    // override defaultColor for error bars with defaultLine
    errorBarsSupplyDefaults(traceIn, traceOut, Color.defaultLine, {axis: 'y'});
    errorBarsSupplyDefaults(traceIn, traceOut, Color.defaultLine, {axis: 'x', inherit: 'y'});
};
