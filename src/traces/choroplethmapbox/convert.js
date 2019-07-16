/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var turfArea = require('@turf/area');
var turfCentroid = require('@turf/centroid');

var Lib = require('../../lib');
var Colorscale = require('../../components/colorscale');
var Drawing = require('../../components/drawing');

var makeBlank = require('../../lib/geojson_utils').makeBlank;
var feature2polygons = require('../choropleth/plot').feature2polygons;

/* N.B.
 *
 * We fetch the GeoJSON files "ourselves" (during
 * mapbox.prototype.fetchMapData) where they are stored in a global object
 * named `PlotlyGeoAssets` (same as for topojson files in `geo` subplots).
 *
 * Mapbox does allow using URLs as geojson sources, but does NOT allow filtering
 * features by feature `id` that are not numbers (more info in:
 * https://github.com/mapbox/mapbox-gl-js/issues/8088).
 */

function convert(calcTrace) {
    var trace = calcTrace[0].trace;
    var isVisible = trace.visible === true && trace._length !== 0;

    var fill = {
        layout: {visibility: 'none'},
        paint: {}
    };

    var line = {
        layout: {visibility: 'none'},
        paint: {}
    };

    var opts = trace._opts = {
        fill: fill,
        line: line,
        geojson: makeBlank()
    };

    if(!isVisible) return opts;

    var geojsonIn = typeof trace.geojson === 'string' ?
        (window.PlotlyGeoAssets || {})[trace.geojson] :
        trace.geojson;

    // This should not happen, but just in case something goes
    // really wrong when fetching the GeoJSON
    if(!Lib.isPlainObject(geojsonIn)) {
        Lib.error('Oops ... something when wrong when fetching ' + trace.geojson);
        return opts;
    }

    var lookup = {};
    var featuresOut = [];
    var i;

    for(i = 0; i < calcTrace.length; i++) {
        var cdi = calcTrace[i];
        if(cdi.loc) lookup[cdi.loc] = cdi;
    }

    var sclFunc = Colorscale.makeColorScaleFuncFromTrace(trace);
    var marker = trace.marker;
    var markerLine = marker.line || {};

    var opacityFn;
    if(Lib.isArrayOrTypedArray(marker.opacity)) {
        opacityFn = function(d) {
            var mo = d.mo;
            return isNumeric(mo) ? +Lib.constrain(mo, 0, 1) : 0;
        };
    }

    var lineColorFn;
    if(Lib.isArrayOrTypedArray(markerLine.color)) {
        lineColorFn = function(d) { return d.mlc; };
    }

    var lineWidthFn;
    if(Lib.isArrayOrTypedArray(markerLine.width)) {
        lineWidthFn = function(d) { return d.mlw; };
    }

    function appendFeature(fIn) {
        var cdi = lookup[fIn.id];

        if(cdi) {
            var geometry = fIn.geometry;

            if(geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
                var props = {fc: sclFunc(cdi.z)};

                if(opacityFn) props.mo = opacityFn(cdi);
                if(lineColorFn) props.mlc = lineColorFn(cdi);
                if(lineWidthFn) props.mlw = lineWidthFn(cdi);

                var fOut = {
                    type: 'Feature',
                    geometry: geometry,
                    properties: props
                };

                cdi._polygons = feature2polygons(fOut);
                cdi.ct = findCentroid(fOut);
                cdi.fIn = fIn;
                cdi.fOut = fOut;
                featuresOut.push(fOut);
            } else {
                Lib.log([
                    'Location with id', cdi.loc, 'does not have a valid GeoJSON geometry,',
                    'choroplethmapbox traces only support *Polygon* and *MultiPolygon* geometries.'
                ].join(' '));
            }
        }

        // remove key from lookup, so that we can track (if any)
        // the locations that did not have a corresponding GeoJSON feature
        delete lookup[fIn.id];
    }

    switch(geojsonIn.type) {
        case 'FeatureCollection':
            var featuresIn = geojsonIn.features;
            for(i = 0; i < featuresIn.length; i++) {
                appendFeature(featuresIn[i]);
            }
            break;
        case 'Feature':
            appendFeature(geojsonIn);
            break;
        default:
            Lib.warn([
                'Invalid GeoJSON type', (geojsonIn.type || 'none') + ',',
                'choroplethmapbox traces only support *FeatureCollection* and *Feature* types.'
            ].join(' '));
            return opts;
    }

    for(var loc in lookup) {
        Lib.log('Location with id ' + loc + ' does not have a matching feature');
    }

    var opacitySetting = opacityFn ?
        {type: 'identity', property: 'mo'} :
        marker.opacity;

    Lib.extendFlat(fill.paint, {
        'fill-color': {type: 'identity', property: 'fc'},
        'fill-opacity': opacitySetting
    });

    Lib.extendFlat(line.paint, {
        'line-color': lineColorFn ?
            {type: 'identity', property: 'mlc'} :
            markerLine.color,
        'line-width': lineWidthFn ?
            {type: 'identity', property: 'mlw'} :
            markerLine.width,
        'line-opacity': opacitySetting
    });

    fill.layout.visibility = 'visible';
    line.layout.visibility = 'visible';

    opts.geojson = {type: 'FeatureCollection', features: featuresOut};

    convertOnSelect(calcTrace);

    return opts;
}

function convertOnSelect(calcTrace) {
    var trace = calcTrace[0].trace;
    var opts = trace._opts;
    var opacitySetting;

    if(trace.selectedpoints) {
        var fns = Drawing.makeSelectedPointStyleFns(trace);

        for(var i = 0; i < calcTrace.length; i++) {
            var cdi = calcTrace[i];
            if(cdi.fOut) {
                cdi.fOut.properties.mo2 = fns.selectedOpacityFn(cdi);
            }
        }

        opacitySetting = {type: 'identity', property: 'mo2'};
    } else {
        opacitySetting = Lib.isArrayOrTypedArray(trace.marker.opacity) ?
            {type: 'identity', property: 'mo'} :
            trace.marker.opacity;
    }

    Lib.extendFlat(opts.fill.paint, {'fill-opacity': opacitySetting});
    Lib.extendFlat(opts.line.paint, {'line-opacity': opacitySetting});

    return opts;
}

// TODO this find the centroid of the polygon of maxArea
// (just like we currently do for geo choropleth polygons),
// maybe instead it would make more sense to compute the centroid
// of each polygon and consider those on hover/select
function findCentroid(feature) {
    var geometry = feature.geometry;
    var poly;

    if(geometry.type === 'MultiPolygon') {
        var coords = geometry.coordinates;
        var maxArea = 0;

        for(var i = 0; i < coords.length; i++) {
            var polyi = {type: 'Polygon', coordinates: coords[i]};
            var area = turfArea.default(polyi);
            if(area > maxArea) {
                maxArea = area;
                poly = polyi;
            }
        }
    } else {
        poly = geometry;
    }

    return turfCentroid.default(poly).geometry.coordinates;
}

module.exports = {
    convert: convert,
    convertOnSelect: convertOnSelect
};
