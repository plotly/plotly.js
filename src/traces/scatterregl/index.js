/**
* Copyright 2012-2017, Plotly, Inc.
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
var str2RGBArray = require('../../lib/str2rgbarray');
var formatColor = require('../../lib/gl_format_color');
var linkTraces = require('../scatter/link_traces');
var createScatter = require('regl-scatter2d');
var createLine = require('regl-line2d');
var createError = require('regl-error2d');
var svgSdf = require('svg-path-sdf');
var Plots = require('../../plots/plots');

var MAXDIST = Fx.constants.MAXDIST;
var DESELECTDIM = 0.2;
var TRANSPARENT = [0, 0, 0, 0];
var SYMBOL_SDF_SIZE = 200;
var SYMBOL_SIZE = 20;
var SYMBOL_STROKE = SYMBOL_SIZE / 20;
var SYMBOL_SDF = {};
var SYMBOL_SVG_CIRCLE = Drawing.symbolFuncs[0](SYMBOL_SIZE * 0.05);


var ScatterRegl = module.exports = extend({}, require('../scatter'));


ScatterRegl.name = 'scatterregl';
ScatterRegl.categories = ['gl', 'gl2d', 'regl', 'symbols', 'errorBarsOK', 'markerColorscale', 'showLegend', 'scatter-like'];

ScatterRegl.basePlotModule = require('./base');


ScatterRegl.calc = function calc(container, trace) {
    var layout = container._fullLayout;
    var positions;
    var stash = {};
    var xaxis = Axes.getFromId(container, trace.xaxis || 'x');
    var yaxis = Axes.getFromId(container, trace.yaxis || 'y');

    //FIXME: find a better way to obtain subplot object from trace
    var subplot = layout._plots[trace.xaxis + trace.yaxis];

    // makeCalcdata runs d2c (data-to-coordinate) on every point
    var x = xaxis.type === 'linear' ? trace.x : xaxis.makeCalcdata(trace, 'x');
    var y = yaxis.type === 'linear' ? trace.y : yaxis.makeCalcdata(trace, 'y');

    var count = Math.max(x.length, y.length), i, l, xx, yy, ptrX = 0, ptrY = 0;
    var lineOptions = stash.line = {},
        scatterOptions = stash.scatter = {},
        errorOptions = {},
        errorXOptions = stash.errorX = {},
        errorYOptions = stash.errorY = {},
        fillOptions = stash.fill = {};
    var selection = trace.selection;
    var sizes, selIds;
    var hasLines, hasErrorX, hasErrorY, hasMarkers, hasFill;
    var linePositions;

    // calculate axes range
    // FIXME: probably we may want to have more complex ppad calculation
    // FIXME: that is pretty slow thing here @etpinard your assistance required
    Axes.expand(xaxis, x, 0);
    Axes.expand(yaxis, y, 0);

    // convert log axes
    if(xaxis.type === 'log') {
        for(i = 0, l = x.length; i < l; i++) {
            x[i] = xaxis.d2l(x[i]);
        }
    }
    if(yaxis.type === 'log') {
        for(i = 0, l = y.length; i < l; i++) {
            y[i] = yaxis.d2l(y[i]);
        }
    }

    // we need hi-precision for scatter2d
    positions = new Array(count * 2);
    for(i = 0; i < count; i++) {
        positions[i * 2] = +x[i];
        positions[i * 2 + 1] = +y[i];
    }

    calcColorscales(trace);

    // TODO: delegate this to webworker if possible (potential )
    // FIXME: make sure it is a good place to store the tree
    stash._tree = kdtree(positions, 512);

    // stash data
    stash._x = x;
    stash._y = y;
    stash._positions = positions;

    // get error values
    var errorVals = (hasErrorX || hasErrorY) ? ErrorBars.calcFromTrace(trace, layout) : null;

    if(hasErrorX) {
        var errorsX = new Float64Array(4 * count);

        for(i = 0; i < count; ++i) {
            errorsX[ptrX++] = x[i] - errorVals[i].xs || 0;
            errorsX[ptrX++] = errorVals[i].xh - x[i] || 0;
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
        var errorsY = new Float64Array(4 * count);

        for(i = 0; i < count; ++i) {
            errorsY[ptrY++] = 0;
            errorsY[ptrY++] = 0;
            errorsY[ptrY++] = y[i] - errorVals[i].ys || 0;
            errorsY[ptrY++] = errorVals[i].yh - y[i] || 0;
        }

        errorYOptions.positions = positions;
        errorYOptions.errors = errorsY;
        errorYOptions.capSize = trace.error_y.width * 2;
        errorYOptions.lineWidth = trace.error_y.thickness;
        errorYOptions.color = trace.error_y.color;
    }

    if(hasLines) {
        lineOptions.thickness = trace.line.width;
        lineOptions.color = trace.line.color;
        lineOptions.opacity = trace.opacity;
        lineOptions.join = trace.opacity === 1.0 ? 'rect' : 'round';
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
        lineOptions.positions = linePositions;
    }

    if(hasFill) {
        fillOptions.fill = trace.fillcolor;
        fillOptions.thickness = 0;
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

    if(hasMarkers) {
        scatterOptions.positions = positions;

        var markerSizeFunc = makeBubbleSizeFn(trace);
        var markerOpts = trace.marker;

        //prepare colors
        if (Array.isArray(markerOpts.color) || Array.isArray(markerOpts.line.color)) {
            scatterOptions.colors = new Array(count);
            scatterOptions.borderColors = new Array(count);

            var colors = convertColorScale(markerOpts, markerOpacity, traceOpacity, count);
            var borderColors = convertColorScale(markerOpts.line, markerOpacity, traceOpacity, count);
            var _colors, _borderColors, bw;

            for(i = 0; i < count; ++i) {
                _colors = colors;

                if(isOpen) {
                    _borderColors = colors;
                } else {
                    _borderColors = borderColors;
                }

                var optColors = scatterOptions.colors;
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
                    optColors[i][3] = _colors[4 * i + 3] * 255;
                }
                if(!scatterOptions.borderColors[i]) scatterOptions.borderColors[i] = [];
                scatterOptions.borderColors[i][0] = _borderColors[4 * i + 0] * 255;
                scatterOptions.borderColors[i][1] = _borderColors[4 * i + 1] * 255;
                scatterOptions.borderColors[i][2] = _borderColors[4 * i + 2] * 255;
                scatterOptions.borderColors[i][3] = dim * _borderColors[4 * i + 3] * 255;
            }

            scatterOptions.opacity = trace.opacity;
        }
        else {
            scatterOptions.color = markerOpts.color;
            scatterOptions.borderColor = markerOpts.line;
            scatterOptions.opacity = trace.opacity * markerOpts.opacity;
        }

        //prepare markers
        if (Array.isArray(markerOpts.symbol)) {
            scatterOptions.markers = new Array(count);
            for(i = 0; i < count; ++i) {
                scatterOptions.markers[i] = getSymbolSdf(markerOpts.symbol[i])
            }
        }
        else {
            scatterOptions.marker = getSymbolSdf(markerOpts.symbol)
        }

        //prepare sizes
        if(Array.isArray(markerOpts.size) || Array.isArray(markerOpts.line.width)) {
            scatterOptions.sizes = new Array(count);
            scatterOptions.borderSizes = new Array(count);

            var borderSizes = convertNumber(markerOpts.line.width, count);
            var sizes = convertArray(markerSizeFunc, markerOpts.size, count);

            for(i = 0; i < count; ++i) {
                // See  https://github.com/plotly/plotly.js/pull/1781#discussion_r121820798
                scatterOptions.sizes[i] = sizes[i];
                scatterOptions.borderSizes[i] = 0.5 * borderSizes[i];
            }
        }
        else {
            scatterOptions.size = markerSizeFunc(markerOpts.size);
            scatterOptions.borderSizes = markerOpts.line.width * .5;
        }
    }

    return [{x: false, y: false, t: stash, trace: trace}];
};


//TODO: manages selection, range, viewport, that's it
ScatterRegl.plot = function plot(container, plotinfo, cdata) {
    var layout = container._fullLayout;
    var subplot = layout._plots[plotinfo.id];
    var scene = subplot._scene;
    var vpSize = layout._size, width = layout.width, height = layout.height;

    // that is needed for fills
    linkTraces(container, plotinfo, cdata);

    var count = 0, viewport;

    var batch = cdata.map(function(cdscatter, order) {
        if(!cdscatter || !cdscatter[0] || !cdscatter[0].trace) return;
        var cd = cdscatter[0];
        var trace = cd.trace;
        var stash = cd.t;
        var xaxis = Axes.getFromId(container, trace.xaxis || 'x');
        var yaxis = Axes.getFromId(container, trace.yaxis || 'y');

        var range = [
            xaxis._rl[0], yaxis._rl[0], xaxis._rl[1], yaxis._rl[1]
        ];

        // update viewport & range
        var viewport = [
            vpSize.l + xaxis.domain[0] * vpSize.w,
            vpSize.b + yaxis.domain[0] * vpSize.h,
            (width - vpSize.r) - (1 - xaxis.domain[1]) * vpSize.w,
            (height - vpSize.t) - (1 - yaxis.domain[1]) * vpSize.h
        ];

        stash.scatter.viewport = stash.line.viewport = stash.errorX.viewport = stash.errorY.viewport = stash.fill.viewport = viewport;
        stash.scatter.range = stash.line.range = stash.errorX.range = stash.errorY.range = stash.fill.range = range;

        // TODO: update selection here
        if(trace.selection && trace.selection.length) {
            selIds = {};
            for(i = 0; i < trace.selection.length; i++) {
                selIds[trace.selection[i].pointNumber] = true;
            }
        }
        // TODO: recalculate fill area here since we can't calc connected traces beforehead

        return {
            scatter: stash.scatter,
            line: stash.line,
            errorX: stash.errorX,
            errorY: stash.errorY,
            fill: stash.fill
        };
    });

    scene.update(batch);
};

ScatterRegl.hoverPoints = function hover(pointData, xval, yval) {
    var cd = pointData.cd,
        trace = cd[0].trace,
        xa = pointData.xa,
        ya = pointData.ya,
        positions = trace._positions,
        x = trace._x,
        y = trace._y,
        // hoveron = trace.hoveron || '',
        tree = trace._tree;

    if(!tree) return [pointData];

    // FIXME: make sure this is a proper way to calc search radius
    var ids = tree.within(xval, yval, MAXDIST / xa._m);

    // pick the id closest to the point
    var min = MAXDIST, id = ids[0], ptx, pty;
    for(var i = 0; i < ids.length; i++) {
        ptx = positions[ids[i] * 2];
        pty = positions[ids[i] * 2 + 1];
        var dx = ptx - xval, dy = pty - yval;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if(dist < min) {
            min = dist;
            id = ids[i];
        }
    }

    pointData.index = id;

    if (id === undefined) return [pointData]

    // the closest data point
    var di = {
        x: x[id],
        y: y[id]
    };

    // that is single-item arrays_to_calcdata excerpt, bc we don't have to do it beforehead for 1e6 points
    mergeProp(trace.text, 'tx');
    mergeProp(trace.hovertext, 'htx');
    mergeProp(trace.customdata, 'data');
    mergeProp(trace.textposition, 'tp');
    if(trace.textfont) {
        mergeProp(trace.textfont.size, 'ts');
        mergeProp(trace.textfont.color, 'tc');
        mergeProp(trace.textfont.family, 'tf');
    }

    var marker = trace.marker;
    if(marker) {
        mergeProp(marker.size, 'ms');
        mergeProp(marker.opacity, 'mo');
        mergeProp(marker.symbol, 'mx');
        mergeProp(marker.color, 'mc');

        var markerLine = marker.line;
        if(marker.line) {
            mergeProp(markerLine.color, 'mlc');
            mergeProp(markerLine.width, 'mlw');
        }
        var markerGradient = marker.gradient;
        if(markerGradient && markerGradient.type !== 'none') {
            mergeProp(markerGradient.type, 'mgt');
            mergeProp(markerGradient.color, 'mgc');
        }
    }

    function mergeProp(list, short) {
        if (Array.isArray(list)) di[short] = list[id]
    }

    var xc = xa.c2p(di.x, true),
        yc = ya.c2p(di.y, true),
        rad = di.mrc || 1;

    Lib.extendFlat(pointData, {
        color: getTraceColor(trace, di),

        x0: xc - rad,
        x1: xc + rad,
        xLabelVal: di.x,

        y0: yc - rad,
        y1: yc + rad,
        yLabelVal: di.y
    });

    if(di.htx) pointData.text = di.htx;
    else if(trace.hovertext) pointData.text = trace.hovertext;
    else if(di.tx) pointData.text = di.tx;
    else if(trace.text) pointData.text = trace.text;
    ErrorBars.hoverInfo(di, trace, pointData);

    return [pointData];
};

ScatterRegl.selectPoints = function select(searchInfo, polygon) {
    var cd = searchInfo.cd,
        xa = searchInfo.xaxis,
        ya = searchInfo.yaxis,
        selection = [],
        trace = cd[0].trace,
        i,
        di,
        x,
        y;

    var scene = cd[0] && cd[0].trace && cd[0].trace._scene;

    if(!scene) return;

    var hasOnlyLines = (!subTypes.hasMarkers(trace) && !subTypes.hasText(trace));
    if(trace.visible !== true || hasOnlyLines) return;

    // filter out points by visible scatter ones
    if(polygon === false) {
        // clear selection
        for(i = 0; i < cd.length; i++) cd[i].dim = 0;
    }
    else {
        for(i = 0; i < cd.length; i++) {
            di = cd[i];
            x = xa.c2p(di.x);
            y = ya.c2p(di.y);
            if(polygon.contains([x, y])) {
                selection.push({
                    pointNumber: i,
                    x: di.x,
                    y: di.y
                });
                di.dim = 0;
            }
            else di.dim = 1;
        }
    }

    trace.selection = selection;
    scene([cd]);

    return selection;
};


function getSymbolSdf(symbol) {
    if(symbol === 'circle') return null

    var symbolNumber = Drawing.symbolNumber(symbol);
    var symbolFunc = Drawing.symbolFuncs[symbolNumber % 100];
    var symbolNoDot = !!Drawing.symbolNoDot[symbolNumber % 100];
    var symbolNoFill = !!Drawing.symbolNoFill[symbolNumber % 100];

    var isOpen = /-open/.test(symbol);
    var isDot = /-dot/.test(symbol);

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

var convertNumber = convertArray.bind(null, function(x) { return +x; });

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
