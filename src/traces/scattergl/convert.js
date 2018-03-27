/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var svgSdf = require('svg-path-sdf');
var rgba = require('color-normalize');

var Registry = require('../../registry');
var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
var AxisIDs = require('../../plots/cartesian/axis_ids');

var formatColor = require('../../lib/gl_format_color');
var subTypes = require('../scatter/subtypes');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');

var constants = require('./constants');
var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

function convertStyle(gd, trace) {
    var i;

    var opts = {
        marker: null,
        line: null,
        fill: null,
        errorX: null,
        errorY: null,
        selected: null,
        unselected: null
    };

    if(trace.visible !== true) return opts;

    if(subTypes.hasMarkers(trace)) {
        opts.marker = convertMarkerStyle(trace);
        opts.selected = convertMarkerSelection(trace, trace.selected);
        opts.unselected = convertMarkerSelection(trace, trace.unselected);

        if(!trace.unselected && Array.isArray(trace.marker.opacity)) {
            var mo = trace.marker.opacity;
            opts.unselected.opacity = new Array(mo.length);
            for(i = 0; i < mo.length; i++) {
                opts.unselected.opacity[i] = DESELECTDIM * mo[i];
            }
        }
    }

    if(subTypes.hasLines(trace)) {
        opts.line = {
            overlay: true,
            thickness: trace.line.width,
            color: trace.line.color,
            opacity: trace.opacity
        };

        var dashes = (constants.DASHES[trace.line.dash] || [1]).slice();
        for(i = 0; i < dashes.length; ++i) {
            dashes[i] *= trace.line.width;
        }
        opts.line.dashes = dashes;
    }

    if(trace.error_x && trace.error_x.visible) {
        opts.errorX = convertErrorBarStyle(trace, trace.error_x);
    }

    if(trace.error_y && trace.error_y.visible) {
        opts.errorY = convertErrorBarStyle(trace, trace.error_y);
    }

    if(!!trace.fill && trace.fill !== 'none') {
        opts.fill = {
            closed: true,
            fill: trace.fillcolor,
            thickness: 0
        };
    }

    return opts;
}

function convertMarkerStyle(trace) {
    var count = trace._length || (trace.dimensions || [])._length;
    var optsIn = trace.marker;
    var optsOut = {};
    var i;

    var multiSymbol = Array.isArray(optsIn.symbol);
    var multiColor = Lib.isArrayOrTypedArray(optsIn.color);
    var multiLineColor = Lib.isArrayOrTypedArray(optsIn.line.color);
    var multiOpacity = Lib.isArrayOrTypedArray(optsIn.opacity);
    var multiSize = Lib.isArrayOrTypedArray(optsIn.size);
    var multiLineWidth = Lib.isArrayOrTypedArray(optsIn.line.width);

    var isOpen;
    if(!multiSymbol) isOpen = constants.OPEN_RE.test(optsIn.symbol);

    // prepare colors
    if(multiSymbol || multiColor || multiLineColor || multiOpacity) {
        optsOut.colors = new Array(count);
        optsOut.borderColors = new Array(count);

        var colors = formatColor(optsIn, optsIn.opacity, count);
        var borderColors = formatColor(optsIn.line, optsIn.opacity, count);

        if(!Array.isArray(borderColors[0])) {
            var borderColor = borderColors;
            borderColors = Array(count);
            for(i = 0; i < count; i++) {
                borderColors[i] = borderColor;
            }
        }
        if(!Array.isArray(colors[0])) {
            var color = colors;
            colors = Array(count);
            for(i = 0; i < count; i++) {
                colors[i] = color;
            }
        }

        optsOut.colors = colors;
        optsOut.borderColors = borderColors;

        for(i = 0; i < count; i++) {
            if(multiSymbol) {
                var symbol = optsIn.symbol[i];
                isOpen = constants.OPEN_RE.test(symbol);
            }
            if(isOpen) {
                borderColors[i] = colors[i].slice();
                colors[i] = colors[i].slice();
                colors[i][3] = 0;
            }
        }

        optsOut.opacity = trace.opacity;
    } else {
        if(isOpen) {
            optsOut.color = rgba(optsIn.color, 'uint8');
            optsOut.color[3] = 0;
            optsOut.borderColor = rgba(optsIn.color, 'uint8');
        } else {
            optsOut.color = rgba(optsIn.color, 'uint8');
            optsOut.borderColor = rgba(optsIn.line.color, 'uint8');
        }

        optsOut.opacity = trace.opacity * optsIn.opacity;
    }

    // prepare symbols
    if(multiSymbol) {
        optsOut.markers = new Array(count);
        for(i = 0; i < count; i++) {
            optsOut.markers[i] = getSymbolSdf(optsIn.symbol[i]);
        }
    } else {
        optsOut.marker = getSymbolSdf(optsIn.symbol);
    }

    // prepare sizes
    var markerSizeFunc = makeBubbleSizeFn(trace);
    var s;

    if(multiSize || multiLineWidth) {
        var sizes = optsOut.sizes = new Array(count);
        var borderSizes = optsOut.borderSizes = new Array(count);
        var sizeTotal = 0;
        var sizeAvg;

        if(multiSize) {
            for(i = 0; i < count; i++) {
                sizes[i] = markerSizeFunc(optsIn.size[i]);
                sizeTotal += sizes[i];
            }
            sizeAvg = sizeTotal / count;
        } else {
            s = markerSizeFunc(optsIn.size);
            for(i = 0; i < count; i++) {
                sizes[i] = s;
            }
        }

        // See  https://github.com/plotly/plotly.js/pull/1781#discussion_r121820798
        if(multiLineWidth) {
            for(i = 0; i < count; i++) {
                borderSizes[i] = markerSizeFunc(optsIn.line.width[i]);
            }
        } else {
            s = markerSizeFunc(optsIn.line.width);
            for(i = 0; i < count; i++) {
                borderSizes[i] = s;
            }
        }

        optsOut.sizeAvg = sizeAvg;
    } else {
        optsOut.size = markerSizeFunc(optsIn && optsIn.size || 10);
        optsOut.borderSizes = markerSizeFunc(optsIn.line.width);
    }

    return optsOut;
}

