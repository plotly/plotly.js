/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Scatter = require('../../traces/scatter');
var Lib = require('../../lib');
var ErrorBars = require('../../components/errorbars');

var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYZDefaults(traceIn, traceOut, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('mode');

    if(Scatter.hasLines(traceOut)) {
        Scatter.lineDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    if(Scatter.hasMarkers(traceOut)) {
        Scatter.markerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    if(Scatter.hasText(traceOut)) {
        Scatter.textDefaults(traceIn, traceOut, layout, coerce);
    }

    var lineColor = (traceOut.line || {}).color ,
        markerColor = (traceOut.marker || {}).color;
    if(coerce('surfaceaxis') >= 0) coerce('surfacecolor', lineColor || markerColor);

    var dims = ['x', 'y', 'z'];
    for(var i = 0; i < 3; ++i) {
        var projection = 'projection.' + dims[i];
        if(coerce(projection + '.show')) {
            coerce(projection + '.opacity');
            coerce(projection + '.scale');
        }
    }

    ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'z'});
    ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y', inherit: 'z'});
    ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'z'});
};

function handleXYZDefaults(traceIn, traceOut, coerce) {
    var len = 0,
        x = coerce('x'),
        y = coerce('y'),
        z = coerce('z');

    if(x && y && z) {
        len = Math.min(x.length, y.length, z.length);
        if(len < x.length) traceOut.x = x.slice(0, len);
        if(len < y.length) traceOut.y = y.slice(0, len);
        if(len < z.length) traceOut.z = z.slice(0, len);
    }

    return len;
}
