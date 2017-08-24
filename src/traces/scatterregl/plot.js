/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var autoType = require('../../plots/cartesian/axis_autotype');
var ErrorBars = require('../../components/errorbars');
var str2RGBArray = require('../../lib/str2rgbarray');
var formatColor = require('../../lib/gl_format_color');
var subTypes = require('../scatter/subtypes');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');
var getTraceColor = require('../scatter/get_trace_color');
var DASHES = require('../../constants/gl2d_dashes');
var fit = require('canvas-fit')
var createScatter = require('../../../../regl-scatter2d')
var createLine = require('../../../../regl-line2d')
var Drawing = require('../../components/drawing');
var MARKER_SVG_SYMBOLS = require('../../components/drawing/symbol_defs');
var svgSdf = require('../../../../svg-path-sdf')

var AXES = ['xaxis', 'yaxis'];
var DESELECTDIM = 0.2;
var TRANSPARENT = [0, 0, 0, 0];

// tables with symbol SDF values
var SYMBOL_SDF_SIZE = 200
var SYMBOL_SIZE = 20
var SYMBOL_STROKE = SYMBOL_SIZE / 20
var SYMBOL_SDF = {}
var SYMBOL_SVG_CIRCLE = Drawing.symbolFuncs[0](SYMBOL_SIZE * .05)


module.exports = createLineWithMarkers


function createLineWithMarkers(container, plotinfo, cdscatter) {
    var layout = container._fullLayout
    var xa = layout.xaxis
    var ya = layout.yaxis
    var glContainer = container.querySelector('.gl-container')

    //FIXME: find proper way to get plot holder
    //FIXME: handle multiple subplots
    var subplotObj = layout._plots.xy
    var scatter = subplotObj._scatter2d

    //create regl-scatter, if not defined
    if (scatter === undefined) {
        //TODO: enhance picking
        //TODO: decide whether we should share canvas or create it every scatter plot
        //TODO: decide if canvas should be the full-width with viewport or multiple instances
        //FIXME: avoid forcing absolute style by disabling forced plotly background
        //TODO: figure out if there is a way to detect only new passed options
        var canvas = glContainer.appendChild(document.createElement('canvas'))

        //FIXME: make sure this is the right place for that
        glContainer.style.height = '100%';
        glContainer.style.width = '100%';

        canvas.style.position = 'absolute';
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        canvas.style.pointerEvents = 'none';

        //TODO: fit canvas every window.resize or plotly.resize or whatever
        fit(canvas, glContainer);

        container.glContainer = glContainer
        container.canvas = canvas
        scatter = subplotObj._scatter2d = createScatterScene(container)
    }

    container._fullData.forEach(function(data, i) {
        scatter.update(data, cdscatter[i]);
    })

    return scatter
}

function createScatterScene(container) {
    if (!(this instanceof createScatterScene)) return new createScatterScene(container)

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

    this.xaxis = container._fullLayout.xaxis
    this.yaxis = container._fullLayout.yaxis

    var scatterOptions0 = {
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
        canvas: container.canvas,
        pixelRatio: container._context.plotGlPixelRatio || window.devicePixelRatio
    };

    this.scatter = createScatter(scatterOptions0);
    this.scatter.options = scatterOptions0
    this.scatter._trace = this


    // this.line = createLine({
    //     positions: new Float64Array(0),
    //     color: [0, 0, 0, 1],
    //     width: 1,
    //     fill: [false, false, false, false],
    //     fillColor: [
    //         [0, 0, 0, 1],
    //         [0, 0, 0, 1],
    //         [0, 0, 0, 1],
    //         [0, 0, 0, 1]],
    //     dashes: [1],
    // }, 0);


    return this
}

var proto = createScatterScene.prototype;


