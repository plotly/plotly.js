/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var helpers = require('./helpers');
var Axes = require('../../plots/cartesian/axes');
var axisIds = require('../../plots/cartesian/axis_ids');

exports.moduleType = 'transform';

exports.name = 'ohlc';

exports.attributes = {};

exports.supplyDefaults = function(transformIn, traceOut, layout, traceIn) {
    helpers.clearEphemeralTransformOpts(traceIn);
    helpers.copyOHLC(transformIn, traceOut);

    return transformIn;
};

exports.transform = function transform(dataIn, state) {
    var dataOut = [];

    for(var i = 0; i < dataIn.length; i++) {
        var traceIn = dataIn[i];

        if(traceIn.type !== 'ohlc') {
            dataOut.push(traceIn);
            continue;
        }

        dataOut.push(
            makeTrace(traceIn, state, 'increasing'),
            makeTrace(traceIn, state, 'decreasing')
        );
    }

    helpers.addRangeSlider(state.layout);

    return dataOut;
};

function makeTrace(traceIn, state, direction) {
    var traceOut = {
        type: 'scatter',
        mode: 'lines',
        connectgaps: false,

        visible: traceIn.visible,
        opacity: traceIn.opacity,
        xaxis: traceIn.xaxis,
        yaxis: traceIn.yaxis,

        hoverinfo: makeHoverInfo(traceIn),
        transforms: helpers.makeTransform(traceIn, state, direction)
    };

    // the rest of below may not have been coerced

    var directionOpts = traceIn[direction];

    if(directionOpts) {
        Lib.extendFlat(traceOut, {

            // to make autotype catch date axes soon!!
            x: traceIn.x || [0],

            // concat low and high to get correct autorange
            y: [].concat(traceIn.low).concat(traceIn.high),

            text: traceIn.text,

            name: directionOpts.name,
            showlegend: directionOpts.showlegend,
            line: directionOpts.line
        });
    }

    return traceOut;
}

// Let scatter hoverPoint format 'x' coordinates, if desired.
//
// Note that, this solution isn't perfect: it shows open and close
// values at slightly different 'x' coordinates then the rest of the
// segments, but is for more robust than calling `Axes.tickText` during
// calcTransform.
//
// A future iteration should perhaps try to add a hook for transforms in
// the hoverPoints handlers.
function makeHoverInfo(traceIn) {
    var hoverinfo = traceIn.hoverinfo;

    if(hoverinfo === 'all') return 'x+text+name';

    var parts = hoverinfo.split('+'),
        indexOfY = parts.indexOf('y'),
        indexOfText = parts.indexOf('text');

    if(indexOfY !== -1) {
        parts.splice(indexOfY, 1);

        if(indexOfText === -1) parts.push('text');
    }

    return parts.join('+');
}

exports.calcTransform = function calcTransform(gd, trace, opts) {
    var direction = opts.direction,
        filterFn = helpers.getFilterFn(direction);

    var xa = axisIds.getFromTrace(gd, trace, 'x'),
        ya = axisIds.getFromTrace(gd, trace, 'y'),
        tickWidth = convertTickWidth(trace.x, xa, trace._fullInput.tickwidth);

    var open = trace.open,
        high = trace.high,
        low = trace.low,
        close = trace.close,
        textIn = trace.text;

    var len = open.length,
        x = [],
        y = [],
        textOut = [];

    var getXItem = trace._fullInput.x ?
        function(i) { return xa.d2c(trace.x[i]); } :
        function(i) { return i; };

    var getTextItem = Array.isArray(textIn) ?
        function(i) { return textIn[i] || ''; } :
        function() { return textIn; };

    var appendX = function(i) {
        var v = getXItem(i);
        x.push(v - tickWidth, v, v, v, v, v + tickWidth, null);
    };

    var appendY = function(o, h, l, c) {
        y.push(o, o, h, l, c, c, null);
    };

    var format = function(ax, val) {
        return Axes.tickText(ax, ax.c2l(val), 'hover').text;
    };

    var hoverinfo = trace._fullInput.hoverinfo,
        hoverParts = hoverinfo.split('+'),
        hasAll = hoverinfo === 'all',
        hasY = hasAll || hoverParts.indexOf('y') !== -1,
        hasText = hasAll || hoverParts.indexOf('text') !== -1;

    var appendText = function(i, o, h, l, c) {
        var t = [];

        if(hasY) {
            t.push('Open: ' + format(ya, o));
            t.push('High: ' + format(ya, h));
            t.push('Low: ' + format(ya, l));
            t.push('Close: ' + format(ya, c));
        }

        if(hasText) t.push(getTextItem(i));

        var _t = t.join('<br>');

        textOut.push(_t, _t, _t, _t, _t, _t, null);
    };

    for(var i = 0; i < len; i++) {
        if(filterFn(open[i], close[i])) {
            appendX(i);
            appendY(open[i], high[i], low[i], close[i]);
            appendText(i, open[i], high[i], low[i], close[i]);
        }
    }

    trace.x = x;
    trace.y = y;
    trace.text = textOut;
};

function convertTickWidth(coords, ax, tickWidth) {
    if(coords.length < 2) return tickWidth;

    var _coords = coords.map(ax.d2c),
        minDTick = Math.abs(_coords[1] - _coords[0]);

    for(var i = 1; i < _coords.length - 1; i++) {
        var dist = Math.abs(_coords[i + 1] - _coords[i]);
        minDTick = Math.min(dist, minDTick);
    }

    return minDTick * tickWidth;
}
