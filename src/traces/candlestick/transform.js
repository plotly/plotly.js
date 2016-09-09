/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var helpers = require('../ohlc/helpers');

exports.moduleType = 'transform';

exports.name = 'candlestick';

exports.attributes = {};

exports.supplyDefaults = null;

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

    // add a few layout features
    var layout = state.layout;
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
        type: 'candlestick',
        direction: direction
    };

    return {
        type: 'box',
        boxpoints: false,

        // TODO could do better
        name: direction,

        // to make autotype catch date axes soon!!
        x: traceIn.t || [0],

        // concat low and high to get correct autorange
        y: [].concat(traceIn.low).concat(traceIn.high),

        visible: directionOpts.visible,

        line: {
            color: directionOpts.color,
            width: directionOpts.width
        },
        fillcolor: directionOpts.fillcolor,

        // TODO this doesn't restyle currently
        whiskerwidth: directionOpts.tickwidth,

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

    var filterFn = helpers.getFilterFn(direction);

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
            var t = fullInput.t[i];
            trace.x.push(t, t, t, t, t, t);
        } :
        function(i) {
            trace.x.push(i, i, i, i, i, i);
        };

    var appendY = function(o, h, l, c) {
        trace.y.push(l, o, c, c, c, h);
    };

    for(var i = 0; i < len; i++) {
        if(filterFn(open[i], close[i])) {
            appendX(i);
            appendY(open[i], high[i], low[i], close[i]);
        }
    }
};
