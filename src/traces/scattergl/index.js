/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var getTraceColor = require('../scatter/get_trace_color');
var ErrorBars = require('../../components/errorbars');
var extend = require('object-assign');
var Axes = require('../../plots/cartesian/axes');
var kdtree = require('kdgrass');
var Fx = require('../../components/fx');
var subTypes = require('../scatter/subtypes');
var calcColorscales = require('../scatter/colorscale_calc');
var Drawing = require('../../components/drawing');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');
var DASHES = require('../../constants/gl2d_dashes');
var formatColor = require('../../lib/gl_format_color');
var linkTraces = require('../scatter/link_traces');
var createScatter = require('regl-scatter2d');
var createLine = require('regl-line2d');
var createError = require('regl-error2d');
var svgSdf = require('svg-path-sdf');
var createRegl = require('regl');
var fillHoverText = require('../scatter/fill_hover_text');
var isNumeric = require('fast-isnumeric');
var Scatter = require('../scatter');

var MAXDIST = Fx.constants.MAXDIST;
var SYMBOL_SDF_SIZE = 200;
var SYMBOL_SIZE = 20;
var SYMBOL_STROKE = SYMBOL_SIZE / 20;
var SYMBOL_SDF = {};
var SYMBOL_SVG_CIRCLE = Drawing.symbolFuncs[0](SYMBOL_SIZE * 0.05);
var TOO_MANY_POINTS = 1e5;
var DOT_RE = /-dot/;


var ScatterGl = module.exports = {};

ScatterGl.name = 'scattergl';
ScatterGl.categories = ['gl', 'regl', 'cartesian', 'symbols', 'errorBarsOK', 'markerColorscale', 'showLegend', 'scatter-like'];
ScatterGl.attributes = require('./attributes');
ScatterGl.supplyDefaults = require('./defaults');
ScatterGl.cleanData = Scatter.cleanData;
ScatterGl.arraysToCalcdata = Scatter.arraysToCalcdata;
ScatterGl.colorbar = Scatter.colorbar;
ScatterGl.meta = Scatter.meta;
ScatterGl.animatable = true;
ScatterGl.hasLines = subTypes.hasLines;
ScatterGl.hasMarkers = subTypes.hasMarkers;
ScatterGl.hasText = subTypes.hasText;
ScatterGl.isBubble = subTypes.isBubble;
ScatterGl.moduleType = 'trace';
ScatterGl.basePlotModule = require('../../plots/cartesian');


