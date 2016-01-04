/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Scatter = require('../scatter');

var handleXYDefaults = require('../scatter/xy_defaults');
var errorBarsSupplyDefaults = require('../../components/errorbars/defaults');
var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYDefaults(traceIn, traceOut, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('mode', len < Scatter.PTS_LINESONLY ? 'lines+markers' : 'lines');

    if(Scatter.hasLines(traceOut)) {
        Scatter.lineDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    if(Scatter.hasMarkers(traceOut)) {
        Scatter.markerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    coerce('fill');
    if(traceOut.fill !== 'none') {
        Scatter.fillColorDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    errorBarsSupplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y'});
    errorBarsSupplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'y'});
};
