/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var BADNUM = require('../../constants/numerical').BADNUM;
var geoJsonUtils = require('../../lib/geojson_utils');

var Colorscale = require('../../components/colorscale');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');
var subTypes = require('../scatter/subtypes');
var convertTextOpts = require('../../plots/mapbox/convert_text_opts');

var COLOR_PROP = 'circle-color';
var SIZE_PROP = 'circle-radius';


module.exports = function convert(calcTrace) {
    var trace = calcTrace[0].trace;

    var isVisible = (trace.visible === true),
        hasFill = (trace.fill !== 'none'),
        hasLines = subTypes.hasLines(trace),
        hasMarkers = subTypes.hasMarkers(trace),
        hasText = subTypes.hasText(trace),
        hasCircles = (hasMarkers && trace.marker.symbol === 'circle'),
        hasSymbols = (hasMarkers && trace.marker.symbol !== 'circle');

    var fill = initContainer(),
        line = initContainer(),
        circle = initContainer(),
        symbol = initContainer();

    var opts = {
        fill: fill,
        line: line,
        circle: circle,
        symbol: symbol
    };

    // early return if not visible or placeholder
    if(!isVisible) return opts;

    // fill layer and line layer use the same coords
    var lineCoords;
    if(hasFill || hasLines) {
        lineCoords = geoJsonUtils.calcTraceToLineCoords(calcTrace);
    }

    if(hasFill) {
        fill.geojson = geoJsonUtils.makePolygon(lineCoords);
        fill.layout.visibility = 'visible';

        Lib.extendFlat(fill.paint, {
            'fill-color': trace.fillcolor
        });
    }

    if(hasLines) {
        line.geojson = geoJsonUtils.makeLine(lineCoords);
        line.layout.visibility = 'visible';

        Lib.extendFlat(line.paint, {
            'line-width': trace.line.width,
            'line-color': trace.line.color,
            'line-opacity': trace.opacity
        });

        // TODO convert line.dash into line-dasharray
    }

    if(hasCircles) {
        var hash = {};
        hash[COLOR_PROP] = {};
        hash[SIZE_PROP] = {};

        circle.geojson = makeCircleGeoJSON(calcTrace, hash);
        circle.layout.visibility = 'visible';

        Lib.extendFlat(circle.paint, {
            'circle-opacity': trace.opacity * trace.marker.opacity,
            'circle-color': calcCircleColor(trace, hash),
            'circle-radius': calcCircleRadius(trace, hash)
        });
    }

    if(hasSymbols || hasText) {
        symbol.geojson = makeSymbolGeoJSON(calcTrace);

        Lib.extendFlat(symbol.layout, {
            visibility: 'visible',
            'icon-image': '{symbol}-15',
            'text-field': '{text}'
        });

        if(hasSymbols) {
            Lib.extendFlat(symbol.layout, {
                'icon-size': trace.marker.size / 10
            });

            Lib.extendFlat(symbol.paint, {
                'icon-opacity': trace.opacity * trace.marker.opacity,

                // TODO does not work ??
                'icon-color': trace.marker.color
            });
        }

        if(hasText) {
            var iconSize = (trace.marker || {}).size,
                textOpts = convertTextOpts(trace.textposition, iconSize);

            Lib.extendFlat(symbol.layout, {
                'text-size': trace.textfont.size,
                'text-anchor': textOpts.anchor,
                'text-offset': textOpts.offset

                // TODO font family
                // 'text-font': symbol.textfont.family.split(', '),
            });

            Lib.extendFlat(symbol.paint, {
                'text-color': trace.textfont.color,
                'text-opacity': trace.opacity
            });
        }
    }

    return opts;
};

function initContainer() {
    return {
        geojson: geoJsonUtils.makeBlank(),
        layout: { visibility: 'none' },
        paint: {}
    };
}

