/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createGeo = require('./geo');
var getSubplotCalcData = require('../../plots/get_data').getSubplotCalcData;
var counterRegex = require('../../lib').counterRegex;

var GEO = 'geo';

exports.name = GEO;

exports.attr = GEO;

exports.idRoot = GEO;

exports.idRegex = exports.attrRegex = counterRegex(GEO);

exports.attributes = require('./layout/attributes');

exports.layoutAttributes = require('./layout/layout_attributes');

exports.supplyLayoutDefaults = require('./layout/defaults');

exports.plot = function plotGeo(gd) {
    var fullLayout = gd._fullLayout;
    var calcData = gd.calcdata;
    var geoIds = fullLayout._subplots[GEO];

    /**
     * If 'plotly-geo-assets.js' is not included,
     * initialize object to keep reference to every loaded topojson
     */
    if(window.PlotlyGeoAssets === undefined) {
        window.PlotlyGeoAssets = {topojson: {}};
    }

    for(var i = 0; i < geoIds.length; i++) {
        var geoId = geoIds[i];
        var geoCalcData = getSubplotCalcData(calcData, GEO, geoId);
        var geoLayout = fullLayout[geoId];
        var geo = geoLayout._subplot;

        if(!geo) {
            geo = createGeo({
                id: geoId,
                graphDiv: gd,
                container: fullLayout._geolayer.node(),
                topojsonURL: gd._context.topojsonURL,
                staticPlot: gd._context.staticPlot
            });

            fullLayout[geoId]._subplot = geo;
        }

        geo.plot(geoCalcData, fullLayout, gd._promises);
    }
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var oldGeoKeys = oldFullLayout._subplots[GEO] || [];

    for(var i = 0; i < oldGeoKeys.length; i++) {
        var oldGeoKey = oldGeoKeys[i];
        var oldGeo = oldFullLayout[oldGeoKey]._subplot;

        if(!newFullLayout[oldGeoKey] && !!oldGeo) {
            oldGeo.framework.remove();
            oldGeo.clipDef.remove();
        }
    }
};

exports.updateFx = function(fullLayout) {
    var subplotIds = fullLayout._subplots[GEO];

    for(var i = 0; i < subplotIds.length; i++) {
        var subplotLayout = fullLayout[subplotIds[i]];
        var subplotObj = subplotLayout._subplot;
        subplotObj.updateFx(fullLayout, subplotLayout);
    }
};
