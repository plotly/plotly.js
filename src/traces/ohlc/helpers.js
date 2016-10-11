/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

// TODO add comment
exports.pushDummyTransformOpts = function(traceIn, traceOut) {
    var transformOpts = {

        // give dummy transform the same type as trace
        type: traceOut.type,

        // track ephemeral transforms in user data
        _ephemeral: true
    };

    if(Array.isArray(traceIn.transforms)) {
        var transformsIn = traceIn.transforms;

        for(var i = 0; i < transformsIn.length; i++) {
            if(transformsIn[i]._ephemeral) transformsIn.splice(i, 1);
        }

        traceIn.transforms.push(transformOpts);
    }
    else {
        traceIn.transforms = [transformOpts];
    }
};

// TODO add comment
exports.copyOHLC = function(container, traceOut) {
    if(container.open) traceOut.open = container.open;
    if(container.high) traceOut.high = container.high;
    if(container.low) traceOut.low = container.low;
    if(container.close) traceOut.close = container.close;
};

// We need to track which direction ('increasing' or 'decreasing')
// the generated correspond to for the calcTransform step.
//
// To make sure that direction reaches the calcTransform,
// store it in the transform opts object.
exports.makeTransform = function(traceIn, state, direction) {
    var out = Lib.extendFlat([], traceIn.transforms);

    out[state.transformIndex] = {
        type: traceIn.type,
        direction: direction,

        // ...
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
