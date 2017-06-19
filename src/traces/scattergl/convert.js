/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createScatter = require('gl-scatter2d');
var createFancyScatter = require('gl-scatter2d-sdf');
var createLine = require('gl-line2d');
var createError = require('gl-error2d');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var autoType = require('../../plots/cartesian/axis_autotype');
var ErrorBars = require('../../components/errorbars');
var str2RGBArray = require('../../lib/str2rgbarray');
var truncate = require('../../lib/typed_array_truncate');
var formatColor = require('../../lib/gl_format_color');
var subTypes = require('../scatter/subtypes');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');
var getTraceColor = require('../scatter/get_trace_color');
var MARKER_SYMBOLS = require('../../constants/gl2d_markers');
var DASHES = require('../../constants/gl2d_dashes');

var AXES = ['xaxis', 'yaxis'];
var DESELECTDIM = 0.2;
var TRANSPARENT = [0, 0, 0, 0];

function LineWithMarkers(scene, uid) {
    this.scene = scene;
    this.uid = uid;
    this.type = 'scattergl';

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

    this.line = this.initObject(createLine, {
        positions: new Float64Array(0),
        color: [0, 0, 0, 1],
        width: 1,
        fill: [false, false, false, false],
        fillColor: [
            [0, 0, 0, 1],
            [0, 0, 0, 1],
            [0, 0, 0, 1],
            [0, 0, 0, 1]],
        dashes: [1],
    }, 0);

    this.errorX = this.initObject(createError, {
        positions: new Float64Array(0),
        errors: new Float64Array(0),
        lineWidth: 1,
        capSize: 0,
        color: [0, 0, 0, 1]
    }, 1);

    this.errorY = this.initObject(createError, {
        positions: new Float64Array(0),
        errors: new Float64Array(0),
        lineWidth: 1,
        capSize: 0,
        color: [0, 0, 0, 1]
    }, 2);

    var scatterOptions0 = {
        positions: new Float64Array(0),
        sizes: [],
        colors: [],
        glyphs: [],
        borderWidths: [],
        borderColors: [],
        size: 12,
        color: [0, 0, 0, 1],
        borderSize: 1,
        borderColor: [0, 0, 0, 1],
        snapPoints: true
    };
    var scatterOptions1 = Lib.extendFlat({}, scatterOptions0, {snapPoints: false});

    this.scatter = this.initObject(createScatter, scatterOptions0, 3);
    this.fancyScatter = this.initObject(createFancyScatter, scatterOptions0, 4);
    this.selectScatter = this.initObject(createScatter, scatterOptions1, 5);
}

var proto = LineWithMarkers.prototype;

proto.initObject = function(createFn, options, objIndex) {
    var _this = this;
    var glplot = _this.scene.glplot;
    var options0 = Lib.extendFlat({}, options);
    var obj = null;

    function update() {
        if(!obj) {
            obj = createFn(glplot, options);
            obj._trace = _this;
            obj._index = objIndex;
        }
        obj.update(options);
    }

    function clear() {
        if(obj) obj.update(options0);
    }

    function dispose() {
        if(obj) obj.dispose();
    }

    return {
        options: options,
        update: update,
        clear: clear,
        dispose: dispose
    };
};

proto.handlePick = function(pickResult) {
    var index = pickResult.pointId;

    if(pickResult.object !== this.line || this.connectgaps) {
        index = this.idToIndex[pickResult.pointId];
    }

    var x = this.pickXData[index];

    return {
        trace: this,
        dataCoord: pickResult.dataCoord,
        traceCoord: [
            isNumeric(x) || !Lib.isDateTime(x) ? x : Lib.dateTime2ms(x),
            this.pickYData[index]
        ],
        textLabel: Array.isArray(this.textLabels) ?
            this.textLabels[index] :
            this.textLabels,
        color: Array.isArray(this.color) ?
            this.color[index] :
            this.color,
        name: this.name,
        pointIndex: index,
        hoverinfo: this.hoverinfo
    };
};

// check if trace is fancy
proto.isFancy = function(options) {
    if(this.scene.xaxis.type !== 'linear' && this.scene.xaxis.type !== 'date') return true;
    if(this.scene.yaxis.type !== 'linear') return true;

    if(!options.x || !options.y) return true;

    if(this.hasMarkers) {
        var marker = options.marker || {};

        if(Array.isArray(marker.symbol) ||
             marker.symbol !== 'circle' ||
             Array.isArray(marker.size) ||
             Array.isArray(marker.color) ||
             Array.isArray(marker.line.width) ||
             Array.isArray(marker.line.color) ||
             Array.isArray(marker.opacity)
        ) return true;
    }

    if(this.hasLines && !this.connectgaps) return true;

    if(this.hasErrorX) return true;
    if(this.hasErrorY) return true;

    return false;
};

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
var convertSymbol = convertArray.bind(null, function(x) {
    return MARKER_SYMBOLS[x] ? x : 'circle';
});

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

