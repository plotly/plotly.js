'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var BADNUM = require('../../constants/numerical').BADNUM;
var geoJsonUtils = require('../../lib/geojson_utils');

var Colorscale = require('../../components/colorscale');
var Drawing = require('../../components/drawing');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');
var subTypes = require('../scatter/subtypes');
var isSupportedFont = require('./constants').isSupportedFont;
var convertTextOpts = require('../../plots/map/convert_text_opts');
var appendArrayPointValue = require('../../components/fx/helpers').appendArrayPointValue;

var NEWLINES = require('../../lib/svg_text_utils').NEWLINES;
var BR_TAG_ALL = require('../../lib/svg_text_utils').BR_TAG_ALL;

module.exports = function convert(gd, calcTrace) {
    var trace = calcTrace[0].trace;

    var isVisible = (trace.visible === true && trace._length !== 0);
    var hasFill = (trace.fill !== 'none');
    var hasLines = subTypes.hasLines(trace);
    var hasMarkers = subTypes.hasMarkers(trace);
    var hasText = subTypes.hasText(trace);
    var hasCircles = (hasMarkers && trace.marker.symbol === 'circle');
    var hasSymbols = (hasMarkers && trace.marker.symbol !== 'circle');
    var hasCluster = trace.cluster && trace.cluster.enabled;

    var fill = initContainer('fill');
    var line = initContainer('line');
    var circle = initContainer('circle');
    var symbol = initContainer('symbol');

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
        var circleOpts = makeCircleOpts(calcTrace);
        circle.geojson = circleOpts.geojson;
        circle.layout.visibility = 'visible';
        if(hasCluster) {
            circle.filter = ['!', ['has', 'point_count']];
            opts.cluster = {
                type: 'circle',
                filter: ['has', 'point_count'],
                layout: {visibility: 'visible'},
                paint: {
                    'circle-color': arrayifyAttribute(trace.cluster.color, trace.cluster.step),
                    'circle-radius': arrayifyAttribute(trace.cluster.size, trace.cluster.step),
                    'circle-opacity': arrayifyAttribute(trace.cluster.opacity, trace.cluster.step),
                },
            };
            opts.clusterCount = {
                type: 'symbol',
                filter: ['has', 'point_count'],
                paint: {},
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': getTextFont(trace),
                    'text-size': 12
                }
            };
        }

        Lib.extendFlat(circle.paint, {
            'circle-color': circleOpts.mcc,
            'circle-radius': circleOpts.mrc,
            'circle-opacity': circleOpts.mo
        });
    }

    if(hasCircles && hasCluster) {
        circle.filter = ['!', ['has', 'point_count']];
    }

    if(hasSymbols || hasText) {
        symbol.geojson = makeSymbolGeoJSON(calcTrace, gd);

        Lib.extendFlat(symbol.layout, {
            visibility: 'visible',
            'icon-image': '{symbol}-15',
            'text-field': '{text}'
        });

        if(hasSymbols) {
            Lib.extendFlat(symbol.layout, {
                'icon-size': trace.marker.size / 10
            });

            if('angle' in trace.marker && trace.marker.angle !== 'auto') {
                Lib.extendFlat(symbol.layout, {
                // unfortunately cant use {angle} do to this issue:
                // https://github.com/mapbox/mapbox-gl-js/issues/873
                    'icon-rotate': {
                        type: 'identity', property: 'angle'
                    },
                    'icon-rotation-alignment': 'map'
                });
            }

            symbol.layout['icon-allow-overlap'] = trace.marker.allowoverlap;

            Lib.extendFlat(symbol.paint, {
                'icon-opacity': trace.opacity * trace.marker.opacity,

                // TODO does not work ??
                'icon-color': trace.marker.color
            });
        }

        if(hasText) {
            var iconSize = (trace.marker || {}).size;
            var textOpts = convertTextOpts(trace.textposition, iconSize);

            // all data-driven below !!

            Lib.extendFlat(symbol.layout, {
                'text-size': trace.textfont.size,
                'text-anchor': textOpts.anchor,
                'text-offset': textOpts.offset,
                'text-font': getTextFont(trace)
            });

            Lib.extendFlat(symbol.paint, {
                'text-color': trace.textfont.color,
                'text-opacity': trace.opacity
            });
        }
    }

    return opts;
};

