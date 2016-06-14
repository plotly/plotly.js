/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var mapboxgl = require('mapbox-gl');

var Plots = require('../plots');
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');

var createMapbox = require('./mapbox');
var constants = require('./constants');


exports.name = 'mapbox';

exports.attr = 'subplot';

exports.idRoot = 'mapbox';

exports.idRegex = /^mapbox([2-9]|[1-9][0-9]+)?$/;

exports.attrRegex = /^mapbox([2-9]|[1-9][0-9]+)?$/;

exports.attributes = {
    subplot: {
        valType: 'subplotid',
        role: 'info',
        dflt: 'mapbox',
        description: [
            'Sets a reference between this trace\'s data coordinates and',
            'a mapbox subplot.',
            'If *mapbox* (the default value), the data refer to `layout.mapbox`.',
            'If *mapbox2*, the data refer to `layout.mapbox2`, and so on.'
        ].join(' ')
    }
};

exports.layoutAttributes = require('./layout_attributes');

exports.supplyLayoutDefaults = require('./layout_defaults');

exports.plot = function plotMapbox(gd) {

    if(!gd._context.mapboxAccessToken) {
        throw new Error(constants.noAccessTokenErrorMsg);
    }
    else {
        mapboxgl.accessToken = gd._context.mapboxAccessToken;
    }

    var fullLayout = gd._fullLayout,
        calcData = gd.calcdata,
        mapboxIds = Plots.getSubplotIds(fullLayout, 'mapbox');

    for(var i = 0; i < mapboxIds.length; i++) {
        var id = mapboxIds[i],
            subplotCalcData = getSubplotCalcData(calcData, id),
            mapbox = fullLayout[id]._subplot;

        if(!mapbox) {
            mapbox = createMapbox({
                gd: gd,
                container: fullLayout._glcontainer.node(),
                id: id,
                fullLayout: fullLayout,
                staticPlot: gd._context.staticPlot
            });

            fullLayout[id]._subplot = mapbox;
        }

        mapbox.plot(subplotCalcData, fullLayout, gd._promises);
    }
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var oldMapboxKeys = Plots.getSubplotIds(oldFullLayout, 'mapbox');

    for(var i = 0; i < oldMapboxKeys.length; i++) {
        var oldMapboxKey = oldMapboxKeys[i];

        if(!newFullLayout[oldMapboxKey] && !!oldFullLayout[oldMapboxKey]._subplot) {
            oldFullLayout[oldMapboxKey]._subplot.destroy();
        }
    }
};

exports.toSVG = function(gd) {
    var fullLayout = gd._fullLayout,
        subplotIds = Plots.getSubplotIds(fullLayout, 'mapbox'),
        size = fullLayout._size;

    for(var i = 0; i < subplotIds.length; i++) {
        var opts = fullLayout[subplotIds[i]],
            domain = opts.domain,
            mapbox = opts._subplot;

        var imageData = mapbox.toImage('png');
        var image = fullLayout._glimages.append('svg:image');

        image.attr({
            xmlns: xmlnsNamespaces.svg,
            'xlink:href': imageData,
            x: size.l + size.w * domain.x[0],
            y: size.t + size.h * (1 - domain.y[1]),
            width: size.w * (domain.x[1] - domain.x[0]),
            height: size.h * (domain.y[1] - domain.y[0]),
            preserveAspectRatio: 'none'
        });

        mapbox.destroy();
    }
};

function getSubplotCalcData(calcData, id) {
    var subplotCalcData = [];

    for(var i = 0; i < calcData.length; i++) {
        var calcTrace = calcData[i],
            trace = calcTrace[0].trace;

        if(trace.subplot === id) subplotCalcData.push(calcTrace);
    }

    return subplotCalcData;
}
