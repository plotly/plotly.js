/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

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

    helpers.addRangeSlider(dataOut, state.layout);

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
            xcalendar: traceIn.xcalendar,

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
        tickWidth = convertTickWidth(gd, xa, trace);

    var open = trace.open,
        high = trace.high,
        low = trace.low,
        close = trace.close,
        textIn = trace.text;

    var len = open.length,
        x = [],
        y = [],
        textOut = [];

    var appendX;
    if(trace._fullInput.x) {
        appendX = function(i) {
            var xi = trace.x[i],
                xcalendar = trace.xcalendar,
                xcalc = xa.d2c(xi, 0, xcalendar);

            x.push(
                xa.c2d(xcalc - tickWidth, 0, xcalendar),
                xi, xi, xi, xi,
                xa.c2d(xcalc + tickWidth, 0, xcalendar),
                null);
        };
    }
    else {
        appendX = function(i) {
            x.push(
                i - tickWidth,
                i, i, i, i,
                i + tickWidth,
                null);
        };
    }

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

    var getTextItem = Array.isArray(textIn) ?
        function(i) { return textIn[i] || ''; } :
        function() { return textIn; };

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
        if(filterFn(open[i], close[i]) && isNumeric(high[i]) && isNumeric(low[i])) {
            appendX(i);
            appendY(open[i], high[i], low[i], close[i]);
            appendText(i, open[i], high[i], low[i], close[i]);
        }
    }

    trace.x = x;
    trace.y = y;
    trace.text = textOut;
};

function convertTickWidth(gd, xa, trace) {
    var fullInput = trace._fullInput,
        tickWidth = fullInput.tickwidth,
        minDiff = fullInput._minDiff;

    if(!minDiff) {
        var fullData = gd._fullData,
            ohlcTracesOnThisXaxis = [];

        minDiff = Infinity;

        // find min x-coordinates difference of all traces
        // attached to this x-axis and stash the result

        var i;

        for(i = 0; i < fullData.length; i++) {
            var _trace = fullData[i]._fullInput;

            if(_trace.type === 'ohlc' &&
                _trace.visible === true &&
                _trace.xaxis === xa._id
            ) {
                ohlcTracesOnThisXaxis.push(_trace);

                // - _trace.x may be undefined here,
                // it is filled later in calcTransform
                //
                // - handle trace of length 1 separately.

                if(_trace.x && _trace.x.length > 1) {
                    var xcalc = Lib.simpleMap(_trace.x, xa.d2c, 0, trace.xcalendar),
                        _minDiff = Lib.distinctVals(xcalc).minDiff;
                    minDiff = Math.min(minDiff, _minDiff);
                }
            }
        }

        // if minDiff is still Infinity here, set it to 1
        if(minDiff === Infinity) minDiff = 1;

        for(i = 0; i < ohlcTracesOnThisXaxis.length; i++) {
            ohlcTracesOnThisXaxis[i]._minDiff = minDiff;
        }
    }

    return minDiff * tickWidth;
}
