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
var helpers = require('../ohlc/helpers');

exports.moduleType = 'transform';

exports.name = 'candlestick';

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

        if(traceIn.type !== 'candlestick') {
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
        type: 'box',
        boxpoints: false,

        visible: traceIn.visible,
        hoverinfo: traceIn.hoverinfo,
        opacity: traceIn.opacity,
        xaxis: traceIn.xaxis,
        yaxis: traceIn.yaxis,

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

            whiskerwidth: traceIn.whiskerwidth,
            text: traceIn.text,

            name: directionOpts.name,
            showlegend: directionOpts.showlegend,
            line: directionOpts.line,
            fillcolor: directionOpts.fillcolor
        });
    }

    return traceOut;
}

exports.calcTransform = function calcTransform(gd, trace, opts) {
    var direction = opts.direction,
        filterFn = helpers.getFilterFn(direction);

    var open = trace.open,
        high = trace.high,
        low = trace.low,
        close = trace.close;

    var len = open.length,
        x = [],
        y = [];

    var appendX = trace._fullInput.x ?
        function(i) {
            var v = trace.x[i];
            x.push(v, v, v, v, v, v);
        } :
        function(i) {
            x.push(i, i, i, i, i, i);
        };

    var appendY = function(o, h, l, c) {
        y.push(l, o, c, c, c, h);
    };

    for(var i = 0; i < len; i++) {
        if(filterFn(open[i], close[i]) && isNumeric(high[i]) && isNumeric(low[i])) {
            appendX(i);
            appendY(open[i], high[i], low[i], close[i]);
        }
    }

    trace.x = x;
    trace.y = y;
};
