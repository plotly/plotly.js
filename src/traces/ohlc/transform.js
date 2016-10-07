/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var helpers = require('./helpers');
var axisIds = require('../../plots/cartesian/axis_ids');

exports.moduleType = 'transform';

exports.name = 'ohlc';

exports.attributes = {};

exports.supplyDefaults = function(transformIn, traceOut) {
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

    // add a few layout features
    var layout = state.layout;
    if(!layout.hovermode) layout.hovermode = 'closest';
    helpers.addRangeSlider(layout);

    return dataOut;
};

function makeTrace(traceIn, state, direction) {
    var traceOut = {
        type: 'scatter',
        mode: 'lines',
        connectgaps: false,

        // TODO could do better
        name: direction,

        text: traceIn.text,
        hoverinfo: traceIn.hoverinfo,

        opacity: traceIn.opacity,
        showlegend: traceIn.showlegend,

        transforms: helpers.makeTransform(traceIn, state, direction)
    };

    // the rest of below may not have been coerced

    var directionOpts = traceIn[direction];

    if(directionOpts) {

        // to make autotype catch date axes soon!!
        traceOut.x = traceIn.x || [0];

        // concat low and high to get correct autorange
        traceOut.y = [].concat(traceIn.low).concat(traceIn.high);

        traceOut.visible = directionOpts.visible;

        traceOut.line = {
            color: directionOpts.color,
            width: directionOpts.width,
            dash: directionOpts.dash
        };
    }

    return traceOut;
}

exports.calcTransform = function calcTransform(gd, trace, opts) {
    var direction = opts.direction,
        filterFn = helpers.getFilterFn(direction),
        ax = axisIds.getFromTrace(gd, trace, 'x'),
        tickWidth = convertTickWidth(trace.x, ax, trace._fullInput.tickwidth);

    var open = trace.open,
        high = trace.high,
        low = trace.low,
        close = trace.close;

    var len = open.length,
        x = [],
        y = [];

    var appendX = trace._fullInput.x ?
        function(i) {
            var v = ax.d2c(trace.x[i]);
            x.push(v - tickWidth, v, v, v, v, v + tickWidth, null);
        } :
        function(i) {
            x.push(i - tickWidth, i, i, i, i, i + tickWidth, null);
        };

    var appendY = function(o, h, l, c) {
        y.push(o, o, h, l, c, c, null);
    };

    for(var i = 0; i < len; i++) {
        if(filterFn(open[i], close[i])) {
            appendX(i);
            appendY(open[i], high[i], low[i], close[i]);
        }
    }

    trace.x = x;
    trace.y = y;
};

function convertTickWidth(coords, ax, tickWidth) {
    if(coords.length < 2) return tickWidth;

    var _coords = coords.map(ax.d2c),
        minDTick = _coords[1] - _coords[0];

    for(var i = 1; i < _coords.length - 1; i++) {
        minDTick = Math.min(_coords[i + 1] - _coords[i], minDTick);
    }

    return minDTick * tickWidth;
}