ScatterGl.calc = function calc(container, trace) {
    var layout = container._fullLayout;
    var positions;
    var stash = {};
    var xaxis = Axes.getFromId(container, trace.xaxis);
    var yaxis = Axes.getFromId(container, trace.yaxis);

    var subplot = layout._plots[trace.xaxis + trace.yaxis];

    var x = xaxis.type === 'linear' ? trace.x : xaxis.makeCalcdata(trace, 'x');
    var y = yaxis.type === 'linear' ? trace.y : yaxis.makeCalcdata(trace, 'y');

    var count = (x || y).length, i, l, xx, yy;

    if(!x) {
        x = Array(count);
        for(i = 0; i < count; i++) {
            x[i] = i;
        }
    }
    if(!y) {
        y = Array(count);
        for(i = 0; i < count; i++) {
            y[i] = i;
        }
    }

    // get log converted positions
    var rawx, rawy;
    if(xaxis.type === 'log') {
        rawx = Array(x.length);
        for(i = 0, l = x.length; i < l; i++) {
            rawx[i] = x[i];
            x[i] = xaxis.d2l(x[i]);
        }
    }
    else {
        rawx = x;
        for(i = 0, l = x.length; i < l; i++) {
            x[i] = parseFloat(x[i]);
        }
    }
    if(yaxis.type === 'log') {
        rawy = Array(y.length);
        for(i = 0, l = y.length; i < l; i++) {
            rawy[i] = y[i];
            y[i] = yaxis.d2l(y[i]);
        }
    }
    else {
        rawy = y;
        for(i = 0, l = y.length; i < l; i++) {
            y[i] = parseFloat(y[i]);
        }
    }

    // we need hi-precision for scatter2d
    positions = new Array(count * 2);

    for(i = 0; i < count; i++) {
        // if no x defined, we are creating simple int sequence (API)
        // we use parseFloat because it gives NaN (we need that for empty values to avoid drawing lines) and it is incredibly fast
        xx = isNumeric(x[i]) ? +x[i] : NaN;
        yy = isNumeric(y[i]) ? +y[i] : NaN;

        positions[i * 2] = xx;
        positions[i * 2 + 1] = yy;
    }

    // we don't build a tree for log axes since it takes long to convert log2px
    // and it is also
    if(xaxis.type !== 'log' && yaxis.type !== 'log') {
        // FIXME: delegate this to webworker
        stash.tree = kdtree(positions, 512);
    }
    else {
        var ids = stash.ids = Array(count);
        for(i = 0; i < count; i++) {
            ids[i] = i;
        }
    }


    calcColorscales(trace);

    var options = ScatterGl.sceneOptions(container, subplot, trace, positions);

    // expanding axes is separate from options
    if(!options.markers) {
        Axes.expand(xaxis, rawx, { padded: true });
        Axes.expand(yaxis, rawy, { padded: true });
    }
    else if(Array.isArray(options.markers.sizes)) {
        var sizes = options.markers.sizes;
        Axes.expand(xaxis, rawx, { padded: true, ppad: sizes });
        Axes.expand(yaxis, rawy, { padded: true, ppad: sizes });
    }
    else {
        var xbounds = [Infinity, -Infinity], ybounds = [Infinity, -Infinity];
        var size = options.markers.size;

        // axes bounds
        for(i = 0; i < count; i++) {
            xx = x[i], yy = y[i];
            if(xbounds[0] > xx) xbounds[0] = xx;
            if(xbounds[1] < xx) xbounds[1] = xx;
            if(ybounds[0] > yy) ybounds[0] = yy;
            if(ybounds[1] < yy) ybounds[1] = yy;
        }

        // FIXME: is there a better way to separate expansion?
        if(count < TOO_MANY_POINTS) {
            Axes.expand(xaxis, rawx, { padded: true, ppad: size });
            Axes.expand(yaxis, rawy, { padded: true, ppad: size });
        }
        // update axes fast for big number of points
        else {
            if(xaxis._min) {
                xaxis._min.push({ val: xbounds[0], pad: size });
            }
            if(xaxis._max) {
                xaxis._max.push({ val: xbounds[1], pad: size });
            }

            if(yaxis._min) {
                yaxis._min.push({ val: ybounds[0], pad: size });
            }
            if(yaxis._max) {
                yaxis._max.push({ val: ybounds[1], pad: size });
            }
        }
    }

    // create scene
    var scene = ScatterGl.scene(container, subplot);

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
    stash.rawx = rawx;
    stash.rawy = rawy;
    stash.positions = positions;
    stash.count = count;

    return [{x: false, y: false, t: stash, trace: trace}];
};


