/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var parcatConstants = require('./constants');
var colorbarDefaults = require('../../components/colorbar/defaults');

function markerDefaults(traceIn, traceOut, defaultColor, layout, coerce) {

    coerce('line.color', defaultColor);

    if(traceIn.line) {
        coerce('line.cmin');
        coerce('line.cmax');
        coerce('line.cauto');
        coerce('line.colorscale');
        coerce('line.showscale');
        coerce('line.shape');
        colorbarDefaults(traceIn.line, traceOut.line, layout);
    }
}

function dimensionsDefaults(traceIn, traceOut) {
    var dimensionsIn = traceIn.dimensions || [],
        dimensionsOut = traceOut.dimensions = [];

    var dimensionIn, dimensionOut, i;
    var commonLength = Infinity;

    if(dimensionsIn.length > parcatConstants.maxDimensionCount) {
        Lib.log('parcats traces support up to ' + parcatConstants.maxDimensionCount + ' dimensions at the moment');
        dimensionsIn.splice(parcatConstants.maxDimensionCount);
    }

    function coerce(attr, dflt) {
        return Lib.coerce(dimensionIn, dimensionOut, attributes.dimensions, attr, dflt);
    }

    for(i = 0; i < dimensionsIn.length; i++) {
        dimensionIn = dimensionsIn[i];
        dimensionOut = {};

        if(!Lib.isPlainObject(dimensionIn)) {
            continue;
        }

        // Dimension level
        coerce('values');
        coerce('label');
        coerce('displayInd', i);

        // Category level
        coerce('catDisplayInds');
        coerce('catValues');
        coerce('catLabels');

        // Pass through catValues, catorder, and catlabels (validated in calc since this is where unique info is available)

        // pass through line (color)
        // Pass through font

        commonLength = Math.min(commonLength, dimensionOut.values.length);

        // dimensionOut._index = i;
        dimensionsOut.push(dimensionOut);
    }

    if(isFinite(commonLength)) {
        for(i = 0; i < dimensionsOut.length; i++) {
            dimensionOut = dimensionsOut[i];
            if(dimensionOut.values.length > commonLength) {
                dimensionOut.values = dimensionOut.values.slice(0, commonLength);
            }
        }
    }

    // handle dimension order
    // If specified for all dimensions and no collisions or holes keep, otherwise discard

    // Pass through value colors
    // Pass through opacity

    // Pass through dimension font
    // Pass through category font

    return dimensionsOut;
}

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    dimensionsDefaults(traceIn, traceOut);

    coerce('domain.x');
    coerce('domain.y');

    markerDefaults(traceIn, traceOut, defaultColor, layout, coerce);

    coerce('hovermode');
    coerce('tooltip');
    coerce('bundlecolors');
    coerce('sortpaths');
    coerce('counts');
};
