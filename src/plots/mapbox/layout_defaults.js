/**
* Copyright 2012-2016, Plotly, Inc.
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
        layerIn = layersIn[i] || {};
        layerOut = {};

        var sourceType = coerce('sourcetype');
        coerce('source');

        if(sourceType === 'vector') coerce('sourcelayer');

        // maybe add smart default based off GeoJSON geometry
        var type = coerce('type');

        var dfltColor;

        if(type === 'circle') {
            dfltColor = (layerIn.line || {}).color || (layerIn.fill || {}).color;

            coerce('circle.color', dfltColor);
            coerce('circle.radius');
        }

        if(type === 'line') {
            dfltColor = (layerIn.circle || {}).color || (layerIn.fill || {}).color;

            coerce('line.color', dfltColor);
            coerce('line.width');
        }

        if(type === 'fill') {
            dfltColor = (layerIn.circle || {}).color || (layerIn.line || {}).color;

            coerce('fill.color', dfltColor);
            coerce('fill.outlinecolor', dfltColor);
        }

        coerce('below');
        coerce('opacity');

        layersOut.push(layerOut);
    }
}
