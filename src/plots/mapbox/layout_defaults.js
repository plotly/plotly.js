/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var handleSubplotDefaults = require('../subplot_defaults');
var layoutAttributes = require('./layout_attributes');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        type: 'mapbox',
        attributes: layoutAttributes,
        handleDefaults: handleDefaults,
        partition: 'y'
    });
};

function handleDefaults(containerIn, containerOut, coerce) {
    coerce('accesstoken');
    coerce('style');
    coerce('center.lon');
    coerce('center.lat');
    coerce('zoom');
    coerce('bearing');
    coerce('pitch');

    handleLayerDefaults(containerIn, containerOut);

    // copy ref to input container to update 'center' and 'zoom' on map move
    containerOut._input = containerIn;
}

function handleLayerDefaults(containerIn, containerOut) {
    var layersIn = containerIn.layers || [],
        layersOut = containerOut.layers = [];

    var layerIn, layerOut;

    function coerce(attr, dflt) {
        return Lib.coerce(layerIn, layerOut, layoutAttributes.layers, attr, dflt);
    }

    for(var i = 0; i < layersIn.length; i++) {
        layerIn = layersIn[i];
        layerOut = {};

        if(!Lib.isPlainObject(layerIn)) continue;

        var sourceType = coerce('sourcetype');
        coerce('source');

        if(sourceType === 'vector') coerce('sourcelayer');

        // maybe add smart default based off GeoJSON geometry?
        var type = coerce('type');

        coerce('below');
        coerce('color');
        coerce('opacity');

        if(type === 'circle') {
            coerce('circle.radius');
        }

        if(type === 'line') {
            coerce('line.width');
        }

        if(type === 'fill') {
            coerce('fill.outlinecolor');
        }

        if(type === 'symbol') {
            coerce('symbol.icon');
            coerce('symbol.iconsize');

            coerce('symbol.text');
            Lib.coerceFont(coerce, 'symbol.textfont');
            coerce('symbol.textposition');
        }

        layerOut._index = i;
        layersOut.push(layerOut);
    }
}