// N.B. `hash` is mutated here
//
// The `hash` object contains mapping between values
// (e.g. calculated marker.size and marker.color items)
// and their index in the input arrayOk attributes.
//
// GeoJSON features have their 'data-driven' properties set to
// the index of the first value found in the data.
//
// The `hash` object is then converted to mapbox `stops` arrays
// mapping index to value.
//
// The solution prove to be more robust than trying to generate
// `stops` arrays from scale functions.
//
// TODO axe this when we bump mapbox-gl and rewrite this using
// "identity" property functions.
// See https://github.com/plotly/plotly.js/pull/1543
//
function makeCircleGeoJSON(calcTrace, hash) {
    var trace = calcTrace[0].trace;
    var marker = trace.marker;

    var colorFn;
    if(Colorscale.hasColorscale(trace, 'marker')) {
        colorFn = Colorscale.makeColorScaleFunc(
             Colorscale.extractScale(marker.colorscale, marker.cmin, marker.cmax)
         );
    } else if(Array.isArray(marker.color)) {
        colorFn = Lib.identity;
    }

    var sizeFn;
    if(subTypes.isBubble(trace)) {
        sizeFn = makeBubbleSizeFn(trace);
    } else if(Array.isArray(marker.size)) {
        sizeFn = Lib.identity;
    }

    // Translate vals in trace arrayOk containers
    // into a val-to-index hash object
    function translate(props, key, val, index) {
        if(hash[key][val] === undefined) hash[key][val] = index;

        props[key] = hash[key][val];
    }

    var features = [];

    for(var i = 0; i < calcTrace.length; i++) {
        var calcPt = calcTrace[i];
        var lonlat = calcPt.lonlat;

        if(isBADNUM(lonlat)) continue;

        var props = {};
        if(colorFn) {
            var mcc = calcPt.mcc = colorFn(calcPt.mc);
            translate(props, COLOR_PROP, mcc, i);
        }
        if(sizeFn) translate(props, SIZE_PROP, sizeFn(calcPt.ms), i);

        features.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: lonlat
            },
            properties: props
        });
    }

    return {
        type: 'FeatureCollection',
        features: features
    };
}

function makeSymbolGeoJSON(calcTrace) {
    var trace = calcTrace[0].trace;

    var marker = trace.marker || {},
        symbol = marker.symbol,
        text = trace.text;

    var fillSymbol = (symbol !== 'circle') ?
            getFillFunc(symbol) :
            blankFillFunc;

    var fillText = subTypes.hasText(trace) ?
            getFillFunc(text) :
            blankFillFunc;

    var features = [];

    for(var i = 0; i < calcTrace.length; i++) {
        var calcPt = calcTrace[i];

        if(isBADNUM(calcPt.lonlat)) continue;

        features.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: calcPt.lonlat
            },
            properties: {
                symbol: fillSymbol(calcPt.mx),
                text: fillText(calcPt.tx)
            }
        });
    }

    return {
        type: 'FeatureCollection',
        features: features
    };
}

function calcCircleColor(trace, hash) {
    var marker = trace.marker,
        out;

    if(Array.isArray(marker.color)) {
        var vals = Object.keys(hash[COLOR_PROP]),
            stops = [];

        for(var i = 0; i < vals.length; i++) {
            var val = vals[i];

            stops.push([ hash[COLOR_PROP][val], val ]);
        }

        out = {
            property: COLOR_PROP,
            stops: stops
        };

    }
    else {
        out = marker.color;
    }

    return out;
}

function calcCircleRadius(trace, hash) {
    var marker = trace.marker,
        out;

    if(Array.isArray(marker.size)) {
        var vals = Object.keys(hash[SIZE_PROP]),
            stops = [];

        for(var i = 0; i < vals.length; i++) {
            var val = vals[i];

            stops.push([ hash[SIZE_PROP][val], +val ]);
        }

        // stops indices must be sorted
        stops.sort(function(a, b) {
            return a[0] - b[0];
        });

        out = {
            property: SIZE_PROP,
            stops: stops
        };
    }
    else {
        out = marker.size / 2;
    }

    return out;
}

function getFillFunc(attr) {
    if(Array.isArray(attr)) {
        return function(v) { return v; };
    }
    else if(attr) {
        return function() { return attr; };
    }
    else {
        return blankFillFunc;
    }
}

function blankFillFunc() { return ''; }

// only need to check lon (OR lat)
function isBADNUM(lonlat) {
    return lonlat[0] === BADNUM;
}