proto.update = function(options, cdscatter) {
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
        xaxis = container._fullLayout.xaxis,
        yaxis = container._fullLayout.yaxis,
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

    // this.updateLines(options, positions);
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
        this.scatter.options.positions = positions;

        // TODO rewrite convert function so that
        // we don't have to loop through the data another time

        this.scatter.options.sizes = new Array(pId);
        this.scatter.options.markers = new Array(pId);
        this.scatter.options.borderSizes = new Array(pId);
        this.scatter.options.colors = new Array(pId);
        this.scatter.options.borderColors = new Array(pId);

        var markerSizeFunc = makeBubbleSizeFn(options);

        var markerOpts = options.marker;
        var markerOpacity = markerOpts.opacity;
        var traceOpacity = options.opacity;
        var symbols = markerOpts.symbol;

        var colors = convertColorScale(markerOpts, markerOpacity, traceOpacity, len);
        var borderSizes = convertNumber(markerOpts.line.width, len);
        var borderColors = convertColorScale(markerOpts.line, markerOpacity, traceOpacity, len);
        var index, size, symbol, symbolName, symbolSpec, symbolNumber, isOpen, isDimmed, _colors, _borderColors, bw, minBorderWidth, symbolNeedLine, symbolFunc, symbolNoDot, symbolSdf, symbolNoFill, symbolPath, isDot;

        sizes = convertArray(markerSizeFunc, markerOpts.size, len);

        for(i = 0; i < pId; ++i) {
            index = idToIndex[i];
            symbol = symbols[index];
            symbolNumber = Drawing.symbolNumber(symbol)
            symbolName = Drawing.symbolNames[symbolNumber % 100]
            symbolFunc = Drawing.symbolFuncs[symbolNumber % 100]
            symbolNeedLine = !!Drawing.symbolNeedLines[symbolNumber % 100]
            symbolNoDot = !!Drawing.symbolNoDot[symbolNumber % 100]
            symbolNoFill = !!Drawing.symbolNoFill[symbolNumber % 100]

            isOpen = /-open/.test(symbol);
            isDot = /-dot/.test(symbol);
            isDimmed = selIds && !selIds[index];

            // if(symbolNeedLine && !isOpen) {
            //     _colors = borderColors;
            // } else {
                _colors = colors;
            // }

            if(isOpen) {
                _borderColors = colors;
            } else {
                _borderColors = borderColors;
            }

            // See  https://github.com/plotly/plotly.js/pull/1781#discussion_r121820798
            // for more info on this logic
            size = sizes[index];
            bw = borderSizes[index];
            // minBorderWidth = (symbolNeedLine) ? 0.1 * size : 0;
            minBorderWidth = 0

            this.scatter.options.sizes[i] = size;


            if (symbol === 'circle') {
                this.scatter.options.markers[i] = null;
            }
            else {
                //get symbol sdf from cache or generate it
                if (SYMBOL_SDF[symbol]) {
                    symbolSdf = SYMBOL_SDF[symbol]
                } else {
                    if (isDot && !symbolNoDot) {
                        symbolPath = symbolFunc(SYMBOL_SIZE * 1.1) + SYMBOL_SVG_CIRCLE
                    }
                    else {
                        symbolPath = symbolFunc(SYMBOL_SIZE)
                    }

                    symbolSdf = svgSdf(symbolPath, {
                        w: SYMBOL_SDF_SIZE,
                        h: SYMBOL_SDF_SIZE,
                        viewBox: [-SYMBOL_SIZE,-SYMBOL_SIZE,SYMBOL_SIZE,SYMBOL_SIZE],
                        stroke: symbolNoFill ? SYMBOL_STROKE : -SYMBOL_STROKE
                    })
                    SYMBOL_SDF[symbol] = symbolSdf
                }

                this.scatter.options.markers[i] = symbolSdf || null;
            }
            this.scatter.options.borderSizes[i] = 0.5 * ((bw > minBorderWidth) ? bw - minBorderWidth : 0);

            var optColors = this.scatter.options.colors
            var dim = isDimmed ? DESELECTDIM : 1;
            if (!optColors[i]) optColors[i] = []
            if(isOpen || symbolNoFill) {
                optColors[i][0] = TRANSPARENT[0];
                optColors[i][1] = TRANSPARENT[1];
                optColors[i][2] = TRANSPARENT[2];
                optColors[i][3] = TRANSPARENT[3];
            } else {
                optColors[i][0] = _colors[4*index + 0] * 255;
                optColors[i][1] = _colors[4*index + 1] * 255;
                optColors[i][2] = _colors[4*index + 2] * 255;
                optColors[i][3] = dim * _colors[4*index + 3] * 255;
            }
            if (!this.scatter.options.borderColors[i]) this.scatter.options.borderColors[i] = []
            this.scatter.options.borderColors[i][0] = _borderColors[4*index + 0] * 255;
            this.scatter.options.borderColors[i][1] = _borderColors[4*index + 1] * 255;
            this.scatter.options.borderColors[i][2] = _borderColors[4*index + 2] * 255;
            this.scatter.options.borderColors[i][3] = dim * _borderColors[4*index + 3] * 255;
        }


        var size = container._fullLayout._size,
            domainX = container._fullLayout.xaxis.domain,
            domainY = container._fullLayout.yaxis.domain,
            width = container._fullLayout.width,
            height = container._fullLayout.height;

        var viewBox = [
            size.l + domainX[0] * size.w,
            size.b + domainY[0] * size.h,
            (width - size.r) - (1 - domainX[1]) * size.w,
            (height - size.t) - (1 - domainY[1]) * size.h
        ];

        var bounds = [xaxis._rl[0], yaxis._rl[0], xaxis._rl[1], yaxis._rl[1]];
        this.scatter.options.range = bounds;
        this.scatter.options.viewport = viewBox

        // prevent scatter from resnapping points
        this.scatter(this.scatter.options);
    }

    // add item for autorange routine
    this.expandAxesFancy(x, y, sizes);
};