// create scene options
ScatterGl.sceneOptions = function sceneOptions(container, subplot, trace, positions) {
    var layout = container._fullLayout;
    var count = positions.length / 2;
    var markerOpts = trace.marker;
    var i, ptrX = 0, ptrY = 0;

    var hasLines, hasErrorX, hasErrorY, hasError, hasMarkers, hasFill;

    if(trace.visible !== true) {
        hasLines = false;
        hasErrorX = false;
        hasErrorY = false;
        hasMarkers = false;
        hasFill = false;
    }
    else {
        hasLines = subTypes.hasLines(trace) && positions.length > 1;
        hasErrorX = trace.error_x && trace.error_x.visible === true;
        hasErrorY = trace.error_y && trace.error_y.visible === true;
        hasError = hasErrorX || hasErrorY;
        hasMarkers = subTypes.hasMarkers(trace);
        hasFill = !!trace.fill && trace.fill !== 'none';
    }

    var lineOptions, markerOptions, errorXOptions, errorYOptions, fillOptions, selectedOptions, unselectedOptions;
    var linePositions;

    // get error values
    var errorVals = hasError ? ErrorBars.calcFromTrace(trace, layout) : null;

    if(hasErrorX) {
        errorXOptions = {};
        errorXOptions.positions = positions;
        var errorsX = new Float64Array(4 * count);

        for(i = 0; i < count; ++i) {
            errorsX[ptrX++] = positions[i * 2] - errorVals[i].xs || 0;
            errorsX[ptrX++] = errorVals[i].xh - positions[i * 2] || 0;
            errorsX[ptrX++] = 0;
            errorsX[ptrX++] = 0;
        }

        if(trace.error_x.copy_ystyle) {
            trace.error_x = trace.error_y;
        }

        errorXOptions.positions = positions;
        errorXOptions.errors = errorsX;
        errorXOptions.capSize = trace.error_x.width * 2;
        errorXOptions.lineWidth = trace.error_x.thickness;
        errorXOptions.color = trace.error_x.color;
    }

    if(hasErrorY) {
        errorYOptions = {};
        errorYOptions.positions = positions;
        var errorsY = new Float64Array(4 * count);

        for(i = 0; i < count; ++i) {
            errorsY[ptrY++] = 0;
            errorsY[ptrY++] = 0;
            errorsY[ptrY++] = positions[i * 2 + 1] - errorVals[i].ys || 0;
            errorsY[ptrY++] = errorVals[i].yh - positions[i * 2 + 1] || 0;
        }

        errorYOptions.positions = positions;
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
        lineOptions.join = (hasNaN || linePositions.length > TOO_MANY_POINTS) ? 'rect' : hasMarkers ? 'rect' : 'round';

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
        selectedOptions = trace.selected ? makeMarkerOptions(extend({}, markerOpts, trace.selected.marker)) : markerOptions;
        unselectedOptions = trace.unselected ? makeMarkerOptions(extend({}, markerOpts, trace.unselected.marker)) : markerOptions;

        markerOptions.positions = positions;
    }

    function makeMarkerOptions(markerOpts) {
        var markerOptions = {}, i;

        // get basic symbol info
        var multiMarker = Array.isArray(markerOpts.symbol);
        var isOpen, symbol;
        if(!multiMarker) {
            isOpen = /-open/.test(markerOpts.symbol);
        }
        // prepare colors
        if(multiMarker || Array.isArray(markerOpts.color) || Array.isArray(markerOpts.line.color) || Array.isArray(markerOpts.line) || Array.isArray(markerOpts.opacity)) {
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
                if(multiMarker) {
                    symbol = markerOpts.symbol[i];
                    isOpen = /-open/.test(symbol);
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
            markerOptions.color = markerOpts.color;
            markerOptions.borderColor = markerOpts.line.color;
            markerOptions.opacity = trace.opacity * markerOpts.opacity;

            if(isOpen) {
                markerOptions.borderColor = markerOptions.color.slice();
                markerOptions.color = markerOptions.color.slice();
                markerOptions.color[3] = 0;
            }
        }

        // prepare markers
        if(Array.isArray(markerOpts.symbol)) {
            markerOptions.markers = new Array(count);
            for(i = 0; i < count; ++i) {
                markerOptions.markers[i] = getSymbolSdf(markerOpts.symbol[i]);
            }
        }
        else {
            markerOptions.marker = getSymbolSdf(markerOpts.symbol);
        }

        // prepare sizes and expand axes
        var multiSize = markerOpts && (Array.isArray(markerOpts.size) || Array.isArray(markerOpts.line.width));
        var markerSizeFunc = makeBubbleSizeFn(trace);
        var size, sizes;

        if(multiSize) {
            sizes = markerOptions.sizes = new Array(count);
            var borderSizes = markerOptions.borderSizes = new Array(count);

            if(Array.isArray(markerOpts.size)) {
                for(i = 0; i < count; ++i) {
                    sizes[i] = markerSizeFunc(markerOpts.size[i]);
                }
            }
            else {
                size = markerSizeFunc(markerOpts.size);
                for(i = 0; i < count; ++i) {
                    sizes[i] = size;
                }
            }

            // See  https://github.com/plotly/plotly.js/pull/1781#discussion_r121820798
            if(Array.isArray(markerOpts.line.width)) {
                for(i = 0; i < count; ++i) {
                    borderSizes[i] = markerOpts.line.width[i] * 0.5;
                }
            }
            else {
                size = markerSizeFunc(markerOpts.line.width) * 0.5;
                for(i = 0; i < count; ++i) {
                    borderSizes[i] = size;
                }
            }
        }
        else {
            size = markerOptions.size = markerSizeFunc(markerOpts && markerOpts.size || 10);
            markerOptions.borderSizes = markerOpts.line.width * 0.5;
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
};


// make sure scene exists on subplot, return it
ScatterGl.scene = function getScene(container, subplot) {
    var scene = subplot._scene;
    var layout = container._fullLayout;

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
            if(scene.error2d) scene.error2d.update([].push.apply(opts, opts));
            if(scene.select2d) scene.select2d.update(opts);

            scene.draw();
        };

        // draw traces in proper order
        scene.draw = function draw() {
            for(var i = 0; i < scene.count; i++) {
                if(scene.fill2d) scene.fill2d.draw(i);
                if(scene.line2d) {
                    scene.line2d.draw(i);
                }
                if(scene.error2d) {
                    scene.error2d.draw(i);
                    scene.error2d.draw(i + scene.count);
                }
                if(scene.scatter2d && !scene.selectBatch) {
                    scene.scatter2d.draw(i);
                }
            }

            // persistent selection draw
            if(scene.select2d && scene.selectBatch) {
                scene.select2d.draw(scene.selectBatch);
                scene.scatter2d.draw(scene.unselectBatch);
            }

            scene.dirty = false;
        };

        // make sure canvas is clear
        scene.clear = function clear() {
            var vpSize = layout._size, width = layout.width, height = layout.height;
            var vp = [
                vpSize.l,
                vpSize.b,
                (width - vpSize.r),
                (height - vpSize.t)
            ];

            var gl, regl;

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
};


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


ScatterGl.plot = function plot(container, subplot, cdata) {
    var layout = container._fullLayout;
    var stash = cdata[0][0].t;
    var scene = stash.scene;

    // we may have more subplots than initialized data due to Axes.getSubplots method
    if(!scene) return;

    var vpSize = layout._size, width = layout.width, height = layout.height;

    // make sure proper regl instances are created
    layout._glcanvas.each(function(d) {
        if(d.regl || d.pick) return;
        d.regl = createRegl({
            canvas: this,
            attributes: {
                antialias: !d.pick,
                preserveDrawingBuffer: true
            },
            extensions: ['ANGLE_instanced_arrays', 'OES_element_index_uint'],
            pixelRatio: container._context.plotGlPixelRatio || global.devicePixelRatio
        });
    });

    var regl = layout._glcanvas.data()[0].regl;

    // that is needed for fills
    linkTraces(container, subplot, cdata);

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

        if(scene.line2d) {
            scene.line2d.update(scene.lineOptions);
        }
        if(scene.error2d) {
            var errorBatch = (scene.errorXOptions || []).concat(scene.errorYOptions || []);
            scene.error2d.update(errorBatch);
        }
        if(scene.scatter2d) {
            if(!scene.selectBatch) {
                scene.scatter2d.update(scene.markerOptions);
            }
            else {
                scene.scatter2d.update(scene.unselectedOptions);
                scene.select2d.update(scene.selectedOptions);
            }
        }
        // fill requires linked traces, so we generate it's positions here
        if(scene.fill2d) {
            scene.fillOptions.forEach(function(fillOptions, i) {
                var cdscatter = cdata[i];
                if(!cdscatter || !cdscatter[0] || !cdscatter[0].trace) return;
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
            });

            scene.fill2d.update(scene.fillOptions);
        }
    }

    // make sure selection layer is initialized if we require selection
    var dragmode = layout.dragmode;

    if(dragmode === 'lasso' || dragmode === 'select') {
        if(scene.select2d && scene.selectBatch) {
            scene.scatter2d.update(scene.unselectedOptions);
        }
    }

    // provide viewport and range
    var vpRange = cdata.map(function(cdscatter) {
        if(!cdscatter || !cdscatter[0] || !cdscatter[0].trace) return;
        var cd = cdscatter[0];
        var trace = cd.trace;
        var stash = cd.t;
        var x = stash.rawx,
            y = stash.rawy;

        var xaxis = subplot.xaxis || Axes.getFromId(container, trace.xaxis || 'x');
        var yaxis = subplot.yaxis || Axes.getFromId(container, trace.yaxis || 'y');
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

        if(trace.selectedpoints || dragmode === 'lasso' || dragmode === 'select') {
            // create select2d
            if(!scene.select2d && scene.scatter2d) {
                var selectRegl = layout._glcanvas.data()[1].regl;

                // smol hack to create scatter instance by cloning scatter2d
                scene.select2d = createScatter(selectRegl, {clone: scene.scatter2d});
                scene.select2d.update(scene.selectedOptions);

                // create selection style once we have something selected
                if(trace.selectedpoints && !scene.selectBatch) {
                    scene.selectBatch = Array(scene.count);
                    scene.unselectBatch = Array(scene.count);
                    scene.scatter2d.update(scene.unselectedOptions);
                }
            }
            else {
                // update selection positions, since they may have changed by panning or alike
                scene.select2d.update(scene.selectedOptions);
            }

            // form unselected batch
            if(trace.selectedpoints && !scene.unselectBatch[stash.index]) {
                scene.selectBatch[stash.index] = trace.selectedpoints;
                var selPts = trace.selectedpoints;
                var selDict = {};
                for(i = 0; i < selPts.length; i++) {
                    selDict[selPts[i]] = true;
                }
                var unselPts = [];
                for(i = 0; i < stash.count; i++) {
                    if(!selDict[i]) unselPts.push(i);
                }
                scene.unselectBatch[stash.index] = unselPts;
            }

            // precalculate px coords since we are not going to pan during select
            var xpx = Array(stash.count), ypx = Array(stash.count);
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
};


ScatterGl.hoverPoints = function hover(pointData, xval, yval, hovermode) {
    var cd = pointData.cd,
        stash = cd[0].t,
        trace = cd[0].trace,
        xa = pointData.xa,
        ya = pointData.ya,
        x = stash.rawx,
        y = stash.rawy,
        xpx = xa.c2p(xval),
        ypx = ya.c2p(yval),
        ids;

    // FIXME: make sure this is a proper way to calc search radius
    if(stash.tree) {
        if(hovermode === 'x') {
            ids = stash.tree.range(
                xa.p2c(xpx - MAXDIST), ya._rl[0],
                xa.p2c(xpx + MAXDIST), ya._rl[1]
            );
        }
        else {
            ids = stash.tree.range(
                xa.p2c(xpx - MAXDIST), ya.p2c(ypx + MAXDIST),
                xa.p2c(xpx + MAXDIST), ya.p2c(ypx - MAXDIST)
            );
        }
    }
    else if(stash.ids) {
        ids = stash.ids;
    }
    else return [pointData];

    // pick the id closest to the point
    // note that point possibly may not be found
    var min = MAXDIST, id, ptx, pty, i, dx, dy, dist;

    if(hovermode === 'x') {
        for(i = 0; i < ids.length; i++) {
            ptx = x[ids[i]];
            dx = Math.abs(xa.c2p(ptx) - xpx);
            if(dx < min) {
                min = dx;
                id = ids[i];
            }
        }
    }
    else {
        for(i = 0; i < ids.length; i++) {
            ptx = x[ids[i]];
            pty = y[ids[i]];
            dx = xa.c2p(ptx) - xpx, dy = ya.c2p(pty) - ypx;

            dist = Math.sqrt(dx * dx + dy * dy);
            if(dist < min) {
                min = dist;
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
        di.ms = Array.isArray(marker.size) ? marker.size[id] : marker.size;
        di.mo = Array.isArray(marker.opacity) ? marker.opacity[id] : marker.opacity;
        di.mx = Array.isArray(marker.symbol) ? marker.symbol[id] : marker.symbol;
        di.mc = Array.isArray(marker.color) ? marker.color[id] : marker.color;
    }

    var line = marker && marker.line;
    if(line) {
        di.mlc = Array.isArray(line.color) ? line.color[id] : line.color;
        di.mlw = Array.isArray(line.width) ? line.width[id] : line.width;
    }

    var grad = marker && marker.gradient;
    if(grad && grad.type !== 'none') {
        di.mgt = Array.isArray(grad.type) ? grad.type[id] : grad.type;
        di.mgc = Array.isArray(grad.color) ? grad.color[id] : grad.color;
    }

    var xc = xa.c2p(di.x, true),
        yc = ya.c2p(di.y, true),
        rad = di.mrc || 1;

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

        x0: xc - rad,
        x1: xc + rad,
        xLabelVal: di.x,

        y0: yc - rad,
        y1: yc + rad,
        yLabelVal: di.y,

        cd: fakeCd
    });

    if(di.htx) pointData.text = di.htx;
    else if(di.tx) pointData.text = di.tx;
    else if(trace.text) pointData.text = trace.text;

    fillHoverText(di, trace, pointData);
    ErrorBars.hoverInfo(di, trace, pointData);

    return [pointData];
};


ScatterGl.selectPoints = function select(searchInfo, polygon) {
    var cd = searchInfo.cd,
        selection = [],
        trace = cd[0].trace,
        stash = cd[0].t,
        x = stash.x,
        y = stash.y;

    var scene = stash.scene;

    if(!scene) return selection;

    var hasOnlyLines = (!subTypes.hasMarkers(trace) && !subTypes.hasText(trace));
    if(trace.visible !== true || hasOnlyLines) return selection;

    // degenerate polygon does not enable selection
    // filter out points by visible scatter ones
    var els = null, unels = null, i;
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
    }
    else {
        unels = Array(stash.count);
        for(i = 0; i < stash.count; i++) {
            unels[i] = i;
        }
    }

    // create selection style once we have something selected
    if(!scene.selectBatch) {
        scene.selectBatch = Array(scene.count);
        scene.unselectBatch = Array(scene.count);
        scene.scatter2d.update(scene.unselectedOptions);
    }
    scene.selectBatch[stash.index] = els;
    scene.unselectBatch[stash.index] = unels;

    return selection;
};


ScatterGl.style = function style(gd, cd) {
    if(cd) {
        var stash = cd[0].t;
        var scene = stash.scene;
        scene.clear();
        scene.draw();
    }
};
