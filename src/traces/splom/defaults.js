/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

var attributes = require('./attributes');
var subTypes = require('../scatter/subtypes');
var handleMarkerDefaults = require('../scatter/marker_defaults');
var handleLineDefaults = require('../scatter/line_defaults');
var PTS_LINESONLY = require('../scatter/constants').PTS_LINESONLY;
var OPEN_RE = /-open/;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var dimLength = handleDimensionsDefaults(traceIn, traceOut);
    if(!dimLength) {
        traceOut.visible = false;
        return;
    }

    coerce('mode', traceOut._commonLength < PTS_LINESONLY ? 'lines+markers' : 'lines');
    coerce('text');

    // TODO just markers for now
    traceOut.mode = 'markers';

    if(subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);
        coerce('connectgaps');
    }

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce);

        var isOpen = OPEN_RE.test(traceOut.marker.symbol);
        var isBubble = subTypes.isBubble(traceOut);
        coerce('marker.line.width', isOpen || isBubble ? 1 : 0);
    }

    handleAxisDefaults(traceIn, traceOut, layout, coerce);

    // TODO not implemented yet
    coerce('showdiagonal');
    coerce('showupperhalf');
    coerce('showlowerhalf');

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};

function handleDimensionsDefaults(traceIn, traceOut) {
    var dimensionsIn = traceIn.dimensions;
    if(!Array.isArray(dimensionsIn)) return 0;

    var dimLength = dimensionsIn.length;
    var commonLength = 0;
    var dimensionsOut = traceOut.dimensions = new Array(dimLength);
    var dimIn;
    var dimOut;
    var i;

    function coerce(attr, dflt) {
        return Lib.coerce(dimIn, dimOut, attributes.dimensions, attr, dflt);
    }

    for(i = 0; i < dimLength; i++) {
        dimIn = dimensionsIn[i];
        dimOut = dimensionsOut[i] = {};

        // coerce label even if dimensions may be `visible: false`,
        // to fill in axis title defaults
        coerce('label');

        var visible = coerce('visible');
        if(!visible) continue;

        var values = coerce('values');
        if(!values || !values.length) {
            dimOut.visible = false;
            continue;
        }

        commonLength = Math.max(commonLength, values.length);
        dimOut._index = i;
    }

    for(i = 0; i < dimLength; i++) {
        dimOut = dimensionsOut[i];
        if(dimOut.visible) dimOut._length = commonLength;
    }

    traceOut._commonLength = commonLength;

    return dimensionsOut.length;
}

function handleAxisDefaults(traceIn, traceOut, layout, coerce) {
    var dimensions = traceOut.dimensions;
    var dimLength = dimensions.length;
    var xaxesDflt = new Array(dimLength);
    var yaxesDflt = new Array(dimLength);
    var i;

    for(i = 0; i < dimLength; i++) {
        xaxesDflt[i] = 'x' + (i ? i + 1 : '');
        yaxesDflt[i] = 'y' + (i ? i + 1 : '');
    }

    var xaxes = coerce('xaxes', xaxesDflt);
    var yaxes = coerce('yaxes', yaxesDflt);

    // splom defaults set three types of 'length' values on the
    // full data items:
    //
    // - _commonLength: is the common length of each dimensions[i].values
    // - dimensions[i]._length: is a copy of _commonLength to each dimensions item
    //                          (this one is used during ax.makeCalcdata)
    // - _activeLength: is the number of dimensions that can generate axes for a given trace
    //
    // when looping from 0..activeLength dimensions and (x|y)axes indices should match.
    // note that `visible: false` dimensions contribute to activeLength and must
    // be skipped before drawing calls.
    var activeLength = traceOut._activeLength = Math.min(dimLength, xaxes.length, yaxes.length);

    for(i = 0; i < activeLength; i++) {
        var dim = dimensions[i];
        var xa = xaxes[i];
        var ya = yaxes[i];

        if(!(xa in layout._splomAxes.x)) {
            layout._splomAxes.x[xa] = dim.label || '';
        }
        if(!(ya in layout._splomAxes.y)) {
            layout._splomAxes.y[ya] = dim.label || '';
        }
    }
}