function convertMarkerSelection(trace, target) {
    var optsIn = trace.marker;
    var optsOut = {};

    if(!target) return optsOut;

    if(target.marker && target.marker.symbol) {
        optsOut = convertMarkerStyle(Lib.extendFlat({}, optsIn, target.marker));
    } else if(target.marker) {
        if(target.marker.size) optsOut.sizes = target.marker.size;
        if(target.marker.color) optsOut.colors = target.marker.color;
        if(target.marker.opacity !== undefined) optsOut.opacity = target.marker.opacity;
    }

    return optsOut;
}

function convertErrorBarStyle(trace, target) {
    var optsOut = {
        capSize: target.width * 2,
        lineWidth: target.thickness,
        color: target.color
    };

    if(target.copy_ystyle) {
        optsOut = trace.error_y;
    }

    return optsOut;
}

var SYMBOL_SDF_SIZE = constants.SYMBOL_SDF_SIZE;
var SYMBOL_SIZE = constants.SYMBOL_SIZE;
var SYMBOL_STROKE = constants.SYMBOL_STROKE;
var SYMBOL_SDF = {};
var SYMBOL_SVG_CIRCLE = Drawing.symbolFuncs[0](SYMBOL_SIZE * 0.05);

function getSymbolSdf(symbol) {
    if(symbol === 'circle') return null;

    var symbolPath, symbolSdf;
    var symbolNumber = Drawing.symbolNumber(symbol);
    var symbolFunc = Drawing.symbolFuncs[symbolNumber % 100];
    var symbolNoDot = !!Drawing.symbolNoDot[symbolNumber % 100];
    var symbolNoFill = !!Drawing.symbolNoFill[symbolNumber % 100];

    var isDot = constants.DOT_RE.test(symbol);

    // get symbol sdf from cache or generate it
    if(SYMBOL_SDF[symbol]) return SYMBOL_SDF[symbol];

    if(isDot && !symbolNoDot) {
        symbolPath = symbolFunc(SYMBOL_SIZE * 1.1) + SYMBOL_SVG_CIRCLE;
    }
    else {
        symbolPath = symbolFunc(SYMBOL_SIZE);
    }

    symbolSdf = svgSdf(symbolPath, {
        w: SYMBOL_SDF_SIZE,
        h: SYMBOL_SDF_SIZE,
        viewBox: [-SYMBOL_SIZE, -SYMBOL_SIZE, SYMBOL_SIZE, SYMBOL_SIZE],
        stroke: symbolNoFill ? SYMBOL_STROKE : -SYMBOL_STROKE
    });
    SYMBOL_SDF[symbol] = symbolSdf;

    return symbolSdf || null;
}