proto.updateLines = function(options, positions) {
    var i;

    if(this.hasLines) {
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

        this.line.options.positions = linePositions;

        var lineColor = convertColor(options.line.color, options.opacity, 1),
            lineWidth = Math.round(0.5 * this.line.options.width),
            dashes = (DASHES[options.line.dash] || [1]).slice();

        for(i = 0; i < dashes.length; ++i) dashes[i] *= lineWidth;

        switch(options.fill) {
            case 'tozeroy':
                this.line.options.fill = [false, true, false, false];
                break;
            case 'tozerox':
                this.line.options.fill = [true, false, false, false];
                break;
            default:
                this.line.options.fill = [false, false, false, false];
                break;
        }
        var fillColor = str2RGBArray(options.fillcolor);

        this.line.options.color = lineColor;
        this.line.options.width = 2.0 * options.line.width;
        this.line.options.dashes = dashes;
        this.line.options.fillColor = [fillColor, fillColor, fillColor, fillColor];

        this.line.update();
    }
    else {
        this.line.clear();
    }
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
        errorObj.options.lineWidth = errorOptions.thickness / 2;  // ballpark rescaling
        errorObj.options.color = convertColor(errorOptions.color, 1, 1);

        errorObj.update();
    }
    else {
        errorObj.clear();
    }
};

proto.expandAxesFast = function(bounds, markerSize) {
    var pad = markerSize || 10;
    var ax, min, max;

    for(var i = 0; i < 2; i++) {
        ax = this.container[AXES[i]];

        min = ax._min;
        if(!min) min = [];
        min.push({ val: bounds[i], pad: pad });

        max = ax._max;
        if(!max) max = [];
        max.push({ val: bounds[i + 2], pad: pad });
    }
};

// not quite on-par with 'scatter' (scatter fill in several other expand options)
// but close enough for now
proto.expandAxesFancy = function(x, y, ppad) {
    var container = this.container,
        expandOpts = { padded: true, ppad: ppad };

    Axes.expand(container._fullLayout.xaxis, x, expandOpts);
    Axes.expand(container._fullLayout.yaxis, y, expandOpts);
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

var convertNumber = convertArray.bind(null, function(x) { return +x; });
var convertColorBase = convertArray.bind(null, str2RGBArray);

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

// We'd ideally know that all values are of fast types; sampling gives no certainty but faster
//     (for the future, typed arrays can guarantee it, and Date values can be done with
//      representing the epoch milliseconds in a typed array;
//      also, perhaps the Python / R interfaces take care of String->Date conversions
//      such that there's no need to check for string dates in plotly.js)
// Patterned from axis_autotype.js:moreDates
// Code DRYing is not done to preserve the most direct compilation possible for speed;
// also, there are quite a few differences
function allFastTypesLikely(a) {
    var len = a.length,
        inc = Math.max(1, (len - 1) / Math.min(Math.max(len, 1), 1000)),
        ai;

    for(var i = 0; i < len; i += inc) {
        ai = a[Math.floor(i)];
        if(!isNumeric(ai) && !(ai instanceof Date)) {
            return false;
        }
    }

    return true;
}

