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
var getTraceColor = require('../scatter/get_trace_color');
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


module.exports = createLineWithMarkers;


function createLineWithMarkers(container, plotinfo, cdscatter) {
    var layout = container._fullLayout;

    var subplotObj = layout._plots.xy;
    var scatter = subplotObj._scatter2d;

    // create regl-scatter, if not defined
    if(scatter === undefined) {
        // TODO: enhance picking
        // TODO: figure out if there is a way to detect only new passed options

        scatter = subplotObj._scatter2d = new ScatterScene(container);
    }

    container._fullData.forEach(function(data, i) {
        scatter.update(data, cdscatter[i]);
    });

    return scatter;
}

function ScatterScene(container) {
    if(!(this instanceof ScatterScene)) return new ScatterScene(container);

    this.container = container;
    this.type = 'scatterregl';

    this.pickXData = [];
    this.pickYData = [];
    this.xData = [];
    this.yData = [];
    this.textLabels = [];
    this.color = 'rgb(0, 0, 0)';
    this.name = '';
    this.hoverinfo = 'all';
    this.connectgaps = true;

    this.index = null;
    this.idToIndex = [];
    this.bounds = [0, 0, 0, 0];

    this.isVisible = false;
    this.hasLines = false;
    this.hasErrorX = false;
    this.hasErrorY = false;
    this.hasMarkers = false;

    this.xaxis = container._fullLayout.xaxis;
    this.yaxis = container._fullLayout.yaxis;

    this.canvas = container.querySelector('.gl-canvas-focus');
    this.regl = createRegl({
        canvas: this.canvas,
        extensions: ['ANGLE_instanced_arrays', 'OES_element_index_uint'],
        pixelRatio: container._context.plotGlPixelRatio || global.devicePixelRatio
    });

    this.scatterOptions = {
        regl: this.regl,
        positions: Array(),
        sizes: [],
        colors: [],
        markers: [],
        borderSizes: [],
        borderColors: [],
        size: 12,
        color: [0, 0, 0, 1],
        borderSize: 1,
        borderColor: [0, 0, 0, 1],
        snapPoints: true,
        canvas: this.canvas
    };

    this.scatter = createScatter(this.scatterOptions);

    this.lineOptions = {
        regl: this.regl,
        positions: new Float64Array(0),
        color: [0, 0, 0, 1],
        thickness: 1,
        miterLimit: 2,
        canvas: this.canvas,
        // fill: [false, false, false, false],
        // fillColor: [
        //     [0, 0, 0, 1],
        //     [0, 0, 0, 1],
        //     [0, 0, 0, 1],
        //     [0, 0, 0, 1]],
        dashes: [1],
    };

    this.line = createLine(this.lineOptions);

    return this;
}

var proto = ScatterScene.prototype;


proto.update = function(options, cdscatter) {
    var container = this.container,
        xaxis = Axes.getFromId(container, options.xaxis || 'x'),
        yaxis = Axes.getFromId(container, options.yaxis || 'y');


    if(options.visible !== true) {
        this.isVisible = false;
        this.hasLines = false;
        this.hasErrorX = false;
        this.hasErrorY = false;
        this.hasMarkers = false;
    }
    else {
        this.isVisible = true;
        this.hasLines = subTypes.hasLines(options);
        this.hasErrorX = options.error_x.visible === true;
        this.hasErrorY = options.error_y.visible === true;
        this.hasMarkers = subTypes.hasMarkers(options);
    }

    this.textLabels = options.text;
    this.name = options.name;
    this.hoverinfo = options.hoverinfo;
    this.bounds = [Infinity, Infinity, -Infinity, -Infinity];
    this.connectgaps = !!options.connectgaps;


    // update viewport & range
    var vpSize = container._fullLayout._size,
        domainX = xaxis.domain,
        domainY = yaxis.domain,
        width = container._fullLayout.width,
        height = container._fullLayout.height;

    var viewBox = [
        vpSize.l + domainX[0] * vpSize.w,
        vpSize.b + domainY[0] * vpSize.h,
        (width - vpSize.r) - (1 - domainX[1]) * vpSize.w,
        (height - vpSize.t) - (1 - domainY[1]) * vpSize.h
    ];

    var range = [xaxis._rl[0], yaxis._rl[0], xaxis._rl[1], yaxis._rl[1]];

    this.scatterOptions.range =
    this.lineOptions.range = range;
    this.scatterOptions.viewport =
    this.lineOptions.viewport = viewBox;


    if(!this.isVisible) {
        // this.line.clear();
        // this.errorX.clear();
        // this.errorY.clear();
        // this.scatter();
        // this.fancyScatter.clear();
    }
    else {
        this.updateFancy(options);
    }

    // sort objects so that order is preserve on updates:
    // - lines
    // - errorX
    // - errorY
    // - markers
    // this.container.glplot.objects.sort(function(a, b) {
    //     return a._index - b._index;
    // });

    // set trace index so that scene2d can sort object per traces
    this.index = options.index;

    // not quite on-par with 'scatter', but close enough for now
    // does not handle the colorscale case
    this.color = getTraceColor(options, {});

    // provide reference for selecting points
    if(cdscatter && cdscatter[0] && !cdscatter[0].glTrace) {
        cdscatter[0].glTrace = this;
    }
};

