/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

// This routine gets called during the trace supply-defaults step.
//
// This is a hacky way to make 'ohlc' and 'candlestick' trace types
// go through the transform machinery.
//
// Note that, we must mutate user data (here traceIn) as opposed
// to full data (here traceOut) as - at the moment - transform
// defaults (which are called after trace defaults) start
// from a clear transforms container.
exports.pushDummyTransformOpts = function(traceIn, traceOut) {
    var transformOpts = {

        // give dummy transform the same type as trace
        type: traceOut.type,

        // track ephemeral transforms in user data
        _ephemeral: true
    };

    if(Array.isArray(traceIn.transforms)) {
        var transformsIn = traceIn.transforms;

        // remove all ephemeral transforms,
        // before adding dummy transform
        for(var i = 0; i < transformsIn.length; i++) {
            if(transformsIn[i]._ephemeral) transformsIn.splice(i, 1);
        }

        traceIn.transforms.push(transformOpts);
    }
    else {
        traceIn.transforms = [transformOpts];
    }
};

// This routine gets called during the transform supply-defaults step,
// but only has an effect (because of the if-statements) during the
// second round of transform defaults done on generated traces.
//
// This is a hacky way to pass 'ohlc' and 'candlestick' attributes
// (found the transform container via exports.makeTransform)
// to the traceOut container such that they can be compatible with
// filter and groupby transforms.
exports.copyOHLC = function(container, traceOut) {
    if(container.open) traceOut.open = container.open;
    if(container.high) traceOut.high = container.high;
    if(container.low) traceOut.low = container.low;
    if(container.close) traceOut.close = container.close;
};

// This routine gets called during the applyTransform step.
//
// We need to track trace attributes and which direction
// ('increasing' or 'decreasing')
// the generated correspond to for the calcTransform step.
//
// To make sure that the attributes reach the calcTransform,
// store it in the transform opts object.
exports.makeTransform = function(traceIn, state, direction) {
    var out = Lib.extendFlat([], traceIn.transforms);

    out[state.transformIndex] = {
        type: traceIn.type,
        direction: direction,

        // these are copied to traceOut during exports.copyOHLC
        open: traceIn.open,
        high: traceIn.high,
        low: traceIn.low,
        close: traceIn.close
    };

    return out;
};

exports.getFilterFn = function(direction) {
    switch(direction) {
        case 'increasing':
            return function(o, c) { return o <= c; };

        case 'decreasing':
            return function(o, c) { return o > c; };
    }
};

exports.addRangeSlider = function(layout) {
    if(!layout.xaxis) layout.xaxis = {};
    if(!layout.xaxis.rangeslider) layout.xaxis.rangeslider = {};
};
