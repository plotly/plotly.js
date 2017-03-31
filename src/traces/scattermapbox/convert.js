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

var COLOR_PROP = 'mcc';
var SIZE_PROP = 'mrc';

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

    // early return if not visible
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
        circle.geojson = makeCircleGeoJSON(calcTrace);
        circle.layout.visibility = 'visible';

        var circleColor = Array.isArray(trace.marker.color) ?
            { type: 'identity', property: COLOR_PROP } :
            trace.marker.color;
        var circleRadius = Array.isArray(trace.marker.size) ?
            { type: 'identity', property: SIZE_PROP } :
            trace.marker.size / 2;

        Lib.extendFlat(circle.paint, {
            'circle-opacity': trace.opacity * trace.marker.opacity,
            'circle-color': circleColor,
            'circle-radius': circleRadius
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

function makeCircleGeoJSON(calcTrace) {
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

    var features = [];

    for(var i = 0; i < calcTrace.length; i++) {
        var calcPt = calcTrace[i];

        if(isBADNUM(calcPt.lonlat)) continue;

        var props = {};
        if(colorFn) props[COLOR_PROP] = colorFn(calcPt.mc);
        if(sizeFn) props[SIZE_PROP] = sizeFn(calcPt.ms);

        features.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: calcPt.lonlat
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
    var marker = trace.marker || {};
    var symbol = marker.symbol;
    var text = trace.text;

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

function isBADNUM(lonlat) {
    return lonlat[0] === BADNUM || lonlat[1] === BADNUM;
}

function getFillFunc(attr) {
    if(Array.isArray(attr)) {
        return function(v) { return v; };
    } else if(attr) {
        return function() { return attr; };
    } else {
        return blankFillFunc;
    }
}

function blankFillFunc() { return ''; }
