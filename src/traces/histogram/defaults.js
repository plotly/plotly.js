/**
* Copyright 2012-2018, Plotly, Inc.
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
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var x = coerce('x');
    var y = coerce('y');

    var cumulative = coerce('cumulative.enabled');
    if(cumulative) {
        coerce('cumulative.direction');
        coerce('cumulative.currentbin');
    }

    coerce('text');

    var orientation = coerce('orientation', (y && !x) ? 'h' : 'v');
    var sampleLetter = orientation === 'v' ? 'x' : 'y';
    var aggLetter = orientation === 'v' ? 'y' : 'x';

    var len = (x && y) ? Math.min(x.length && y.length) : (traceOut[sampleLetter] || []).length;

    if(!len) {
        traceOut.visible = false;
        return;
    }

    traceOut._length = len;

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y'], layout);

    var hasAggregationData = traceOut[aggLetter];
    if(hasAggregationData) coerce('histfunc');

    handleBinDefaults(traceIn, traceOut, coerce, [sampleLetter]);

    handleStyleDefaults(traceIn, traceOut, coerce, defaultColor, layout);

    // override defaultColor for error bars with defaultLine
    var errorBarsSupplyDefaults = Registry.getComponentMethod('errorbars', 'supplyDefaults');
    errorBarsSupplyDefaults(traceIn, traceOut, Color.defaultLine, {axis: 'y'});
    errorBarsSupplyDefaults(traceIn, traceOut, Color.defaultLine, {axis: 'x', inherit: 'y'});

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};