function isSymbolOpen(symbol) {
    return symbol.split('-open')[1] === '';
}

function fillColor(colorIn, colorOut, offsetIn, offsetOut, isDimmed) {
    var dim = isDimmed ? DESELECTDIM : 1;
    var j;

    for(j = 0; j < 3; j++) {
        colorIn[4 * offsetIn + j] = colorOut[4 * offsetOut + j];
    }
    colorIn[4 * offsetIn + j] = dim * colorOut[4 * offsetOut + j];
}

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
        this.line.clear();
        this.errorX.clear();
        this.errorY.clear();
        this.scatter.clear();
        this.fancyScatter.clear();
    }
    else if(this.isFancy(options)) {
        this.updateFancy(options);
    }
    else {
        this.updateFast(options);
    }

    // sort objects so that order is preserve on updates:
    // - lines
    // - errorX
    // - errorY
    // - markers
    this.scene.glplot.objects.sort(function(a, b) {
        return a._index - b._index;
    });

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

proto.updateFast = function(options) {
    var x = this.xData = this.pickXData = options.x;
    var y = this.yData = this.pickYData = options.y;

    var len = x.length,
        idToIndex = new Array(len),
        positions = new Float64Array(2 * len),
        bounds = this.bounds,
        pId = 0,
        ptr = 0,
        selection = options.selection,
        i, selPositions, l;

    var xx, yy;

    var xcalendar = options.xcalendar;

    var fastType = allFastTypesLikely(x);
    var isDateTime = !fastType && autoType(x, xcalendar) === 'date';

    // TODO add 'very fast' mode that bypasses this loop
    // TODO bypass this on modebar +/- zoom
    if(fastType || isDateTime) {

        for(i = 0; i < len; ++i) {
            xx = x[i];
            yy = y[i];

            if(isNumeric(yy)) {

                if(!fastType) {
                    xx = Lib.dateTime2ms(xx, xcalendar);
                }

                positions[ptr++] = xx;
                positions[ptr++] = yy;

                idToIndex[pId++] = i;

                bounds[0] = Math.min(bounds[0], xx);
                bounds[1] = Math.min(bounds[1], yy);
                bounds[2] = Math.max(bounds[2], xx);
                bounds[3] = Math.max(bounds[3], yy);
            }
        }
    }

    positions = truncate(positions, ptr);
    this.idToIndex = idToIndex;

    // form selected set
    if(selection) {
        selPositions = new Float64Array(2 * selection.length);

        for(i = 0, l = selection.length; i < l; i++) {
            selPositions[i * 2 + 0] = selection[i].x;
            selPositions[i * 2 + 1] = selection[i].y;
        }
    }

    this.updateLines(options, positions);
    this.updateError('X', options);
    this.updateError('Y', options);

    var markerSize;

    if(this.hasMarkers) {
        var markerColor, borderColor, opacity;

        // if we have selPositions array - means we have to render all points transparent, and selected points opaque
        if(selPositions) {
            this.scatter.options.positions = null;

            markerColor = str2RGBArray(options.marker.color);
            borderColor = str2RGBArray(options.marker.line.color);
            opacity = (options.opacity) * (options.marker.opacity) * DESELECTDIM;

            markerColor[3] *= opacity;
            this.scatter.options.color = markerColor;

            borderColor[3] *= opacity;
            this.scatter.options.borderColor = borderColor;

            markerSize = options.marker.size;
            this.scatter.options.size = markerSize;
            this.scatter.options.borderSize = options.marker.line.width;

            this.scatter.update();
            this.scatter.options.positions = positions;


            this.selectScatter.options.positions = selPositions;

            markerColor = str2RGBArray(options.marker.color);
            borderColor = str2RGBArray(options.marker.line.color);
            opacity = (options.opacity) * (options.marker.opacity);

            markerColor[3] *= opacity;
            this.selectScatter.options.color = markerColor;

            borderColor[3] *= opacity;
            this.selectScatter.options.borderColor = borderColor;

            markerSize = options.marker.size;
            this.selectScatter.options.size = markerSize;
            this.selectScatter.options.borderSize = options.marker.line.width;

            this.selectScatter.update();
        }

        else {
            this.scatter.options.positions = positions;

            markerColor = str2RGBArray(options.marker.color);
            borderColor = str2RGBArray(options.marker.line.color);
            opacity = (options.opacity) * (options.marker.opacity);
            markerColor[3] *= opacity;
            this.scatter.options.color = markerColor;

            borderColor[3] *= opacity;
            this.scatter.options.borderColor = borderColor;

            markerSize = options.marker.size;
            this.scatter.options.size = markerSize;
            this.scatter.options.borderSize = options.marker.line.width;

            this.scatter.update();
        }

    }
    else {
        this.scatter.clear();
    }

    // turn off fancy scatter plot
    this.fancyScatter.clear();

    // add item for autorange routine
    this.expandAxesFast(bounds, markerSize);
};

