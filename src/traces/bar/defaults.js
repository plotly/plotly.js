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
var Color = require('../../components/color');

var histogramSupplyDefaults = require('../histogram/defaults');
var handleXYDefaults = require('../scatter/xy_defaults');
var errorBarsSupplyDefaults = require('../../components/errorbars/defaults');

var attributes = require('./attributes');


module.exports = function(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    if(traceOut.type === 'histogram') {
        // x, y, and orientation are coerced in the histogram supplyDefaults
        // (along with histogram-specific attributes)
        histogramSupplyDefaults(traceIn, traceOut);
        if(!traceOut.visible) return;
    }
    else {
        var len = handleXYDefaults(traceIn, traceOut, coerce);
        if(!len) {
            traceOut.visible = false;
            return;
        }

        coerce('orientation', (traceOut.x && !traceOut.y) ? 'h' : 'v');
    }

    coerce('marker.color', defaultColor);
    if(Plotly.Colorscale.hasColorscale(traceIn, 'marker')) {
        Plotly.Colorscale.handleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.', cLetter: 'c'}
        );
    }

    coerce('marker.line.color', Plotly.Color.defaultLine);
    if(Plotly.Colorscale.hasColorscale(traceIn, 'marker.line')) {
        Plotly.Colorscale.handleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.line.', cLetter: 'c'}
        );
    }

    coerce('marker.line.width', 0);
    coerce('text');

    // override defaultColor for error bars with defaultLine
    errorBarsSupplyDefaults(traceIn, traceOut, Color.defaultLine, {axis: 'y'});
    errorBarsSupplyDefaults(traceIn, traceOut, Color.defaultLine, {axis: 'x', inherit: 'y'});
};
