/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var Lib = require('../../lib');

var attributes = require('./attributes');


module.exports = function(traceIn, traceOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var binDirections = ['x'],
        hasAggregationData,
        x = coerce('x'),
        y = coerce('y');

    if(Plotly.Plots.traceIs(traceOut, '2dMap')) {
        // we could try to accept x0 and dx, etc...
        // but that's a pretty weird use case.
        // for now require both x and y explicitly specified.
        if(!(x && x.length && y && y.length)) {
            traceOut.visible = false;
            return;
        }

        // if marker.color is an array, we can use it in aggregation instead of z
        hasAggregationData = coerce('z') || coerce('marker.color');

        binDirections = ['x','y'];
    } else {
        var orientation = coerce('orientation', (y && !x) ? 'h' : 'v'),
            sample = traceOut[orientation==='v' ? 'x' : 'y'];

        if(!(sample && sample.length)) {
            traceOut.visible = false;
            return;
        }

        if(orientation==='h') binDirections = ['y'];

        hasAggregationData = traceOut[orientation==='h' ? 'x' : 'y'];
    }

    if(hasAggregationData) coerce('histfunc');
    coerce('histnorm');

    binDirections.forEach(function(binDirection) {
        // data being binned - note that even though it's a little weird,
        // it's possible to have bins without data, if there's inferred data
        var binstrt = coerce(binDirection + 'bins.start'),
            binend = coerce(binDirection + 'bins.end'),
            autobin = coerce('autobin' + binDirection, !(binstrt && binend));

        if(autobin) coerce('nbins' + binDirection);
        else coerce(binDirection + 'bins.size');
    });
};