proto.updateFancy = function(options) {
    var container = this.container,
        xaxis = Axes.getFromId(container, options.xaxis || 'x'),
        yaxis = Axes.getFromId(container, options.yaxis || 'y'),
        bounds = this.bounds,
        selection = options.selection;

    // makeCalcdata runs d2c (data-to-coordinate) on every point
    var x = this.pickXData = xaxis.makeCalcdata(options, 'x').slice();
    var y = this.pickYData = yaxis.makeCalcdata(options, 'y').slice();

    this.xData = x.slice();
    this.yData = y.slice();

    // get error values
    var errorVals = ErrorBars.calcFromTrace(options, container._fullLayout);

    var len = x.length,
        idToIndex = new Array(len),
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
        this.xData[i] = xx = getX(x[i]);
        this.yData[i] = yy = getY(y[i]);

        if(isNaN(xx) || isNaN(yy)) continue;

        idToIndex[pId++] = i;

        positions[ptr++] = xx;
        positions[ptr++] = yy;

        ex0 = errorsX[ptrX++] = xx - errorVals[i].xs || 0;
        ex1 = errorsX[ptrX++] = errorVals[i].xh - xx || 0;
        errorsX[ptrX++] = 0;
        errorsX[ptrX++] = 0;

        errorsY[ptrY++] = 0;
        errorsY[ptrY++] = 0;
        ey0 = errorsY[ptrY++] = yy - errorVals[i].ys || 0;
        ey1 = errorsY[ptrY++] = errorVals[i].yh - yy || 0;

        bounds[0] = Math.min(bounds[0], xx - ex0);
        bounds[1] = Math.min(bounds[1], yy - ey0);
        bounds[2] = Math.max(bounds[2], xx + ex1);
        bounds[3] = Math.max(bounds[3], yy + ey1);
    }

    positions = positions.slice(0, ptr);
    this.idToIndex = idToIndex;

    this.updateLines(options, positions);
    // this.updateError('X', options, positions, errorsX);
    // this.updateError('Y', options, positions, errorsY);

    var sizes, selIds;

    if(selection && selection.length) {
        selIds = {};
        for(i = 0; i < selection.length; i++) {
            selIds[selection[i].pointNumber] = true;
        }
    }

    if(this.hasMarkers) {
        this.scatterOptions.positions = positions;

        // TODO rewrite convert function so that
        // we don't have to loop through the data another time

        this.scatterOptions.sizes = new Array(pId);
        this.scatterOptions.markers = new Array(pId);
        this.scatterOptions.borderSizes = new Array(pId);
        this.scatterOptions.colors = new Array(pId);
        this.scatterOptions.borderColors = new Array(pId);

        var markerSizeFunc = makeBubbleSizeFn(options);

        var markerOpts = options.marker;
        var markerOpacity = markerOpts.opacity;
        var traceOpacity = options.opacity;
        var symbols = markerOpts.symbol;

        var colors = convertColorScale(markerOpts, markerOpacity, traceOpacity, len);
        var borderSizes = convertNumber(markerOpts.line.width, len);
        var borderColors = convertColorScale(markerOpts.line, markerOpacity, traceOpacity, len);
        var index, size, symbol, symbolNumber, isOpen, isDimmed, _colors, _borderColors, bw, symbolFunc, symbolNoDot, symbolSdf, symbolNoFill, symbolPath, isDot;

        sizes = convertArray(markerSizeFunc, markerOpts.size, len);

        for(i = 0; i < pId; ++i) {
            index = idToIndex[i];
            symbol = Array.isArray(symbols) ? symbols[index] : symbols;
            symbolNumber = Drawing.symbolNumber(symbol);
            symbolFunc = Drawing.symbolFuncs[symbolNumber % 100];
            symbolNoDot = !!Drawing.symbolNoDot[symbolNumber % 100];
            symbolNoFill = !!Drawing.symbolNoFill[symbolNumber % 100];

            isOpen = /-open/.test(symbol);
            isDot = /-dot/.test(symbol);
            isDimmed = selIds && !selIds[index];

            _colors = colors;

            if(isOpen) {
                _borderColors = colors;
            } else {
                _borderColors = borderColors;
            }

            // See  https://github.com/plotly/plotly.js/pull/1781#discussion_r121820798
            // for more info on this logic
            size = sizes[index];
            bw = borderSizes[index];

            this.scatterOptions.sizes[i] = size;

            if(symbol === 'circle') {
                this.scatterOptions.markers[i] = null;
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

                this.scatterOptions.markers[i] = symbolSdf || null;
            }
            this.scatterOptions.borderSizes[i] = 0.5 * bw;

            var optColors = this.scatterOptions.colors;
            var dim = isDimmed ? DESELECTDIM : 1;
            if(!optColors[i]) optColors[i] = [];
            if(isOpen || symbolNoFill) {
                optColors[i][0] = TRANSPARENT[0];
                optColors[i][1] = TRANSPARENT[1];
                optColors[i][2] = TRANSPARENT[2];
                optColors[i][3] = TRANSPARENT[3];
            } else {
                optColors[i][0] = _colors[4 * index + 0] * 255;
                optColors[i][1] = _colors[4 * index + 1] * 255;
                optColors[i][2] = _colors[4 * index + 2] * 255;
                optColors[i][3] = dim * _colors[4 * index + 3] * 255;
            }
            if(!this.scatterOptions.borderColors[i]) this.scatterOptions.borderColors[i] = [];
            this.scatterOptions.borderColors[i][0] = _borderColors[4 * index + 0] * 255;
            this.scatterOptions.borderColors[i][1] = _borderColors[4 * index + 1] * 255;
            this.scatterOptions.borderColors[i][2] = _borderColors[4 * index + 2] * 255;
            this.scatterOptions.borderColors[i][3] = dim * _borderColors[4 * index + 3] * 255;
        }

        // prevent scatter from resnapping points
        this.regl._refresh();
        this.scatter(this.scatterOptions);
    }

    // add item for autorange routine
    // former expandAxesFancy
    Axes.expand(xaxis, x, {padded: true, ppad: sizes});
    Axes.expand(yaxis, y, {padded: true, ppad: sizes});
};