proto.updateFancy = function(options) {
    var scene = this.scene,
        xaxis = scene.xaxis,
        yaxis = scene.yaxis,
        bounds = this.bounds,
        selection = options.selection;

    // makeCalcdata runs d2c (data-to-coordinate) on every point
    var x = this.pickXData = xaxis.makeCalcdata(options, 'x').slice();
    var y = this.pickYData = yaxis.makeCalcdata(options, 'y').slice();

    this.xData = x.slice();
    this.yData = y.slice();

    // get error values
    var errorVals = ErrorBars.calcFromTrace(options, scene.fullLayout);

    var len = x.length,
        idToIndex = new Array(len),
        positions = new Float64Array(2 * len),
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

    positions = truncate(positions, ptr);
    this.idToIndex = idToIndex;

    this.updateLines(options, positions);
    this.updateError('X', options, positions, errorsX);
    this.updateError('Y', options, positions, errorsY);

    var sizes, selIds;

    if(selection) {
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
        this.scatter.options.glyphs = new Array(pId);
        this.scatter.options.borderWidths = new Array(pId);
        this.scatter.options.colors = new Array(pId * 4);
        this.scatter.options.borderColors = new Array(pId * 4);

        var markerSizeFunc = makeBubbleSizeFn(options);
        var markerOpts = options.marker;
        var markerOpacity = markerOpts.opacity;
        var traceOpacity = options.opacity;
        var symbols = convertSymbol(markerOpts.symbol, len);
        var colors = convertColorScale(markerOpts, markerOpacity, traceOpacity, len);
        var borderWidths = convertNumber(markerOpts.line.width, len);
        var borderColors = convertColorScale(markerOpts.line, markerOpacity, traceOpacity, len);
        var index, size, symbol, symbolSpec, isOpen, isDimmed, _colors, _borderColors, bw, minBorderWidth;

        sizes = convertArray(markerSizeFunc, markerOpts.size, len);

        for(i = 0; i < pId; ++i) {
            index = idToIndex[i];

            symbol = symbols[index];
            symbolSpec = MARKER_SYMBOLS[symbol];
            isOpen = isSymbolOpen(symbol);
            isDimmed = selIds && !selIds[index];

            if(symbolSpec.noBorder && !isOpen) {
                _colors = borderColors;
            } else {
                _colors = colors;
            }

            if(isOpen) {
                _borderColors = colors;
            } else {
                _borderColors = borderColors;
            }

            // See  https://github.com/plotly/plotly.js/pull/1781#discussion_r121820798
            // for more info on this logic
            size = sizes[index];
            bw = borderWidths[index];
            minBorderWidth = (symbolSpec.noBorder || symbolSpec.noFill) ? 0.1 * size : 0;

            this.scatter.options.sizes[i] = 4.0 * size;
            this.scatter.options.glyphs[i] = symbolSpec.unicode;
            this.scatter.options.borderWidths[i] = 0.5 * ((bw > minBorderWidth) ? bw - minBorderWidth : 0);

            if(isOpen && !symbolSpec.noBorder && !symbolSpec.noFill) {
                fillColor(this.scatter.options.colors, TRANSPARENT, i, 0);
            } else {
                fillColor(this.scatter.options.colors, _colors, i, index, isDimmed);
            }
            fillColor(this.scatter.options.borderColors, _borderColors, i, index, isDimmed);
        }

        // prevent scatter from resnapping points
        if(selIds) {
            this.scatter.options.positions = null;
            this.fancyScatter.update();
            this.scatter.options.positions = positions;
        }
        else {
            this.fancyScatter.update();
        }
    }
    else {
        this.fancyScatter.clear();
    }

    // turn off fast scatter plot
    this.scatter.clear();

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
        ax = this.scene[AXES[i]];

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
    var scene = this.scene,
        expandOpts = { padded: true, ppad: ppad };

    Axes.expand(scene.xaxis, x, expandOpts);
    Axes.expand(scene.yaxis, y, expandOpts);
};

proto.dispose = function() {
    this.line.dispose();
    this.errorX.dispose();
    this.errorY.dispose();
    this.scatter.dispose();
    this.fancyScatter.dispose();
};

function createLineWithMarkers(scene, data, cdscatter) {
    var plot = new LineWithMarkers(scene, data.uid);
    plot.update(data, cdscatter);

    return plot;
}

module.exports = createLineWithMarkers;
