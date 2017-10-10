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
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');
var DASHES = require('../../constants/gl2d_dashes');
var createScatter = require('regl-scatter2d');
var createLine = require('regl-line2d');
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


module.exports = createScatterScene;


function createScatterScene(container, plotinfo, cdata) {
    var layout = container._fullLayout;
    var subplotObj = layout._plots[plotinfo.id];

    if(subplotObj._scene) {
        subplotObj._scene(cdata);
        return;
    }

    subplotObj._scene = update;

    var canvas = container.querySelector('.gl-canvas-focus');

    var regl = createRegl({
        canvas: canvas,
        attributes: {
            preserveDrawingBuffer: false
        },
        extensions: ['ANGLE_instanced_arrays', 'OES_element_index_uint'],
        pixelRatio: container._context.plotGlPixelRatio || global.devicePixelRatio
    });

    var scatter = createScatter({
        regl: regl,
        size: 12,
        color: [0, 0, 0, 1],
        borderSize: 1,
        borderColor: [0, 0, 0, 1]
    });
    var line = createLine({
        regl: regl,
        color: [0, 0, 0, 1],
        thickness: 1,
        miterLimit: 2,
        dashes: [1]
    });

    var count = 0, viewport;

    function updateRange(range) {
        var batch = [];

        for(var i = 0; i < count; i++) {
            batch.push({
                line: {range: range},
                scatter: {range: range}
            });
        }

        updateBatch(batch);
    }

    function updateBatch(batch) {
        // make sure no old graphics on the canvas
        var gl = regl._gl;
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(
            viewport[0] - 1,
            viewport[1] - 1,
            viewport[2] - viewport[0] + 2,
            viewport[3] - viewport[1] + 2
        );
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // FIXME: why ↓ does not suffice here? regl bug?
        // regl.clear({color: [0, 0, 0, 0], depth: 1});

        var lineBatch = [], scatterBatch = [], i;

        // update options of line and scatter components directly
        for(i = 0; i < batch.length; i++) {
            lineBatch.push(batch[i].line || null);
            scatterBatch.push(batch[i].scatter || null);
        }

        line.update(lineBatch);
        scatter.update(scatterBatch);

        count = batch.length;

        // rendering requires proper batch sequence
        for(i = 0; i < count; i++) {
            lineBatch = Array(batch.length);
            scatterBatch = Array(batch.length);
            for(var j = 0; j < batch.length; j++) {
                lineBatch[j] = i === j;
                scatterBatch[j] = i === j;
            }
            line.draw(lineBatch);
            scatter.draw(scatterBatch);
        }
    }

    // update based on calc data
    function update(cdscatters) {
        var batch = [];

        cdscatters.forEach(function(cdscatter) {
            if(!cdscatter) return;

            var lineOptions, scatterOptions;

            var options = cdscatter[0].trace;
            var xaxis = Axes.getFromId(container, options.xaxis || 'x'),
                yaxis = Axes.getFromId(container, options.yaxis || 'y'),
                selection = options.selection;
            var vpSize = layout._size,
                width = layout.width,
                height = layout.height;

            // makeCalcdata runs d2c (data-to-coordinate) on every point
            var x = options.x;
            var y = options.y;
            var xData = Array(x.length);
            var yData = Array(y.length);

            var isVisible = false;
            var hasLines = false;
            var hasErrorX = false;
            var hasErrorY = false;
            var hasMarkers = false;

            if(options.visible !== true) {
                isVisible = false;
                hasLines = false;
                hasErrorX = false;
                hasErrorY = false;
                hasMarkers = false;
            }
            else {
                isVisible = true;
                hasLines = subTypes.hasLines(options);
                hasErrorX = options.error_x.visible === true;
                hasErrorY = options.error_y.visible === true;
                hasMarkers = subTypes.hasMarkers(options);
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
            var errorVals = ErrorBars.calcFromTrace(options, layout);

            var len = x.length,
                positions = Array(2 * len),
                errorsX = new Float64Array(4 * len),
                errorsY = new Float64Array(4 * len),
                pId = 0,
                ptr = 0,
                ptrX = 0,
                ptrY = 0;

            var getX = (xaxis.type === 'log') ? xaxis.d2l : function(x) { return x; };
            var getY = (yaxis.type === 'log') ? yaxis.d2l : function(y) { return y; };

            var i, xx, yy, ex0, ex1, ey0, ey1;

            for(i = 0; i < len; ++i) {
                xData[i] = xx = getX(x[i]);
                yData[i] = yy = getY(y[i]);

                // if(isNaN(xx) || isNaN(yy)) continue;

                positions[ptr++] = parseFloat(xx);
                positions[ptr++] = parseFloat(yy);

                ex0 = errorsX[ptrX++] = xx - errorVals[i].xs || 0;
                ex1 = errorsX[ptrX++] = errorVals[i].xh - xx || 0;
                errorsX[ptrX++] = 0;
                errorsX[ptrX++] = 0;

                errorsY[ptrY++] = 0;
                errorsY[ptrY++] = 0;
                ey0 = errorsY[ptrY++] = yy - errorVals[i].ys || 0;
                ey1 = errorsY[ptrY++] = errorVals[i].yh - yy || 0;
            }

            // update lines
            if(hasLines) {
                lineOptions = {};
                lineOptions.positions = positions,
                lineOptions.thickness = options.line.width,
                lineOptions.color = options.line.color,
                lineOptions.opacity = options.opacity,
                lineOptions.join = options.opacity === 1.0 ? 'rect' : 'round';
                lineOptions.overlay = true;

                var lineWidth = lineOptions.thickness,
                    dashes = (DASHES[options.line.dash] || [1]).slice();

                for(i = 0; i < dashes.length; ++i) dashes[i] *= lineWidth;

                // FIXME: make regl renderer for fills
                switch(options.fill) {
                    case 'tozeroy':
                        // lineOptions.fill = [false, true, false, false];
                        break;
                    case 'tozerox':
                        // lineOptions.fill = [true, false, false, false];
                        break;
                    default:
                        // lineOptions.fill = [false, false, false, false];
                        break;
                }
                var fillColor = str2RGBArray(options.fillcolor);

                lineOptions.dashes = dashes;
                // lineOptions.fillColor = [fillColor, fillColor, fillColor, fillColor];

                lineOptions.viewport = viewport;
                lineOptions.range = range;
            }


            // updateError('X', options, positions, errorsX);
            // updateError('Y', options, positions, errorsY);

            var sizes, selIds;

            if(selection && selection.length) {
                selIds = {};
                for(i = 0; i < selection.length; i++) {
                    selIds[selection[i].pointNumber] = true;
                }
            }

            if(hasMarkers) {
                scatterOptions = {};
                scatterOptions.positions = positions;

                // TODO rewrite convert function so that
                // we don't have to loop through the data another time

                scatterOptions.sizes = new Array(len);
                scatterOptions.markers = new Array(len);
                scatterOptions.borderSizes = new Array(len);
                scatterOptions.colors = new Array(len);
                scatterOptions.borderColors = new Array(len);

                var markerSizeFunc = makeBubbleSizeFn(options);

                var markerOpts = options.marker;
                var markerOpacity = markerOpts.opacity;
                var traceOpacity = options.opacity;
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

            batch.push({
                scatter: scatterOptions,
                line: lineOptions
            });

            // add item for autorange routine
            // former expandAxesFancy
            Axes.expand(xaxis, x, {padded: true, ppad: sizes});
            Axes.expand(yaxis, y, {padded: true, ppad: sizes});

            // provide reference for selecting points
            if(!cdscatter[0].glTrace) {
                cdscatter[0].glTrace = this;
            }
        });

        updateBatch(batch);
    }


    function updateError(axLetter, options, positions, errors) {
        var errorObj = this['error' + axLetter],
            errorOptions = options['error_' + axLetter.toLowerCase()];

        if(axLetter.toLowerCase() === 'x' && errorOptions.copy_ystyle) {
            errorOptions = options.error_y;
        }

        if(this['hasError' + axLetter]) {
            errorObj.options.positions = positions;
            errorObj.options.errors = errors;
            errorObj.options.capSize = errorOptions.width;
            errorObj.options.lineWidth = errorOptions.thickness;  // ballpark rescaling
            errorObj.options.color = convertColor(errorOptions.color, 1, 1);

            errorObj.update();
        }
        else {
            errorObj.clear();
        }
    }

    update.range = updateRange;

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


function convertColor(color, opacity, count) {
    return _convertColor(
        convertColorBase(color, count),
        convertNumber(opacity, count),
        count
    );
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