function initContainer(type) {
    return {
        type: type,
        geojson: geoJsonUtils.makeBlank(),
        layout: { visibility: 'none' },
        filter: null,
        paint: {}
    };
}

function makeCircleOpts(calcTrace) {
    var trace = calcTrace[0].trace;
    var marker = trace.marker;
    var selectedpoints = trace.selectedpoints;
    var arrayColor = Lib.isArrayOrTypedArray(marker.color);
    var arraySize = Lib.isArrayOrTypedArray(marker.size);
    var arrayOpacity = Lib.isArrayOrTypedArray(marker.opacity);
    var i;

    function addTraceOpacity(o) { return trace.opacity * o; }

    function size2radius(s) { return s / 2; }

    var colorFn;
    if(arrayColor) {
        if(Colorscale.hasColorscale(trace, 'marker')) {
            colorFn = Colorscale.makeColorScaleFuncFromTrace(marker);
        } else {
            colorFn = Lib.identity;
        }
    }

    var sizeFn;
    if(arraySize) {
        sizeFn = makeBubbleSizeFn(trace);
    }

    var opacityFn;
    if(arrayOpacity) {
        opacityFn = function(mo) {
            var mo2 = isNumeric(mo) ? +Lib.constrain(mo, 0, 1) : 0;
            return addTraceOpacity(mo2);
        };
    }

    var features = [];
    for(i = 0; i < calcTrace.length; i++) {
        var calcPt = calcTrace[i];
        var lonlat = calcPt.lonlat;

        if(isBADNUM(lonlat)) continue;

        var props = {};
        if(colorFn) props.mcc = calcPt.mcc = colorFn(calcPt.mc);
        if(sizeFn) props.mrc = calcPt.mrc = sizeFn(calcPt.ms);
        if(opacityFn) props.mo = opacityFn(calcPt.mo);
        if(selectedpoints) props.selected = calcPt.selected || 0;

        features.push({
            type: 'Feature',
            id: i + 1,
            geometry: { type: 'Point', coordinates: lonlat },
            properties: props
        });
    }

    var fns;
    if(selectedpoints) {
        fns = Drawing.makeSelectedPointStyleFns(trace);

        for(i = 0; i < features.length; i++) {
            var d = features[i].properties;

            if(fns.selectedOpacityFn) {
                d.mo = addTraceOpacity(fns.selectedOpacityFn(d));
            }
            if(fns.selectedColorFn) {
                d.mcc = fns.selectedColorFn(d);
            }
            if(fns.selectedSizeFn) {
                d.mrc = fns.selectedSizeFn(d);
            }
        }
    }

    return {
        geojson: {type: 'FeatureCollection', features: features},
        mcc: arrayColor || (fns && fns.selectedColorFn) ?
            {type: 'identity', property: 'mcc'} :
            marker.color,
        mrc: arraySize || (fns && fns.selectedSizeFn) ?
            {type: 'identity', property: 'mrc'} :
            size2radius(marker.size),
        mo: arrayOpacity || (fns && fns.selectedOpacityFn) ?
            {type: 'identity', property: 'mo'} :
            addTraceOpacity(marker.opacity)
    };
}

