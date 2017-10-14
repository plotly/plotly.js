/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var ErrorBars = require('../../components/errorbars');
var str2RGBArray = require('../../lib/str2rgbarray');
var formatColor = require('../../lib/gl_format_color');
var subTypes = require('../scatter/subtypes');
var linkTraces = require('../scatter/link_traces');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');
var DASHES = require('../../constants/gl2d_dashes');
var createScatter = require('regl-scatter2d');
var createLine = require('regl-line2d');
var createError = require('regl-error2d');
var Drawing = require('../../components/drawing');
var svgSdf = require('svg-path-sdf');
var createRegl = require('regl');

var DESELECTDIM = 0.2;
var TRANSPARENT = [0, 0, 0, 0];

// tables with symbol SDF values
var SYMBOL_SDF_SIZE = 200;
var SYMBOL_SIZE = 20;
var SYMBOL_STROKE = SYMBOL_SIZE / 20;
var SYMBOL_SDF = {};
var SYMBOL_SVG_CIRCLE = Drawing.symbolFuncs[0](SYMBOL_SIZE * 0.05);

var convertNumber, convertColorBase;


module.exports = plot;


function plot(container, plotinfo, cdata) {
    var layout = container._fullLayout;
    var subplotObj = layout._plots[plotinfo.id];

    // that is needed for fills
    linkTraces(container, plotinfo, cdata);

    if(subplotObj._scene) {
        subplotObj._scene(cdata);
        return;
    }
    else {
        subplotObj._scene = update;
    }

    var canvas = container.querySelector('.gl-canvas-focus');

    var regl = layout._regl;
    if(!regl) {
        regl = layout._regl = createRegl({
            canvas: canvas,
            attributes: {
                preserveDrawingBuffer: false
            },
            extensions: ['ANGLE_instanced_arrays', 'OES_element_index_uint'],
            pixelRatio: container._context.plotGlPixelRatio || global.devicePixelRatio
        });
    }

    // FIXME: provide defaults to lazy init
    var scatter2d, line2d, errorX, errorY, fill2d;
    scatter2d = createScatter({
        regl: regl,
        size: 12,
        color: [0, 0, 0, 1],
        borderSize: 1,
        borderColor: [0, 0, 0, 1]
    });
    line2d = createLine({
        regl: regl,
        color: [0, 0, 0, 1],
        thickness: 1,
        miterLimit: 2,
        dashes: [1]
    });
    errorX = createError(regl);
    errorY = createError(regl);
    fill2d = createLine(regl);

    var count = 0, viewport;

    function updateRange(range) {
        var batch = [];
        range = {range: range};
        for(var i = 0; i < count; i++) {
            batch.push({
                line: range,
                scatter: range,
                errorX: range,
                errorY: range,
                fill: range
            });
        }

        updateBatch(batch);
    }

    // update multi-traces data and render in proper layers order
    function updateBatch(batch) {
        if(!batch.length) return;

        var lineBatch = [],
            scatterBatch = [],
            errorXBatch = [],
            errorYBatch = [],
            fillBatch = [],
            i;

        for(i = 0; i < batch.length; i++) {
            lineBatch.push(batch[i].line);
            scatterBatch.push(batch[i].scatter);
            errorXBatch.push(batch[i].errorX);
            errorYBatch.push(batch[i].errorY);
            fillBatch.push(batch[i].fill);
        }

        line2d.update(lineBatch);
        scatter2d.update(scatterBatch);
        errorX.update(errorXBatch);
        errorY.update(errorYBatch);
        fill2d.update(fillBatch);

        count = batch.length;

        // rendering requires proper batch sequence
        for(i = 0; i < count; i++) {
            if(fillBatch[i]) fill2d.draw(i);
            if(errorXBatch[i]) errorX.draw(i);
            if(errorYBatch[i]) errorY.draw(i);
            if(lineBatch[i]) line2d.draw(i);
            if(scatterBatch[i]) scatter2d.draw(i);
        }
    }

    // update based on calc data
    function update(cdscatters) {
        var batch = [];

        cdscatters.forEach(function(cdscatter, order) {
            if(!cdscatter) return;
            var trace = cdscatter[0].trace;
            batch[order] = getTraceOptions(trace);
        });

        updateBatch(batch);
    }

    function getTraceOptions(trace) {
        var lineOptions, scatterOptions, errorXOptions, errorYOptions, fillOptions;
        var xaxis = Axes.getFromId(container, trace.xaxis || 'x'),
            yaxis = Axes.getFromId(container, trace.yaxis || 'y'),
            selection = trace.selection;
        var vpSize = layout._size,
            width = layout.width,
            height = layout.height;
        var sizes, selIds;

        // makeCalcdata runs d2c (data-to-coordinate) on every point
        var x = xaxis.makeCalcdata(trace, 'x');
        var y = yaxis.makeCalcdata(trace, 'y');

        // convert log axes
        if(xaxis.type === 'log') x = x.map(xaxis.d2l);
        if(yaxis.type === 'log') y = y.map(xaxis.d2l);

        var hasLines = false;
        var hasErrorX = false;
        var hasErrorY = false;
        var hasMarkers = false;
        var hasFill = false;

        if(trace.visible !== true) {
            hasLines = false;
            hasErrorX = false;
            hasErrorY = false;
            hasMarkers = false;
            hasFill = false;
        }
        else {
            hasLines = subTypes.hasLines(trace) && x.length > 1 && trace.line;
            hasErrorX = trace.error_x.visible === true;
            hasErrorY = trace.error_y.visible === true;
            hasMarkers = subTypes.hasMarkers(trace);
            hasFill = trace.fill;
        }

        // update viewport & range
        viewport = [
            vpSize.l + xaxis.domain[0] * vpSize.w,
            vpSize.b + yaxis.domain[0] * vpSize.h,
            (width - vpSize.r) - (1 - xaxis.domain[1]) * vpSize.w,
            (height - vpSize.t) - (1 - yaxis.domain[1]) * vpSize.h
        ];

        var range = [
            xaxis._rl[0], yaxis._rl[0], xaxis._rl[1], yaxis._rl[1]
        ];

        // get error values
        var errorVals = ErrorBars.calcFromTrace(trace, layout);

        var len = x.length,
            positions = [len * 2],
            errorsX = new Float64Array(4 * len),
            errorsY = new Float64Array(4 * len),
            linePositions;

        var i, xx, yy, ptrX = 0, ptrY = 0, errorOptions;

        for(i = 0; i < len; ++i) {
            xx = parseFloat(x[i]);
            yy = parseFloat(y[i]);

            positions[i * 2] = xx;
            positions[i * 2 + 1] = yy;

            errorsX[ptrX++] = xx - errorVals[i].xs || 0;
            errorsX[ptrX++] = errorVals[i].xh - xx || 0;
            errorsX[ptrX++] = 0;
            errorsX[ptrX++] = 0;

            errorsY[ptrY++] = 0;
            errorsY[ptrY++] = 0;
            errorsY[ptrY++] = yy - errorVals[i].ys || 0;
            errorsY[ptrY++] = errorVals[i].yh - yy || 0;
        }

        if(hasErrorX) {
            errorOptions = trace.error_x;
            if(errorOptions.copy_ystyle) {
                errorOptions = trace.error_y;
            }
            errorXOptions = {};
            errorXOptions.positions = positions;
            errorXOptions.errors = errorsX;
            errorXOptions.capSize = errorOptions.width * 2;
            errorXOptions.lineWidth = errorOptions.thickness;
            errorXOptions.color = errorOptions.color;
            errorXOptions.viewport = viewport;
            errorXOptions.range = range;
        }

        if(hasErrorY) {
            errorOptions = trace.error_y;
            errorYOptions = {};
            errorYOptions.positions = positions;
            errorYOptions.errors = errorsY;
            errorYOptions.capSize = errorOptions.width * 2;
            errorYOptions.lineWidth = errorOptions.thickness;
            errorYOptions.color = errorOptions.color;
            errorYOptions.viewport = viewport;
            errorYOptions.range = range;
        }

        if(hasLines) {
            lineOptions = {};
            lineOptions.thickness = trace.line.width;
            lineOptions.color = trace.line.color;
            lineOptions.opacity = trace.opacity;
            lineOptions.join = trace.opacity === 1.0 ? 'rect' : 'round';
            lineOptions.overlay = true;

            var lineWidth = lineOptions.thickness,
                dashes = (DASHES[trace.line.dash] || [1]).slice();
            for(i = 0; i < dashes.length; ++i) dashes[i] *= lineWidth;
            lineOptions.dashes = dashes;

            if(trace.line.shape === 'hv') {
                linePositions = [];
                for(i = 0; i < Math.floor(positions.length / 2) - 1; i++) {
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
            }
            else if(trace.line.shape === 'vh') {
                linePositions = [];
                for(i = 0; i < Math.floor(positions.length / 2) - 1; i++) {
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
            }
            else {
                linePositions = positions;
            }
            lineOptions.positions = linePositions;
            lineOptions.viewport = viewport;
            lineOptions.range = range;
        }

        if(hasFill) {
            fillOptions = {};
            fillOptions.fill = trace.fillcolor;
            fillOptions.thickness = 0;
            fillOptions.viewport = viewport;
            fillOptions.range = range;
            fillOptions.closed = true;

            var pos = [], srcPos = linePositions || positions;
            if(trace.fill === 'tozeroy') {
                pos = [srcPos[0], 0];
                pos = pos.concat(srcPos);
                pos.push(srcPos[srcPos.length - 2]);
                pos.push(0);
            }
            else if(trace.fill === 'tozerox') {
                pos = [0, srcPos[1]];
                pos = pos.concat(srcPos);
                pos.push(0);
                pos.push(srcPos[srcPos.length - 1]);
            }
            else {
                var nextTrace = trace._nexttrace;
                if(nextTrace && trace.fill === 'tonexty') {
                    pos = srcPos.slice();

                    // FIXME: overcalculation here
                    var nextOptions = getTraceOptions(nextTrace);

                    if(nextOptions && nextOptions.line) {
                        var nextPos = nextOptions.line.positions;

                        for(i = Math.floor(nextPos.length / 2); i--;) {
                            xx = nextPos[i * 2], yy = nextPos[i * 2 + 1];
                            if(isNaN(xx) || isNaN(yy)) continue;
                            pos.push(xx);
                            pos.push(yy);
                        }
                        fillOptions.fill = nextTrace.fillcolor;
                    }
                }
            }
            fillOptions.positions = pos;
        }

        if(selection && selection.length) {
            selIds = {};
            for(i = 0; i < selection.length; i++) {
                selIds[selection[i].pointNumber] = true;
            }
        }

        if(hasMarkers) {
            scatterOptions = {};
            scatterOptions.positions = positions;
            scatterOptions.sizes = new Array(len);
            scatterOptions.markers = new Array(len);
            scatterOptions.borderSizes = new Array(len);
            scatterOptions.colors = new Array(len);
            scatterOptions.borderColors = new Array(len);

            var markerSizeFunc = makeBubbleSizeFn(trace);

            var markerOpts = trace.marker;
            var markerOpacity = markerOpts.opacity;
            var traceOpacity = trace.opacity;
            var symbols = markerOpts.symbol;

            var colors = convertColorScale(markerOpts, markerOpacity, traceOpacity, len);
            var borderSizes = convertNumber(markerOpts.line.width, len);
            var borderColors = convertColorScale(markerOpts.line, markerOpacity, traceOpacity, len);
            var size, symbol, symbolNumber, isOpen, isDimmed, _colors, _borderColors, bw, symbolFunc, symbolNoDot, symbolSdf, symbolNoFill, symbolPath, isDot;

            sizes = convertArray(markerSizeFunc, markerOpts.size, len);

            for(i = 0; i < len; ++i) {
                symbol = Array.isArray(symbols) ? symbols[i] : symbols;
                symbolNumber = Drawing.symbolNumber(symbol);
                symbolFunc = Drawing.symbolFuncs[symbolNumber % 100];
                symbolNoDot = !!Drawing.symbolNoDot[symbolNumber % 100];
                symbolNoFill = !!Drawing.symbolNoFill[symbolNumber % 100];

                isOpen = /-open/.test(symbol);
                isDot = /-dot/.test(symbol);
                isDimmed = selIds && !selIds[i];

                _colors = colors;

                if(isOpen) {
                    _borderColors = colors;
                } else {
                    _borderColors = borderColors;
                }

                // See  https://github.com/plotly/plotly.js/pull/1781#discussion_r121820798
                // for more info on this logic
                size = sizes[i];
                bw = borderSizes[i];

                scatterOptions.sizes[i] = size;

                if(symbol === 'circle') {
                    scatterOptions.markers[i] = null;
                }
                else {
                    // get symbol sdf from cache or generate it
                    if(SYMBOL_SDF[symbol]) {
                        symbolSdf = SYMBOL_SDF[symbol];
                    } else {
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
                    }

                    scatterOptions.markers[i] = symbolSdf || null;
                }
                scatterOptions.borderSizes[i] = 0.5 * bw;

                var optColors = scatterOptions.colors;
                var dim = isDimmed ? DESELECTDIM : 1;
                if(!optColors[i]) optColors[i] = [];
                if(isOpen || symbolNoFill) {
                    optColors[i][0] = TRANSPARENT[0];
                    optColors[i][1] = TRANSPARENT[1];
                    optColors[i][2] = TRANSPARENT[2];
                    optColors[i][3] = TRANSPARENT[3];
                } else {
                    optColors[i][0] = _colors[4 * i + 0] * 255;
                    optColors[i][1] = _colors[4 * i + 1] * 255;
                    optColors[i][2] = _colors[4 * i + 2] * 255;
                    optColors[i][3] = dim * _colors[4 * i + 3] * 255;
                }
                if(!scatterOptions.borderColors[i]) scatterOptions.borderColors[i] = [];
                scatterOptions.borderColors[i][0] = _borderColors[4 * i + 0] * 255;
                scatterOptions.borderColors[i][1] = _borderColors[4 * i + 1] * 255;
                scatterOptions.borderColors[i][2] = _borderColors[4 * i + 2] * 255;
                scatterOptions.borderColors[i][3] = dim * _borderColors[4 * i + 3] * 255;
            }

            scatterOptions.viewport = viewport;
            scatterOptions.range = range;
        }

        // add item for autorange routine
        // former expandAxesFancy
        Axes.expand(xaxis, x, {padded: true, ppad: sizes});
        Axes.expand(yaxis, y, {padded: true, ppad: sizes});


        return {
            scatter: scatterOptions,
            line: lineOptions,
            errorX: errorXOptions,
            errorY: errorYOptions,
            fill: fillOptions
        };
    }

    function clear() {
        if(!viewport) return;

        // make sure no old graphics on the canvas
        var gl = regl._gl;
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(
            viewport[0] - 1,
            viewport[1] - 1,
            viewport[2] - viewport[0] + 2,
            viewport[3] - viewport[1] + 2
        );
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // FIXME: why ↓ does not suffice here? regl bug?
        // regl.clear({color: [0, 0, 0, 0], depth: 1});
    }

    update.range = updateRange;
    update.clear = clear;

    update(cdata);

    return update;
}


convertNumber = convertArray.bind(null, function(x) { return +x; });
convertColorBase = convertArray.bind(null, str2RGBArray);

// handle the situation where values can be array-like or not array like
function convertArray(convert, data, count) {
    if(!Array.isArray(data)) data = [data];

    return _convertArray(convert, data, count);
}

function _convertArray(convert, data, count) {
    var result = new Array(count),
        data0 = data[0];

    for(var i = 0; i < count; ++i) {
        result[i] = (i >= data.length) ?
            convert(data0) :
            convert(data[i]);
    }

    return result;
}


function convertColorScale(containerIn, markerOpacity, traceOpacity, count) {
    var colors = formatColor(containerIn, markerOpacity, count);

    colors = Array.isArray(colors[0]) ?
        colors :
        _convertArray(Lib.identity, [colors], count);

    return _convertColor(
        colors,
        convertNumber(traceOpacity, count),
        count
    );
}

function _convertColor(colors, opacities, count) {
    var result = new Array(4 * count);

    for(var i = 0; i < count; ++i) {
        for(var j = 0; j < 3; ++j) result[4 * i + j] = colors[i][j];

        result[4 * i + 3] = colors[i][3] * opacities[i];
    }

    return result;
}
