/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createRegl = require('regl');
var createScatter = require('regl-scatter2d');
var createLine = require('regl-line2d');
var createError = require('regl-error2d');
var kdtree = require('kdgrass');
var rgba = require('color-normalize');
var svgSdf = require('svg-path-sdf');
var arrayRange = require('array-range');

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var Drawing = require('../../components/drawing');
var ErrorBars = require('../../components/errorbars');
var formatColor = require('../../lib/gl_format_color');

var subTypes = require('../scatter/subtypes');
var calcMarkerSize = require('../scatter/calc').calcMarkerSize;
var calcAxisExpansion = require('../scatter/calc').calcAxisExpansion;
var calcColorscales = require('../scatter/colorscale_calc');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');
var linkTraces = require('../scatter/link_traces');
var getTraceColor = require('../scatter/get_trace_color');
var fillHoverText = require('../scatter/fill_hover_text');

var DASHES = require('../../constants/gl2d_dashes');
var BADNUM = require('../../constants/numerical').BADNUM;
var SYMBOL_SDF_SIZE = 200;
var SYMBOL_SIZE = 20;
var SYMBOL_STROKE = SYMBOL_SIZE / 20;
var SYMBOL_SDF = {};
var SYMBOL_SVG_CIRCLE = Drawing.symbolFuncs[0](SYMBOL_SIZE * 0.05);
var TOO_MANY_POINTS = 1e5;
var DOT_RE = /-dot/;
var OPEN_RE = /-open/;

function calc(gd, trace) {
    var fullLayout = gd._fullLayout;
    var xa = Axes.getFromId(gd, trace.xaxis);
    var ya = Axes.getFromId(gd, trace.yaxis);
    var subplot = fullLayout._plots[trace.xaxis + trace.yaxis];
    var count = trace._length;
    var count2 = count * 2;
    var stash = {};
    var i, xx, yy;

    var x = xa.makeCalcdata(trace, 'x');
    var y = ya.makeCalcdata(trace, 'y');

    // we need hi-precision for scatter2d,
    // regl-scatter2d uses NaNs for bad/missing values
    //
    // TODO should this be a Float32Array ??
    var positions = new Array(count2);
    for(i = 0; i < count; i++) {
        xx = x[i];
        yy = y[i];
        // TODO does d2c output any other bad value as BADNUM ever?
        positions[i * 2] = xx === BADNUM ? NaN : xx;
        positions[i * 2 + 1] = yy === BADNUM ? NaN : yy;
    }

    if(xa.type === 'log') {
        for(i = 0; i < count2; i += 2) {
            positions[i] = xa.d2l(positions[i]);
        }
    }
    if(ya.type === 'log') {
        for(i = 1; i < count2; i += 2) {
            positions[i] = ya.d2l(positions[i]);
        }
    }

    // we don't build a tree for log axes since it takes long to convert log2px
    // and it is also
    if(xa.type !== 'log' && ya.type !== 'log') {
        // FIXME: delegate this to webworker
        stash.tree = kdtree(positions, 512);
    } else {
        var ids = stash.ids = new Array(count);
        for(i = 0; i < count; i++) {
            ids[i] = i;
        }
    }

    // create scene options and scene
    calcColorscales(trace);
    var options = sceneOptions(gd, subplot, trace, positions);
    var markerOptions = options.marker;
    var scene = sceneUpdate(gd, subplot);
    var ppad;

    // Re-use SVG scatter axis expansion routine except
    // for graph with very large number of points where it
    // performs poorly.
    // In big data case, fake Axes.expand outputs with data bounds,
    // and an average size for array marker.size inputs.
    if(count < TOO_MANY_POINTS) {
        ppad = calcMarkerSize(trace, count);
        calcAxisExpansion(gd, trace, xa, ya, x, y, ppad);
    } else {
        if(markerOptions) {
            ppad = 2 * (markerOptions.sizeAvg || Math.max(markerOptions.size, 3));
        }
        fastAxisExpand(xa, x, ppad);
        fastAxisExpand(ya, y, ppad);
    }

    // set flags to create scene renderers
    if(options.fill && !scene.fill2d) scene.fill2d = true;
    if(options.marker && !scene.scatter2d) scene.scatter2d = true;
    if(options.line && !scene.line2d) scene.line2d = true;
    if((options.errorX || options.errorY) && !scene.error2d) scene.error2d = true;

    // save scene options batch
    scene.lineOptions.push(options.line);
    scene.errorXOptions.push(options.errorX);
    scene.errorYOptions.push(options.errorY);
    scene.fillOptions.push(options.fill);
    scene.markerOptions.push(options.marker);
    scene.selectedOptions.push(options.selected);
    scene.unselectedOptions.push(options.unselected);
    scene.count++;

    // stash scene ref
    stash.scene = scene;
    stash.index = scene.count - 1;
    stash.x = x;
    stash.y = y;
    stash.positions = positions;
    stash.count = count;

    gd.firstscatter = false;
    return [{x: false, y: false, t: stash, trace: trace}];
}

