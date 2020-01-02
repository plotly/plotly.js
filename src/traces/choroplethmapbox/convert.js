/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Colorscale = require('../../components/colorscale');
var Drawing = require('../../components/drawing');

var makeBlank = require('../../lib/geojson_utils').makeBlank;
var geoUtils = require('../../lib/geo_location_utils');

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

    var features = geoUtils.extractTraceFeature(calcTrace);

    if(!features) return opts;

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

    for(var i = 0; i < calcTrace.length; i++) {
        var cdi = calcTrace[i];
        var fOut = cdi.fOut;

        if(fOut) {
            var props = fOut.properties;
            props.fc = sclFunc(cdi.z);
            if(opacityFn) props.mo = opacityFn(cdi);
            if(lineColorFn) props.mlc = lineColorFn(cdi);
            if(lineWidthFn) props.mlw = lineWidthFn(cdi);
            cdi.ct = props.ct;
            cdi._polygons = geoUtils.feature2polygons(fOut);
        }
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

    opts.geojson = {type: 'FeatureCollection', features: features};

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

module.exports = {
    convert: convert,
    convertOnSelect: convertOnSelect
};
