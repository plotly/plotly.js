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
var hasColorscale = require('../../components/colorscale/has_colorscale');
var colorscaleDefaults = require('../../components/colorscale/defaults');
var maxDimensionCount = require('./constants').maxDimensionCount;
var handleDomainDefaults = require('../../plots/domain').defaults;

function handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce) {
    var lineColor = coerce('line.color', defaultColor);

    if(hasColorscale(traceIn, 'line') && Lib.isArrayOrTypedArray(lineColor)) {
        if(lineColor.length) {
            coerce('line.colorscale');
            colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: 'line.', cLetter: 'c'});
            // TODO: I think it would be better to keep showing lines beyond the last line color
            // but I'm not sure what color to give these lines - probably black or white
            // depending on the background color?
            traceOut._commonLength = Math.min(traceOut._commonLength, lineColor.length);
        }
        else {
            traceOut.line.color = defaultColor;
        }
    }
}

function dimensionsDefaults(traceIn, traceOut) {
    var dimensionsIn = traceIn.dimensions || [],
        dimensionsOut = traceOut.dimensions = [];

    var dimensionIn, dimensionOut, i;
    var commonLength = Infinity;

    if(dimensionsIn.length > maxDimensionCount) {
        Lib.log('parcoords traces support up to ' + maxDimensionCount + ' dimensions at the moment');
        dimensionsIn.splice(maxDimensionCount);
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

        var values = coerce('values');
        var visible = coerce('visible');
        if(!(values && values.length)) {
            visible = dimensionOut.visible = false;
        }

        if(visible) {
            coerce('label');
            coerce('tickvals');
            coerce('ticktext');
            coerce('tickformat');
            coerce('range');

            coerce('multiselect');
            coerce('constraintrange');

            commonLength = Math.min(commonLength, values.length);
        }

        dimensionOut._index = i;
        dimensionsOut.push(dimensionOut);
    }

    traceOut._commonLength = commonLength;

    return dimensionsOut;
}

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var dimensions = dimensionsDefaults(traceIn, traceOut);

    handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);

    handleDomainDefaults(traceOut, layout, coerce);

    if(!Array.isArray(dimensions) || !dimensions.length) {
        traceOut.visible = false;
    }

    // since we're not slicing uneven arrays anymore, stash the length in each dimension
    // but we can't do this in dimensionsDefaults (yet?) because line.color can also
    // truncate
    for(var i = 0; i < dimensions.length; i++) {
        if(dimensions[i].visible) dimensions[i]._length = traceOut._commonLength;
    }

    // make default font size 10px (default is 12),
    // scale linearly with global font size
    var fontDflt = {
        family: layout.font.family,
        size: Math.round(layout.font.size / 1.2),
        color: layout.font.color
    };

    Lib.coerceFont(coerce, 'labelfont', fontDflt);
    Lib.coerceFont(coerce, 'tickfont', fontDflt);
    Lib.coerceFont(coerce, 'rangefont', fontDflt);
};
