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
var Color = require('../../components/color');
var Colorscale = require('../../components/colorscale');

var BADNUM = require('../../constants/numerical').BADNUM;
var makeBlank = require('../../lib/geojson_utils').makeBlank;

module.exports = function convert(calcTrace) {
    var trace = calcTrace[0].trace;
    var isVisible = (trace.visible === true && trace._length !== 0);

    var heatmap = {
        layout: {visibility: 'none'},
        paint: {}
    };

    var opts = trace._opts = {
        heatmap: heatmap,
        geojson: makeBlank()
    };

    // early return if not visible or placeholder
    if(!isVisible) return opts;

    var features = [];
    var i;

    var z = trace.z;
    var radius = trace.radius;
    var hasZ = Lib.isArrayOrTypedArray(z) && z.length;
    var hasArrayRadius = Lib.isArrayOrTypedArray(radius);

    for(i = 0; i < calcTrace.length; i++) {
        var cdi = calcTrace[i];
        var lonlat = cdi.lonlat;

        if(lonlat[0] !== BADNUM) {
            var props = {};

            if(hasZ) {
                var zi = cdi.z;
                props.z = zi !== BADNUM ? zi : 0;
            }
            if(hasArrayRadius) {
                props.r = (isNumeric(radius[i]) && radius[i] > 0) ? +radius[i] : 0;
            }

            features.push({
                type: 'Feature',
                geometry: {type: 'Point', coordinates: lonlat},
                properties: props
            });
        }
    }

    var cOpts = Colorscale.extractOpts(trace);
    var scl = cOpts.reversescale ?
        Colorscale.flipScale(cOpts.colorscale) :
        cOpts.colorscale;

    // Add alpha channel to first colorscale step.
    // If not, we would essentially color the entire map.
    // See https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/
    var scl01 = scl[0][1];
    var color0 = Color.opacity(scl01) < 1 ? scl01 : Color.addOpacity(scl01, 0);

    var heatmapColor = [
        'interpolate', ['linear'],
        ['heatmap-density'],
        0, color0
    ];
    for(i = 1; i < scl.length; i++) {
        heatmapColor.push(scl[i][0], scl[i][1]);
    }

    // Those "weights" have to be in [0, 1], we can do this either:
    // - as here using a mapbox-gl expression
    // - or, scale the 'z' property in the feature loop
    var zExp = [
        'interpolate', ['linear'],
        ['get', 'z'],
        cOpts.min, 0,
        cOpts.max, 1
    ];

    Lib.extendFlat(opts.heatmap.paint, {
        'heatmap-weight': hasZ ? zExp : 1 / (cOpts.max - cOpts.min),

        'heatmap-color': heatmapColor,

        'heatmap-radius': hasArrayRadius ?
            {type: 'identity', property: 'r'} :
            trace.radius,

        'heatmap-opacity': trace.opacity
    });

    opts.geojson = {type: 'FeatureCollection', features: features};
    opts.heatmap.layout.visibility = 'visible';

    return opts;
};
