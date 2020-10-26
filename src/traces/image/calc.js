/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var constants = require('./constants');
var isNumeric = require('fast-isnumeric');
var Axes = require('../../plots/cartesian/axes');
var maxRowLength = require('../../lib').maxRowLength;
var getImageSize = require('./helpers').getImageSize;

module.exports = function calc(gd, trace) {
    var h;
    var w;
    if(trace._hasZ) {
        h = trace.z.length;
        w = maxRowLength(trace.z);
    } else if(trace._hasSource) {
        var size = getImageSize(trace.source);
        h = size.height;
        w = size.width;
    }

    var xa = Axes.getFromId(gd, trace.xaxis || 'x');
    var ya = Axes.getFromId(gd, trace.yaxis || 'y');

    var x0 = xa.d2c(trace.x0) - trace.dx / 2;
    var y0 = ya.d2c(trace.y0) - trace.dy / 2;

    // Set axis range
    var i;
    var xrange = [x0, x0 + w * trace.dx];
    var yrange = [y0, y0 + h * trace.dy];
    if(xa && xa.type === 'log') for(i = 0; i < w; i++) xrange.push(x0 + i * trace.dx);
    if(ya && ya.type === 'log') for(i = 0; i < h; i++) yrange.push(y0 + i * trace.dy);
    trace._extremes[xa._id] = Axes.findExtremes(xa, xrange);
    trace._extremes[ya._id] = Axes.findExtremes(ya, yrange);
    trace._scaler = makeScaler(trace);

    var cd0 = {
        x0: x0,
        y0: y0,
        z: trace.z,
        w: w,
        h: h
    };
    return [cd0];
};

function scale(zero, ratio, min, max) {
    return function(c) {
        return Lib.constrain((c - zero) * ratio, min, max);
    };
}

function constrain(min, max) {
    return function(c) { return Lib.constrain(c, min, max);};
}

// Generate a function to scale color components according to zmin/zmax and the colormodel
function makeScaler(trace) {
    var cr = constants.colormodel[trace.colormodel];
    var colormodel = (cr.colormodel || trace.colormodel);
    var n = colormodel.length;

    trace._sArray = [];
    // Loop over all color components
    for(var k = 0; k < n; k++) {
        if(cr.min[k] !== trace.zmin[k] || cr.max[k] !== trace.zmax[k]) {
            trace._sArray.push(scale(
                trace.zmin[k],
                (cr.max[k] - cr.min[k]) / (trace.zmax[k] - trace.zmin[k]),
                cr.min[k],
                cr.max[k]
            ));
        } else {
            trace._sArray.push(constrain(cr.min[k], cr.max[k]));
        }
    }

    return function(pixel) {
        var c = pixel.slice(0, n);
        for(var k = 0; k < n; k++) {
            var ck = c[k];
            if(!isNumeric(ck)) return false;
            c[k] = trace._sArray[k](ck);
        }
        return c;
    };
}