function makeSymbolGeoJSON(calcTrace, gd) {
    var fullLayout = gd._fullLayout;
    var trace = calcTrace[0].trace;

    var marker = trace.marker || {};
    var symbol = marker.symbol;
    var angle = marker.angle;

    var fillSymbol = (symbol !== 'circle') ?
        getFillFunc(symbol) :
        blankFillFunc;

    var fillAngle = (angle !== 'auto') ?
        getFillFunc(angle, true) :
        blankFillFunc;

    var fillText = subTypes.hasText(trace) ?
        getFillFunc(trace.text) :
        blankFillFunc;


    var features = [];

    for(var i = 0; i < calcTrace.length; i++) {
        var calcPt = calcTrace[i];

        if(isBADNUM(calcPt.lonlat)) continue;

        var texttemplate = trace.texttemplate;
        var text;

        if(texttemplate) {
            var tt = Array.isArray(texttemplate) ? (texttemplate[i] || '') : texttemplate;
            var labels = trace._module.formatLabels(calcPt, trace, fullLayout);
            var pointValues = {};
            appendArrayPointValue(pointValues, trace, calcPt.i);
            var meta = trace._meta || {};
            text = Lib.texttemplateString(tt, labels, fullLayout._d3locale, pointValues, calcPt, meta);
        } else {
            text = fillText(i);
        }

        if(text) {
            text = text.replace(NEWLINES, '').replace(BR_TAG_ALL, '\n');
        }

        features.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: calcPt.lonlat
            },
            properties: {
                symbol: fillSymbol(i),
                angle: fillAngle(i),
                text: text
            }
        });
    }

    return {
        type: 'FeatureCollection',
        features: features
    };
}

function getFillFunc(attr, numeric) {
    if(Lib.isArrayOrTypedArray(attr)) {
        if(numeric) {
            return function(i) { return isNumeric(attr[i]) ? +attr[i] : 0; };
        }
        return function(i) { return attr[i]; };
    } else if(attr) {
        return function() { return attr; };
    } else {
        return blankFillFunc;
    }
}

function blankFillFunc() { return ''; }

// only need to check lon (OR lat)
function isBADNUM(lonlat) {
    return lonlat[0] === BADNUM;
}

function arrayifyAttribute(values, step) {
    var newAttribute;
    if(Lib.isArrayOrTypedArray(values) && Lib.isArrayOrTypedArray(step)) {
        newAttribute = ['step', ['get', 'point_count'], values[0]];

        for(var idx = 1; idx < values.length; idx++) {
            newAttribute.push(step[idx - 1], values[idx]);
        }
    } else {
        newAttribute = values;
    }
    return newAttribute;
}

function getTextFont(trace) {
    var font = trace.textfont;
    var family = font.family;
    var style = font.style;
    var weight = font.weight;

    var parts = family.split(' ');
    var isItalic = parts[parts.length - 1] === 'Italic';
    if(isItalic) parts.pop();
    isItalic = isItalic || style === 'italic';

    var str = parts.join(' ');
    if(weight === 'bold' && parts.indexOf('Bold') === -1) {
        str += ' Bold';
    } else if(weight <= 1000) { // numeric font-weight
        // See supportedFonts

        if(parts[0] === 'Metropolis') {
            str = 'Metropolis';
            if(weight > 850) str += ' Black';
            else if(weight > 750) str += ' Extra Bold';
            else if(weight > 650) str += ' Bold';
            else if(weight > 550) str += ' Semi Bold';
            else if(weight > 450) str += ' Medium';
            else if(weight > 350) str += ' Regular';
            else if(weight > 250) str += ' Light';
            else if(weight > 150) str += ' Extra Light';
            else str += ' Thin';
        } else if(parts.slice(0, 2).join(' ') === 'Open Sans') {
            str = 'Open Sans';
            if(weight > 750) str += ' Extrabold';
            else if(weight > 650) str += ' Bold';
            else if(weight > 550) str += ' Semibold';
            else if(weight > 350) str += ' Regular';
            else str += ' Light';
        } else if(parts.slice(0, 3).join(' ') === 'Klokantech Noto Sans') {
            str = 'Klokantech Noto Sans';
            if(parts[3] === 'CJK') str += ' CJK';
            str += (weight > 500) ? ' Bold' : ' Regular';
        }
    }

    if(isItalic) str += ' Italic';

    if(str === 'Open Sans Regular Italic') str = 'Open Sans Italic';
    else if(str === 'Open Sans Regular Bold') str = 'Open Sans Bold';
    else if(str === 'Open Sans Regular Bold Italic') str = 'Open Sans Bold Italic';
    else if(str === 'Klokantech Noto Sans Regular Italic') str = 'Klokantech Noto Sans Italic';

    // Ensure the result is a supported font
    if(!isSupportedFont(str)) {
        str = family;
    }

    var textFont = str.split(', ');
    return textFont;
}
