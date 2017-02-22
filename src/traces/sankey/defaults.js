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
var hasColorscale = require('../../components/colorscale/has_colorscale');
var colorscaleDefaults = require('../../components/colorscale/defaults');

function handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce) {

    coerce('line.color', defaultColor);
    coerce('line.colorscale');

    if(hasColorscale(traceIn, 'line')) {
        colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: 'line.', cLetter: 'c'});
    }
    else {
        coerce('line.color', defaultColor);
    }
}

function dimensionsDefaults(traceIn, traceOut) {
    var dimensionsIn = traceIn.dimensions || [],
        dimensionsOut = traceOut.dimensions = [];

    var dimensionIn, dimensionOut, i;
    var commonLength = Infinity;

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
        var visible = coerce('visible', values.length > 0);

        if(visible) {
            coerce('label');
            coerce('tickvals');
            coerce('ticktext');
            coerce('tickformat');
            coerce('range');
            coerce('constraintrange');

            commonLength = Math.min(commonLength, dimensionOut.values.length);
        }

        dimensionOut._index = i;
        dimensionsOut.push(dimensionOut);
    }

    if(isFinite(commonLength)) {
        for(i = 0; i < dimensionsOut.length; i++) {
            dimensionOut = dimensionsOut[i];
            if(dimensionOut.visible && dimensionOut.values.length > commonLength) {
                dimensionOut.values = dimensionOut.values.slice(0, commonLength);
            }
        }
    }
}

function nodesDefaults(traceIn, traceOut) {
    var nodesIn = traceIn.nodes || [],
        nodesOut = traceOut.nodes = [];

    var nodeIn, nodeOut, i;

    function coerce(attr, dflt) {
        return Lib.coerce(nodeIn, nodeOut, attributes.nodes, attr, dflt);
    }

    for(i = 0; i < nodesIn.length; i++) {
        nodeIn = nodesIn[i];
        nodeOut = {};

        if(!Lib.isPlainObject(nodeIn)) {
            continue;
        }

        var visible = coerce('visible');

        if(visible) {
            coerce('label');
        }

        nodeOut._index = i;
        nodesOut.push(nodeOut);
    }

    return nodesOut;
}

function linksDefaults(traceIn, traceOut) {
    var linksIn = traceIn.links || [],
        linksOut = traceOut.links = [];

    var linkIn, linkOut, i;

    function coerce(attr, dflt) {
        return Lib.coerce(linkIn, linkOut, attributes.links, attr, dflt);
    }

    for(i = 0; i < linksIn.length; i++) {
        linkIn = linksIn[i];
        linkOut = {};

        if(!Lib.isPlainObject(linkIn)) {
            continue;
        }

        var visible = coerce('visible');

        if(visible) {
            coerce('label');
            coerce('source');
            coerce('target');
        }

        linkOut._index = i;
        linksOut.push(linkOut);
    }
}


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    dimensionsDefaults(traceIn, traceOut);
    var nodes = nodesDefaults(traceIn, traceOut);
    linksDefaults(traceIn, traceOut);

    handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);

    coerce('domain.x');
    coerce('domain.y');

    if(!Array.isArray(nodes) || !nodes.length) {
    //    traceOut.visible = false;
    }
};
