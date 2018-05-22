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
var OPEN_RE = /-open/;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var dimLength = handleDimensionsDefaults(traceIn, traceOut);

    var showDiag = coerce('diagonal.visible');
    var showUpper = coerce('showupperhalf');
    var showLower = coerce('showlowerhalf');

    if(!dimLength || (!showDiag && !showUpper && !showLower)) {
        traceOut.visible = false;
        return;
    }

    coerce('text');

    handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce);

    var isOpen = OPEN_RE.test(traceOut.marker.symbol);
    var isBubble = subTypes.isBubble(traceOut);
    coerce('marker.line.width', isOpen || isBubble ? 1 : 0);

    handleAxisDefaults(traceIn, traceOut, layout, coerce);

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

        // wait until plot step to filter out visible false dimensions
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

    traceOut._length = commonLength;

    return dimensionsOut.length;
}

function handleAxisDefaults(traceIn, traceOut, layout, coerce) {
    var dimensions = traceOut.dimensions;
    var dimLength = dimensions.length;
    var showUpper = traceOut.showupperhalf;
    var showLower = traceOut.showlowerhalf;
    var showDiag = traceOut.diagonal.visible;
    var i, j;

    // N.B. one less x axis AND one less y axis when hiding one half and the diagonal
    var axDfltLength = !showDiag && (!showUpper || !showLower) ? dimLength - 1 : dimLength;

    var xaxes = coerce('xaxes', fillAxisIdArray('x', axDfltLength));
    var yaxes = coerce('yaxes', fillAxisIdArray('y', axDfltLength));

    // to avoid costly indexOf
    traceOut._xaxes = arrayToHashObject(xaxes);
    traceOut._yaxes = arrayToHashObject(yaxes);

    // allow users to under-specify number of axes
    var axLength = Math.min(axDfltLength, xaxes.length, yaxes.length);

    // fill in splom subplot keys
    for(i = 0; i < axLength; i++) {
        for(j = 0; j < axLength; j++) {
            var id = [xaxes[i] + yaxes[j]];

            if(i > j && showUpper) {
                layout._splomSubplots[id] = 1;
            } else if(i < j && showLower) {
                layout._splomSubplots[id] = 1;
            } else if(i === j && (showDiag || !showLower || !showUpper)) {
                // need to include diagonal subplots when
                // hiding one half and the diagonal
                layout._splomSubplots[id] = 1;
            }
        }
    }

    // build list of [x,y] axis corresponding to each dimensions[i],
    // very useful for passing options to regl-splom
    var diag = traceOut._diag = new Array(dimLength);

    // cases where showDiag and showLower or showUpper are false
    // no special treatment as the xaxes and yaxes items no longer match
    // the dimensions items 1-to-1
    var xShift = !showDiag && !showLower ? -1 : 0;
    var yShift = !showDiag && !showUpper ? -1 : 0;

    for(i = 0; i < dimLength; i++) {
        var dim = dimensions[i];
        var xa = xaxes[i + xShift];
        var ya = yaxes[i + yShift];

        fillAxisStash(layout, xa, dim);
        fillAxisStash(layout, ya, dim);

        // note that some the entries here may be undefined
        diag[i] = [xa, ya];
    }

    // when lower half is omitted, override grid default
    // to make sure axes remain on the left/bottom of the plot area
    if(!showLower) {
        layout._splomGridDflt.xside = 'bottom';
        layout._splomGridDflt.yside = 'left';
    }
}

function fillAxisIdArray(axLetter, len) {
    var out = new Array(len);

    for(var i = 0; i < len; i++) {
        out[i] = axLetter + (i ? i + 1 : '');
    }

    return out;
}

function fillAxisStash(layout, axId, dim) {
    if(!axId) return;

    var axLetter = axId.charAt(0);
    var stash = layout._splomAxes[axLetter];

    if(!(axId in stash)) {
        stash[axId] = (dim || {}).label || '';
    }
}

function arrayToHashObject(arr) {
    var obj = {};
    for(var i = 0; i < arr.length; i++) {
        obj[arr[i]] = 1;
    }
    return obj;
}