proto.updateLines = function(options, positions) {
    var i;

    if(!this.hasLines) return;

    var linePositions = positions;

    if(!options.connectgaps) {
        var p = 0;
        var x = this.xData;
        var y = this.yData;
        linePositions = new Float64Array(2 * x.length);

        for(i = 0; i < x.length; ++i) {
            linePositions[p++] = x[i];
            linePositions[p++] = y[i];
        }
    }

    this.lineOptions.positions = linePositions;

    this.lineOptions.thickness = options.line.width;

    var lineColor = options.line.color,
        lineWidth = this.lineOptions.thickness,
        dashes = (DASHES[options.line.dash] || [1]).slice();

    for(i = 0; i < dashes.length; ++i) dashes[i] *= lineWidth;

    // FIXME: make regl renderer for fills
    switch(options.fill) {
        case 'tozeroy':
            this.lineOptions.fill = [false, true, false, false];
            break;
        case 'tozerox':
            this.lineOptions.fill = [true, false, false, false];
            break;
        default:
            this.lineOptions.fill = [false, false, false, false];
            break;
    }
    var fillColor = str2RGBArray(options.fillcolor);

    this.lineOptions.color = lineColor;
    this.lineOptions.dashes = dashes;

    this.lineOptions.fillColor = [fillColor, fillColor, fillColor, fillColor];

    this.regl._refresh();
    this.line(this.lineOptions);
};

proto.updateError = function(axLetter, options, positions, errors) {
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
};


// proto.handlePick = function(pickResult) {
//     var index = pickResult.pointId;

//     if(pickResult.object !== this.line || this.connectgaps) {
//         index = this.idToIndex[pickResult.pointId];
//     }

//     var x = this.pickXData[index];

//     return {
//         trace: this,
//         dataCoord: pickResult.dataCoord,
//         traceCoord: [
//             isNumeric(x) || !Lib.isDateTime(x) ? x : Lib.dateTime2ms(x),
//             this.pickYData[index]
//         ],
//         textLabel: Array.isArray(this.textLabels) ?
//             this.textLabels[index] :
//             this.textLabels,
//         color: Array.isArray(this.color) ?
//             this.color[index] :
//             this.color,
//         name: this.name,
//         pointIndex: index,
//         hoverinfo: this.hoverinfo
//     };
// };

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
