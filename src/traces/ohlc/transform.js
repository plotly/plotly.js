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
var axisIds = require('../../plots/cartesian/axis_ids');

exports.moduleType = 'transform';

exports.name = 'ohlc';

exports.attributes = {};

exports.supplyDefaults = null;

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
    var directionOpts = traceIn[direction];

    // We need to track which direction ('increasing' or 'decreasing')
    // the generated correspond to for the calcTransform step.
    //
    // To make sure that direction reaches the calcTransform,
    // store it in the transform opts object.
    var _transforms = Lib.extendFlat([], traceIn.transforms);
    _transforms[state.transformIndex] = {
        type: 'ohlc',
        direction: direction
    };

    return {
        type: 'scatter',
        mode: 'lines',
        connectgaps: false,

        // TODO could do better
        name: direction,

        // to make autotype catch date axes soon!!
        x: traceIn.t || [0],

        // concat low and high to get correct autorange
        y: [].concat(traceIn.low).concat(traceIn.high),

        visible: directionOpts.visible,

        line: {
            color: directionOpts.color,
            width: directionOpts.width,
            dash: directionOpts.dash
        },

        text: traceIn.text,
        hoverinfo: traceIn.hoverinfo,

        opacity: traceIn.opacity,
        showlegend: traceIn.showlegend,

        transforms: _transforms
    };
}

exports.calcTransform = function calcTransform(gd, trace, opts) {
    var fullInput = trace._fullInput,
        direction = opts.direction;

    var filterFn = helpers.getFilterFn(direction),
        ax = axisIds.getFromTrace(gd, trace, 'x'),
        tickWidth = convertTickWidth(fullInput.t, ax, fullInput[direction].tickwidth);

    // TODO tickwidth does not restyle

    var open = fullInput.open,
        high = fullInput.high,
        low = fullInput.low,
        close = fullInput.close;

    // sliced accordingly in supply-defaults
    var len = open.length;

    // clear generated trace x / y
    trace.x = [];
    trace.y = [];

    var appendX = fullInput.t ?
        function(i) {
            var t = ax.d2c(fullInput.t[i]);
            trace.x.push(t - tickWidth, t, t, t, t, t + tickWidth, null);
        } :
        function(i) {
            trace.x.push(i - tickWidth, i, i, i, i, i + tickWidth, null);
        };

    var appendY = function(o, h, l, c) {
        trace.y.push(o, o, h, l, c, c, null);
    };

    for(var i = 0; i < len; i++) {
        if(filterFn(open[i], close[i])) {
            appendX(i);
            appendY(open[i], high[i], low[i], close[i]);
        }
    }
};

function convertTickWidth(t, ax, tickWidth) {
    if(!t) return tickWidth;

    var tInData = t.map(ax.d2c),
        minDTick = Infinity;

    for(var i = 0; i < t.length - 1; i++) {
        minDTick = Math.min(tInData[i + 1] - tInData[i], minDTick);
    }

    return minDTick * tickWidth;
}