function convertLinePositions(gd, trace, positions) {
    var count = positions.length / 2;
    var linePositions;
    var i;

    if(subTypes.hasLines(trace) && count) {
        if(trace.line.shape === 'hv') {
            linePositions = [];
            for(i = 0; i < count - 1; i++) {
                if(isNaN(positions[i * 2]) || isNaN(positions[i * 2 + 1])) {
                    linePositions.push(NaN);
                    linePositions.push(NaN);
                    linePositions.push(NaN);
                    linePositions.push(NaN);
                }
                else {
                    linePositions.push(positions[i * 2]);
                    linePositions.push(positions[i * 2 + 1]);
                    linePositions.push(positions[i * 2 + 2]);
                    linePositions.push(positions[i * 2 + 1]);
                }
            }
            linePositions.push(positions[positions.length - 2]);
            linePositions.push(positions[positions.length - 1]);
        } else if(trace.line.shape === 'vh') {
            linePositions = [];
            for(i = 0; i < count - 1; i++) {
                if(isNaN(positions[i * 2]) || isNaN(positions[i * 2 + 1])) {
                    linePositions.push(NaN);
                    linePositions.push(NaN);
                    linePositions.push(NaN);
                    linePositions.push(NaN);
                }
                else {
                    linePositions.push(positions[i * 2]);
                    linePositions.push(positions[i * 2 + 1]);
                    linePositions.push(positions[i * 2]);
                    linePositions.push(positions[i * 2 + 3]);
                }
            }
            linePositions.push(positions[positions.length - 2]);
            linePositions.push(positions[positions.length - 1]);
        } else {
            linePositions = positions;
        }
    }

    // If we have data with gaps, we ought to use rect joins
    // FIXME: get rid of this
    var hasNaN = false;
    for(i = 0; i < linePositions.length; i++) {
        if(isNaN(linePositions[i])) {
            hasNaN = true;
            break;
        }
    }

    var join = (hasNaN || linePositions.length > constants.TOO_MANY_POINTS) ? 'rect' :
        subTypes.hasMarkers(trace) ? 'rect' : 'round';

    // fill gaps
    if(hasNaN && trace.connectgaps) {
        var lastX = linePositions[0];
        var lastY = linePositions[1];

        for(i = 0; i < linePositions.length; i += 2) {
            if(isNaN(linePositions[i]) || isNaN(linePositions[i + 1])) {
                linePositions[i] = lastX;
                linePositions[i + 1] = lastY;
            }
            else {
                lastX = linePositions[i];
                lastY = linePositions[i + 1];
            }
        }
    }

    return {
        join: join,
        positions: linePositions
    };
}

function convertErrorBarPositions(gd, trace, positions) {
    var calcFromTrace = Registry.getComponentMethod('errorbars', 'calcFromTrace');
    var vals = calcFromTrace(trace, gd._fullLayout);
    var count = positions.length / 2;
    var out = {};

    function put(axLetter) {
        var errors = new Float64Array(4 * count);
        var ax = AxisIDs.getFromId(gd, trace[axLetter + 'axis']);
        var pOffset = {x: 0, y: 1}[axLetter];
        var eOffset = {x: [0, 1, 2, 3], y: [2, 3, 0, 1]}[axLetter];

        for(var i = 0, p = 0; i < count; i++, p += 4) {
            errors[p + eOffset[0]] = positions[i * 2 + pOffset] - ax.d2l(vals[i][axLetter + 's']) || 0;
            errors[p + eOffset[1]] = ax.d2l(vals[i][axLetter + 'h']) - positions[i * 2 + pOffset] || 0;
            errors[p + eOffset[2]] = 0;
            errors[p + eOffset[3]] = 0;
        }

        return errors;
    }


    if(trace.error_x && trace.error_x.visible) {
        out.x = {
            positions: positions,
            errors: put('x')
        };
    }
    if(trace.error_y && trace.error_y.visible) {
        out.y = {
            positions: positions,
            errors: put('y')
        };
    }

    return out;
}

module.exports = {
    convertStyle: convertStyle,
    convertLinePositions: convertLinePositions,
    convertErrorBarPositions: convertErrorBarPositions
};