// Approximate Axes.expand results with speed
function fastAxisExpand(ax, vals, ppad) {
    if(!Axes.doesAxisNeedAutoRange(ax) || !vals) return;

    var b0 = Infinity;
    var b1 = -Infinity;

    for(var i = 0; i < vals.length; i += 2) {
        var v = vals[i];
        if(v < b0) b0 = v;
        if(v > b1) b1 = v;
    }

    if(ax._min) ax._min = [];
    ax._min.push({val: b0, pad: ppad});

    if(ax._max) ax._max = [];
    ax._max.push({val: b1, pad: ppad});
}

// create scene options
function sceneOptions(gd, subplot, trace, positions) {
    var fullLayout = gd._fullLayout;
    var count = positions.length / 2;
    var markerOpts = trace.marker;
    var xaxis = Axes.getFromId(gd, trace.xaxis);
    var yaxis = Axes.getFromId(gd, trace.yaxis);
    var ptrX = 0;
    var ptrY = 0;
    var i;

    var hasLines, hasErrorX, hasErrorY, hasError, hasMarkers, hasFill;

    if(trace.visible !== true) {
        hasLines = false;
        hasErrorX = false;
        hasErrorY = false;
        hasMarkers = false;
        hasFill = false;
    } else {
        hasLines = subTypes.hasLines(trace) && positions.length > 1;
        hasErrorX = trace.error_x && trace.error_x.visible === true;
        hasErrorY = trace.error_y && trace.error_y.visible === true;
        hasError = hasErrorX || hasErrorY;
        hasMarkers = subTypes.hasMarkers(trace);
        hasFill = !!trace.fill && trace.fill !== 'none';
    }

    var lineOptions, markerOptions, fillOptions;
    var errorXOptions, errorYOptions;
    var selectedOptions, unselectedOptions;
    var linePositions;

    // get error values
    var errorVals = hasError ? ErrorBars.calcFromTrace(trace, fullLayout) : null;

    if(hasErrorX) {
        errorXOptions = {};
        errorXOptions.positions = positions;
        var errorsX = new Float64Array(4 * count);

        if(xaxis.type === 'log') {
            for(i = 0; i < count; ++i) {
                errorsX[ptrX++] = positions[i * 2] - xaxis.d2l(errorVals[i].xs) || 0;
                errorsX[ptrX++] = xaxis.d2l(errorVals[i].xh) - positions[i * 2] || 0;
                errorsX[ptrX++] = 0;
                errorsX[ptrX++] = 0;
            }
        } else {
            for(i = 0; i < count; ++i) {
                errorsX[ptrX++] = positions[i * 2] - errorVals[i].xs || 0;
                errorsX[ptrX++] = errorVals[i].xh - positions[i * 2] || 0;
                errorsX[ptrX++] = 0;
                errorsX[ptrX++] = 0;
            }
        }

        if(trace.error_x.copy_ystyle) {
            trace.error_x = trace.error_y;
        }

        errorXOptions.errors = errorsX;
        errorXOptions.capSize = trace.error_x.width * 2;
        errorXOptions.lineWidth = trace.error_x.thickness;
        errorXOptions.color = trace.error_x.color;
    }

    if(hasErrorY) {
        errorYOptions = {};
        errorYOptions.positions = positions;
        var errorsY = new Float64Array(4 * count);

        if(yaxis.type === 'log') {
            for(i = 0; i < count; ++i) {
                errorsY[ptrY++] = 0;
                errorsY[ptrY++] = 0;
                errorsY[ptrY++] = positions[i * 2 + 1] - yaxis.d2l(errorVals[i].ys) || 0;
                errorsY[ptrY++] = yaxis.d2l(errorVals[i].yh) - positions[i * 2 + 1] || 0;
            }
        } else {
            for(i = 0; i < count; ++i) {
                errorsY[ptrY++] = 0;
                errorsY[ptrY++] = 0;
                errorsY[ptrY++] = positions[i * 2 + 1] - errorVals[i].ys || 0;
                errorsY[ptrY++] = errorVals[i].yh - positions[i * 2 + 1] || 0;
            }
        }

        errorYOptions.errors = errorsY;
        errorYOptions.capSize = trace.error_y.width * 2;
        errorYOptions.lineWidth = trace.error_y.thickness;
        errorYOptions.color = trace.error_y.color;
    }

    if(hasLines) {
        lineOptions = {};
        lineOptions.thickness = trace.line.width;
        lineOptions.color = trace.line.color;
        lineOptions.opacity = trace.opacity;
        lineOptions.overlay = true;

        var dashes = (DASHES[trace.line.dash] || [1]).slice();
        for(i = 0; i < dashes.length; ++i) dashes[i] *= lineOptions.thickness;
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

        // If we have data with gaps, we ought to use rect joins
        // FIXME: get rid of this
        var hasNaN = false;
        for(i = 0; i < linePositions.length; i++) {
            if(isNaN(linePositions[i])) {
                hasNaN = true;
                break;
            }
        }

        lineOptions.join = (hasNaN || linePositions.length > TOO_MANY_POINTS) ? 'rect' :
            hasMarkers ? 'rect' : 'round';

        // fill gaps
        if(hasNaN && trace.connectgaps) {
            var lastX = linePositions[0], lastY = linePositions[1];
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

        lineOptions.positions = linePositions;
    }

    if(hasFill) {
        fillOptions = {};
        fillOptions.fill = trace.fillcolor;
        fillOptions.thickness = 0;
        fillOptions.closed = true;
    }

    if(hasMarkers) {
        markerOptions = makeMarkerOptions(markerOpts);
        selectedOptions = makeSelectedOptions(trace.selected, markerOpts);
        unselectedOptions = makeSelectedOptions(trace.unselected, markerOpts);
        markerOptions.positions = positions;
    }

    function makeSelectedOptions(selected, markerOpts) {
        var options = {};

        if(!selected) return options;

        if(selected.marker && selected.marker.symbol) {
            options = makeMarkerOptions(Lib.extendFlat({}, markerOpts, selected.marker));
        }

        // shortcut simple selection logic
        else {
            options = {};
            if(selected.marker.size) options.sizes = selected.marker.size;
            if(selected.marker.color) options.colors = selected.marker.color;
            if(selected.marker.opacity !== undefined) options.opacity = selected.marker.opacity;
        }

        return options;
    }

    function makeMarkerOptions(markerOpts) {
        var markerOptions = {};
        var i;

        var multiSymbol = Array.isArray(markerOpts.symbol);
        var multiColor = Lib.isArrayOrTypedArray(markerOpts.color);
        var multiLineColor = Lib.isArrayOrTypedArray(markerOpts.line.color);
        var multiOpacity = Lib.isArrayOrTypedArray(markerOpts.opacity);
        var multiSize = Lib.isArrayOrTypedArray(markerOpts.size);
        var multiLineWidth = Lib.isArrayOrTypedArray(markerOpts.line.width);

        var isOpen;
        if(!multiSymbol) isOpen = OPEN_RE.test(markerOpts.symbol);

        // prepare colors
        if(multiSymbol || multiColor || multiLineColor || multiOpacity) {
            markerOptions.colors = new Array(count);
            markerOptions.borderColors = new Array(count);
            var colors = formatColor(markerOpts, markerOpts.opacity, count);
            var borderColors = formatColor(markerOpts.line, markerOpts.opacity, count);

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

            markerOptions.colors = colors;
            markerOptions.borderColors = borderColors;

            for(i = 0; i < count; i++) {
                if(multiSymbol) {
                    var symbol = markerOpts.symbol[i];
                    isOpen = OPEN_RE.test(symbol);
                }
                if(isOpen) {
                    borderColors[i] = colors[i].slice();
                    colors[i] = colors[i].slice();
                    colors[i][3] = 0;
                }
            }

            markerOptions.opacity = trace.opacity;
        }
        else {
            if(isOpen) {
                markerOptions.color = rgba(markerOpts.color, 'uint8');
                markerOptions.color[3] = 0;
                markerOptions.borderColor = rgba(markerOpts.color, 'uint8');
            } else {
                markerOptions.color = rgba(markerOpts.color, 'uint8');
                markerOptions.borderColor = rgba(markerOpts.line.color, 'uint8');
            }

            markerOptions.opacity = trace.opacity * markerOpts.opacity;
        }

        // prepare symbols
        if(multiSymbol) {
            markerOptions.markers = new Array(count);
            for(i = 0; i < count; i++) {
                markerOptions.markers[i] = getSymbolSdf(markerOpts.symbol[i]);
            }
        } else {
            markerOptions.marker = getSymbolSdf(markerOpts.symbol);
        }

        // prepare sizes
        var markerSizeFunc = makeBubbleSizeFn(trace);
        var s;

        if(multiSize || multiLineWidth) {
            var sizes = markerOptions.sizes = new Array(count);
            var borderSizes = markerOptions.borderSizes = new Array(count);
            var sizeTotal = 0;
            var sizeAvg;

            if(multiSize) {
                for(i = 0; i < count; i++) {
                    sizes[i] = markerSizeFunc(markerOpts.size[i]);
                    sizeTotal += sizes[i];
                }
                sizeAvg = sizeTotal / count;
            } else {
                s = markerSizeFunc(markerOpts.size);
                for(i = 0; i < count; i++) {
                    sizes[i] = s;
                }
            }

            // See  https://github.com/plotly/plotly.js/pull/1781#discussion_r121820798
            if(multiLineWidth) {
                for(i = 0; i < count; i++) {
                    borderSizes[i] = markerSizeFunc(markerOpts.line.width[i]);
                }
            } else {
                s = markerSizeFunc(markerOpts.line.width);
                for(i = 0; i < count; i++) {
                    borderSizes[i] = s;
                }
            }

            markerOptions.sizeAvg = sizeAvg;
        } else {
            markerOptions.size = markerSizeFunc(markerOpts && markerOpts.size || 10);
            markerOptions.borderSizes = markerSizeFunc(markerOpts.line.width);
        }

        return markerOptions;
    }

    return {
        line: lineOptions,
        marker: markerOptions,
        errorX: errorXOptions,
        errorY: errorYOptions,
        fill: fillOptions,
        selected: selectedOptions,
        unselected: unselectedOptions
    };
}

// make sure scene exists on subplot, return it
function sceneUpdate(gd, subplot) {
    var scene = subplot._scene;
    var fullLayout = gd._fullLayout;

    if(!subplot._scene) {
        scene = subplot._scene = {
            // number of traces in subplot, since scene:subplot → 1:1
            count: 0,

            // whether scene requires init hook in plot call (dirty plot call)
            dirty: true,

            // last used options
            lineOptions: [],
            fillOptions: [],
            markerOptions: [],
            selectedOptions: [],
            unselectedOptions: [],
            errorXOptions: [],
            errorYOptions: [],
            selectBatch: null,
            unselectBatch: null,

            // regl- component stubs, initialized in dirty plot call
            fill2d: false,
            scatter2d: false,
            error2d: false,
            line2d: false,
            select2d: null
        };

        // apply new option to all regl components
        scene.update = function update(opt) {
            var opts = Array(scene.count);
            for(var i = 0; i < scene.count; i++) {
                opts[i] = opt;
            }
            if(scene.fill2d) scene.fill2d.update(opts);
            if(scene.scatter2d) scene.scatter2d.update(opts);
            if(scene.line2d) scene.line2d.update(opts);
            if(scene.error2d) scene.error2d.update(opts.concat(opts));
            if(scene.select2d) scene.select2d.update(opts);

            scene.draw();
        };

        // draw traces in proper order
        scene.draw = function draw() {
            var i;
            for(i = 0; i < scene.count; i++) {
                if(scene.fill2d) scene.fill2d.draw(i);
            }
            for(i = 0; i < scene.count; i++) {
                if(scene.line2d) {
                    scene.line2d.draw(i);
                }
                if(scene.error2d) {
                    scene.error2d.draw(i);
                    scene.error2d.draw(i + scene.count);
                }
                if(scene.scatter2d) {
                    // traces in no-selection mode
                    if(!scene.selectBatch || !scene.selectBatch[i]) {
                        scene.scatter2d.draw(i);
                    }
                }
            }

            // draw traces in selection mode
            if(scene.scatter2d && scene.select2d && scene.selectBatch) {
                scene.select2d.draw(scene.selectBatch);
                scene.scatter2d.draw(scene.unselectBatch);
            }

            scene.dirty = false;
        };

        // make sure canvas is clear
        scene.clear = function clear() {
            var vpSize = fullLayout._size;
            var width = fullLayout.width;
            var height = fullLayout.height;
            var xaxis = subplot.xaxis;
            var yaxis = subplot.yaxis;
            var vp, gl, regl;

            // multisubplot case
            if(xaxis && xaxis.domain && yaxis && yaxis.domain) {
                vp = [
                    vpSize.l + xaxis.domain[0] * vpSize.w,
                    vpSize.b + yaxis.domain[0] * vpSize.h,
                    (width - vpSize.r) - (1 - xaxis.domain[1]) * vpSize.w,
                    (height - vpSize.t) - (1 - yaxis.domain[1]) * vpSize.h
                ];
            }
            else {
                vp = [
                    vpSize.l,
                    vpSize.b,
                    (width - vpSize.r),
                    (height - vpSize.t)
                ];
            }

            if(scene.select2d) {
                regl = scene.select2d.regl;
                gl = regl._gl;
                gl.enable(gl.SCISSOR_TEST);
                gl.scissor(vp[0], vp[1], vp[2] - vp[0], vp[3] - vp[1]);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }

            if(scene.scatter2d) {
                regl = scene.scatter2d.regl;
                gl = regl._gl;
                gl.enable(gl.SCISSOR_TEST);
                gl.scissor(vp[0], vp[1], vp[2] - vp[0], vp[3] - vp[1]);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        };

        // remove selection
        scene.clearSelect = function clearSelect() {
            if(!scene.selectBatch) return;
            scene.selectBatch = null;
            scene.unselectBatch = null;
            scene.scatter2d.update(scene.markerOptions);
            scene.clear();
            scene.draw();
        };

        // remove scene resources
        scene.destroy = function destroy() {
            if(scene.fill2d) scene.fill2d.destroy();
            if(scene.scatter2d) scene.scatter2d.destroy();
            if(scene.error2d) scene.error2d.destroy();
            if(scene.line2d) scene.line2d.destroy();
            if(scene.select2d) scene.select2d.destroy();

            scene.lineOptions = null;
            scene.fillOptions = null;
            scene.markerOptions = null;
            scene.selectedOptions = null;
            scene.unselectedOptions = null;
            scene.errorXOptions = null;
            scene.errorYOptions = null;
            scene.selectBatch = null;
            scene.unselectBatch = null;

            delete subplot._scene;
        };
    }

    // In case if we have scene from the last calc - reset data
    if(!scene.dirty) {
        scene.dirty = true;
        scene.count = 0;
        scene.lineOptions = [];
        scene.fillOptions = [];
        scene.markerOptions = [];
        scene.selectedOptions = [];
        scene.unselectedOptions = [];
        scene.errorXOptions = [];
        scene.errorYOptions = [];
    }

    return scene;
}

function getSymbolSdf(symbol) {
    if(symbol === 'circle') return null;

    var symbolPath, symbolSdf;
    var symbolNumber = Drawing.symbolNumber(symbol);
    var symbolFunc = Drawing.symbolFuncs[symbolNumber % 100];
    var symbolNoDot = !!Drawing.symbolNoDot[symbolNumber % 100];
    var symbolNoFill = !!Drawing.symbolNoFill[symbolNumber % 100];

    var isDot = DOT_RE.test(symbol);

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

function plot(gd, subplot, cdata) {
    if(!cdata.length) return;

    var fullLayout = gd._fullLayout;
    var scene = cdata[0][0].t.scene;
    var dragmode = fullLayout.dragmode;

    // we may have more subplots than initialized data due to Axes.getSubplots method
    if(!scene) return;

    var vpSize = fullLayout._size;
    var width = fullLayout.width;
    var height = fullLayout.height;

    // make sure proper regl instances are created
    fullLayout._glcanvas.each(function(d) {
        if(d.regl || d.pick) return;
        d.regl = createRegl({
            canvas: this,
            attributes: {
                antialias: !d.pick,
                preserveDrawingBuffer: true
            },
            extensions: ['ANGLE_instanced_arrays', 'OES_element_index_uint'],
            pixelRatio: gd._context.plotGlPixelRatio || global.devicePixelRatio
        });
    });

    var regl = fullLayout._glcanvas.data()[0].regl;

    // that is needed for fills
    linkTraces(gd, subplot, cdata);

    if(scene.dirty) {
        // make sure scenes are created
        if(scene.error2d === true) {
            scene.error2d = createError(regl);
        }
        if(scene.line2d === true) {
            scene.line2d = createLine(regl);
        }
        if(scene.scatter2d === true) {
            scene.scatter2d = createScatter(regl);
        }
        if(scene.fill2d === true) {
            scene.fill2d = createLine(regl);
        }

        // update main marker options
        if(scene.line2d) {
            scene.line2d.update(scene.lineOptions);
        }
        if(scene.error2d) {
            var errorBatch = (scene.errorXOptions || []).concat(scene.errorYOptions || []);
            scene.error2d.update(errorBatch);
        }
        if(scene.scatter2d) {
            scene.scatter2d.update(scene.markerOptions);
        }
        // fill requires linked traces, so we generate it's positions here
        if(scene.fill2d) {
            scene.fillOptions = scene.fillOptions.map(function(fillOptions, i) {
                var cdscatter = cdata[i];
                if(!fillOptions || !cdscatter || !cdscatter[0] || !cdscatter[0].trace) return null;
                var cd = cdscatter[0];
                var trace = cd.trace;
                var stash = cd.t;
                var lineOptions = scene.lineOptions[i];
                var last, j;

                var pos = [], srcPos = (lineOptions && lineOptions.positions) || stash.positions;

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
                else if(trace.fill === 'toself' || trace.fill === 'tonext') {
                    pos = [];
                    last = 0;
                    for(j = 0; j < srcPos.length; j += 2) {
                        if(isNaN(srcPos[j]) || isNaN(srcPos[j + 1])) {
                            pos = pos.concat(srcPos.slice(last, j));
                            pos.push(srcPos[last], srcPos[last + 1]);
                            last = j + 2;
                        }
                    }
                    pos = pos.concat(srcPos.slice(last));
                    if(last) {
                        pos.push(srcPos[last], srcPos[last + 1]);
                    }
                }
                else {
                    var nextTrace = trace._nexttrace;

                    if(nextTrace) {
                        var nextOptions = scene.lineOptions[i + 1];

                        if(nextOptions) {
                            var nextPos = nextOptions.positions;
                            if(trace.fill === 'tonexty') {
                                pos = srcPos.slice();

                                for(i = Math.floor(nextPos.length / 2); i--;) {
                                    var xx = nextPos[i * 2], yy = nextPos[i * 2 + 1];
                                    if(isNaN(xx) || isNaN(yy)) continue;
                                    pos.push(xx);
                                    pos.push(yy);
                                }
                                fillOptions.fill = nextTrace.fillcolor;
                            }
                        }
                    }
                }

                // detect prev trace positions to exclude from current fill
                if(trace._prevtrace && trace._prevtrace.fill === 'tonext') {
                    var prevLinePos = scene.lineOptions[i - 1].positions;

                    // FIXME: likely this logic should be tested better
                    var offset = pos.length / 2;
                    last = offset;
                    var hole = [last];
                    for(j = 0; j < prevLinePos.length; j += 2) {
                        if(isNaN(prevLinePos[j]) || isNaN(prevLinePos[j + 1])) {
                            hole.push(j / 2 + offset + 1);
                            last = j + 2;
                        }
                    }

                    pos = pos.concat(prevLinePos);
                    fillOptions.hole = hole;
                }

                fillOptions.opacity = trace.opacity;
                fillOptions.positions = pos;

                return fillOptions;
            });

            scene.fill2d.update(scene.fillOptions);
        }
    }

    var selectMode = dragmode === 'lasso' || dragmode === 'select';

    // provide viewport and range
    var vpRange = cdata.map(function(cdscatter) {
        if(!cdscatter || !cdscatter[0] || !cdscatter[0].trace) return;
        var cd = cdscatter[0];
        var trace = cd.trace;
        var stash = cd.t;
        var id = stash.index;
        var x = stash.x;
        var y = stash.y;

        var xaxis = subplot.xaxis || Axes.getFromId(gd, trace.xaxis || 'x');
        var yaxis = subplot.yaxis || Axes.getFromId(gd, trace.yaxis || 'y');
        var i;

        var range = [
            (xaxis._rl || xaxis.range)[0],
            (yaxis._rl || yaxis.range)[0],
            (xaxis._rl || xaxis.range)[1],
            (yaxis._rl || yaxis.range)[1]
        ];

        var viewport = [
            vpSize.l + xaxis.domain[0] * vpSize.w,
            vpSize.b + yaxis.domain[0] * vpSize.h,
            (width - vpSize.r) - (1 - xaxis.domain[1]) * vpSize.w,
            (height - vpSize.t) - (1 - yaxis.domain[1]) * vpSize.h
        ];

        if(trace.selectedpoints || selectMode) {
            if(!selectMode) selectMode = true;

            if(!scene.selectBatch) scene.selectBatch = [];
            if(!scene.unselectBatch) scene.unselectBatch = [];

            // regenerate scene batch, if traces number changed during selection
            if(trace.selectedpoints) {
                scene.selectBatch[id] = trace.selectedpoints;

                var selPts = trace.selectedpoints;
                var selDict = {};
                for(i = 0; i < selPts.length; i++) {
                    selDict[selPts[i]] = true;
                }
                var unselPts = [];
                for(i = 0; i < stash.count; i++) {
                    if(!selDict[i]) unselPts.push(i);
                }
                scene.unselectBatch[id] = unselPts;
            }

            // precalculate px coords since we are not going to pan during select
            var xpx = new Array(stash.count);
            var ypx = new Array(stash.count);
            for(i = 0; i < stash.count; i++) {
                xpx[i] = xaxis.c2p(x[i]);
                ypx[i] = yaxis.c2p(y[i]);
            }
            stash.xpx = xpx;
            stash.ypx = ypx;
        }
        else {
            stash.xpx = stash.ypx = null;
        }

        return trace.visible ? {
            viewport: viewport,
            range: range
        } : null;
    });

    if(selectMode) {
        // create select2d
        if(!scene.select2d) {
            // create scatter instance by cloning scatter2d
            scene.select2d = createScatter(fullLayout._glcanvas.data()[1].regl, {clone: scene.scatter2d});
        }

        if(scene.scatter2d && scene.selectBatch && scene.selectBatch.length) {
            // update only traces with selection
            scene.scatter2d.update(scene.unselectedOptions.map(function(opts, i) {
                return scene.selectBatch[i] ? opts : null;
            }));
        }

        if(scene.select2d) {
            scene.select2d.update(scene.markerOptions);
            scene.select2d.update(scene.selectedOptions);
        }
    }

    // uploat viewport/range data to GPU
    if(scene.fill2d) {
        scene.fill2d.update(vpRange);
    }
    if(scene.line2d) {
        scene.line2d.update(vpRange);
    }
    if(scene.error2d) {
        scene.error2d.update(vpRange.concat(vpRange));
    }
    if(scene.scatter2d) {
        scene.scatter2d.update(vpRange);
    }
    if(scene.select2d) {
        scene.select2d.update(vpRange);
    }

    scene.draw();

    return;
}

function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var stash = cd[0].t;
    var trace = cd[0].trace;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var x = stash.x;
    var y = stash.y;
    var xpx = xa.c2p(xval);
    var ypx = ya.c2p(yval);
    var maxDistance = pointData.distance;
    var ids;

    // FIXME: make sure this is a proper way to calc search radius
    if(stash.tree) {
        var xl = xa.p2c(xpx - maxDistance);
        var xr = xa.p2c(xpx + maxDistance);
        var yl = ya.p2c(ypx - maxDistance);
        var yr = ya.p2c(ypx + maxDistance);

        if(hovermode === 'x') {
            ids = stash.tree.range(
                Math.min(xl, xr), Math.min(ya._rl[0], ya._rl[1]),
                Math.max(xl, xr), Math.max(ya._rl[0], ya._rl[1])
            );
        }
        else {
            ids = stash.tree.range(
                Math.min(xl, xr), Math.min(yl, yr),
                Math.max(xl, xr), Math.max(yl, yr)
            );
        }
    }
    else if(stash.ids) {
        ids = stash.ids;
    }
    else return [pointData];

    // pick the id closest to the point
    // note that point possibly may not be found
    var minDist = maxDistance;
    var id, ptx, pty, i, dx, dy, dist, dxy;

    if(hovermode === 'x') {
        for(i = 0; i < ids.length; i++) {
            ptx = x[ids[i]];
            dx = Math.abs(xa.c2p(ptx) - xpx);
            if(dx < minDist) {
                minDist = dx;
                dy = ya.c2p(y[ids[i]]) - ypx;
                dxy = Math.sqrt(dx * dx + dy * dy);
                id = ids[i];
            }
        }
    }
    else {
        for(i = 0; i < ids.length; i++) {
            ptx = x[ids[i]];
            pty = y[ids[i]];
            dx = xa.c2p(ptx) - xpx;
            dy = ya.c2p(pty) - ypx;

            dist = Math.sqrt(dx * dx + dy * dy);
            if(dist < minDist) {
                minDist = dxy = dist;
                id = ids[i];
            }
        }
    }

    pointData.index = id;

    if(id === undefined) return [pointData];

    // the closest data point
    var di = {
        pointNumber: id,
        x: x[id],
        y: y[id]
    };

    // that is single-item arrays_to_calcdata excerpt, since we are doing it for a single point and we don't have to do it beforehead for 1e6 points
    di.tx = Array.isArray(trace.text) ? trace.text[id] : trace.text;
    di.htx = Array.isArray(trace.hovertext) ? trace.hovertext[id] : trace.hovertext;
    di.data = Array.isArray(trace.customdata) ? trace.customdata[id] : trace.customdata;
    di.tp = Array.isArray(trace.textposition) ? trace.textposition[id] : trace.textposition;

    var font = trace.textfont;
    if(font) {
        di.ts = Array.isArray(font.size) ? font.size[id] : font.size;
        di.tc = Array.isArray(font.color) ? font.color[id] : font.color;
        di.tf = Array.isArray(font.family) ? font.family[id] : font.family;
    }

    var marker = trace.marker;
    if(marker) {
        di.ms = Lib.isArrayOrTypedArray(marker.size) ? marker.size[id] : marker.size;
        di.mo = Lib.isArrayOrTypedArray(marker.opacity) ? marker.opacity[id] : marker.opacity;
        di.mx = Array.isArray(marker.symbol) ? marker.symbol[id] : marker.symbol;
        di.mc = Lib.isArrayOrTypedArray(marker.color) ? marker.color[id] : marker.color;
    }

    var line = marker && marker.line;
    if(line) {
        di.mlc = Array.isArray(line.color) ? line.color[id] : line.color;
        di.mlw = Lib.isArrayOrTypedArray(line.width) ? line.width[id] : line.width;
    }

    var grad = marker && marker.gradient;
    if(grad && grad.type !== 'none') {
        di.mgt = Array.isArray(grad.type) ? grad.type[id] : grad.type;
        di.mgc = Array.isArray(grad.color) ? grad.color[id] : grad.color;
    }

    var xp = xa.c2p(di.x, true);
    var yp = ya.c2p(di.y, true);
    var rad = di.mrc || 1;

    var hoverlabel = trace.hoverlabel;

    if(hoverlabel) {
        di.hbg = Array.isArray(hoverlabel.bgcolor) ? hoverlabel.bgcolor[id] : hoverlabel.bgcolor;
        di.hbc = Array.isArray(hoverlabel.bordercolor) ? hoverlabel.bordercolor[id] : hoverlabel.bordercolor;
        di.hts = Array.isArray(hoverlabel.font.size) ? hoverlabel.font.size[id] : hoverlabel.font.size;
        di.htc = Array.isArray(hoverlabel.font.color) ? hoverlabel.font.color[id] : hoverlabel.font.color;
        di.htf = Array.isArray(hoverlabel.font.family) ? hoverlabel.font.family[id] : hoverlabel.font.family;
        di.hnl = Array.isArray(hoverlabel.namelength) ? hoverlabel.namelength[id] : hoverlabel.namelength;
    }
    var hoverinfo = trace.hoverinfo;
    if(hoverinfo) {
        di.hi = Array.isArray(hoverinfo) ? hoverinfo[id] : hoverinfo;
    }

    var fakeCd = {};
    fakeCd[pointData.index] = di;

    Lib.extendFlat(pointData, {
        color: getTraceColor(trace, di),

        x0: xp - rad,
        x1: xp + rad,
        xLabelVal: di.x,

        y0: yp - rad,
        y1: yp + rad,
        yLabelVal: di.y,

        cd: fakeCd,
        distance: minDist,
        spikeDistance: dxy
    });

    if(di.htx) pointData.text = di.htx;
    else if(di.tx) pointData.text = di.tx;
    else if(trace.text) pointData.text = trace.text;

    fillHoverText(di, trace, pointData);
    ErrorBars.hoverInfo(di, trace, pointData);

    return [pointData];
}

function selectPoints(searchInfo, polygon) {
    var cd = searchInfo.cd;
    var selection = [];
    var trace = cd[0].trace;
    var stash = cd[0].t;
    var x = stash.x;
    var y = stash.y;
    var scene = stash.scene;

    if(!scene) return selection;

    var hasOnlyLines = (!subTypes.hasMarkers(trace) && !subTypes.hasText(trace));
    if(trace.visible !== true || hasOnlyLines) return selection;

    // degenerate polygon does not enable selection
    // filter out points by visible scatter ones
    var els = null;
    var unels = null;
    var i;
    if(polygon !== false && !polygon.degenerate) {
        els = [], unels = [];
        for(i = 0; i < stash.count; i++) {
            if(polygon.contains([stash.xpx[i], stash.ypx[i]])) {
                els.push(i);
                selection.push({
                    pointNumber: i,
                    x: x[i],
                    y: y[i]
                });
            }
            else {
                unels.push(i);
            }
        }
    } else {
        unels = arrayRange(stash.count);
    }

    // make sure selectBatch is created
    if(!scene.selectBatch) {
        scene.selectBatch = [];
        scene.unselectBatch = [];
    }

    if(!scene.selectBatch[stash.index]) {
        // enter every trace select mode
        for(i = 0; i < scene.count; i++) {
            scene.selectBatch[i] = [];
            scene.unselectBatch[i] = [];
        }
        // we should turn scatter2d into unselected once we have any points selected
        scene.scatter2d.update(scene.unselectedOptions);
    }

    scene.selectBatch[stash.index] = els;
    scene.unselectBatch[stash.index] = unels;

    return selection;
}

function style(gd, cd) {
    if(cd) {
        var stash = cd[0].t;
        var scene = stash.scene;
        scene.clear();
        scene.draw();
    }
}

module.exports = {
    moduleType: 'trace',
    name: 'scattergl',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['gl', 'regl', 'cartesian', 'symbols', 'errorBarsOK', 'markerColorscale', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    cleanData: require('../scatter/clean_data'),
    colorbar: require('../scatter/colorbar'),
    calc: calc,
    plot: plot,
    hoverPoints: hoverPoints,
    style: style,
    selectPoints: selectPoints,

    sceneOptions: sceneOptions,
    sceneUpdate: sceneUpdate,

    meta: {
        hrName: 'scatter_gl',
        description: [
            'The data visualized as scatter point or lines is set in `x` and `y`',
            'using the WebGL plotting engine.',
            'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
            'to a numerical arrays.'
        ].join(' ')
    }
};
