/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Registry = require('../../registry');
var Color = require('../../components/color');
var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

var attributes = require('./attributes');

function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    handleSampleDefaults(traceIn, traceOut, coerce, layout);
    if(traceOut.visible === false) return;

    coerce('line.color', (traceIn.marker || {}).color || defaultColor);
    coerce('line.width');
    coerce('fillcolor', Color.addOpacity(traceOut.line.color, 0.5));

    coerce('whiskerwidth');
    coerce('boxmean');

    handlePointsDefaults(traceIn, traceOut, coerce, {prefix: 'box'});
}

function handleSampleDefaults(traceIn, traceOut, coerce, layout) {
    var y = coerce('y');
    var x = coerce('x');

    var defaultOrientation;

    if(y && y.length) {
        defaultOrientation = 'v';
        if(!x) coerce('x0');
    } else if(x && x.length) {
        defaultOrientation = 'h';
        coerce('y0');
    } else {
        traceOut.visible = false;
        return;
    }

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y'], layout);

    coerce('orientation', defaultOrientation);
}

function handlePointsDefaults(traceIn, traceOut, coerce, opts) {
    var prefix = opts.prefix;

    var outlierColorDflt = Lib.coerce2(traceIn, traceOut, attributes, 'marker.outliercolor');
    var lineoutliercolor = coerce('marker.line.outliercolor');

    var points = coerce(
        prefix + 'points',
        (outlierColorDflt || lineoutliercolor) ? 'suspectedoutliers' : undefined
    );

    if(points) {
        coerce('jitter', points === 'all' ? 0.3 : 0);
        coerce('pointpos', points === 'all' ? -1.5 : 0);

        coerce('marker.symbol');
        var mo = coerce('marker.opacity');
        coerce('marker.size');
        coerce('marker.color', traceOut.line.color);
        coerce('marker.line.color');
        coerce('marker.line.width');

        if(points === 'suspectedoutliers') {
            coerce('marker.line.outliercolor', traceOut.marker.color);
            coerce('marker.line.outlierwidth');
        }

        coerce('selected.marker.opacity', mo);
        coerce('unselected.marker.opacity', DESELECTDIM * mo);
        coerce('selected.marker.color');
        coerce('unselected.marker.color');

        coerce('text');
    } else {
        delete traceOut.marker;
    }

    coerce('hoveron');
}

module.exports = {
    supplyDefaults: supplyDefaults,
    handleSampleDefaults: handleSampleDefaults,
    handlePointsDefaults: handlePointsDefaults
};
