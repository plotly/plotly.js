/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createScatter = require('gl-scatter2d');
var createFancyScatter = require('gl-scatter2d-fancy');
var createLine = require('gl-line2d');
var createError = require('gl-error2d');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var ErrorBars = require('../../components/errorbars');
var str2RGBArray = require('../../lib/str2rgbarray');
var truncate = require('../../lib/float32_truncate');
var formatColor = require('../../lib/gl_format_color');
var subTypes = require('../scatter/subtypes');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');
var getTraceColor = require('../scatter/get_trace_color');
var MARKER_SYMBOLS = require('../../constants/gl_markers');
var DASHES = require('../../constants/gl2d_dashes');

var AXES = ['xaxis', 'yaxis'];


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

    this.idToIndex = [];
    this.bounds = [0, 0, 0, 0];

    this.hasLines = false;
    this.lineOptions = {
        positions: new Float32Array(0),
        color: [0, 0, 0, 1],
        width: 1,
        fill: [false, false, false, false],
        fillColor: [
            [0, 0, 0, 1],
            [0, 0, 0, 1],
            [0, 0, 0, 1],
            [0, 0, 0, 1]],
        dashes: [1]
    };
    this.line = createLine(scene.glplot, this.lineOptions);
    this.line._trace = this;

    this.hasErrorX = false;
    this.errorXOptions = {
        positions: new Float32Array(0),
        errors: new Float32Array(0),
        lineWidth: 1,
        capSize: 0,
        color: [0, 0, 0, 1]
    };
    this.errorX = createError(scene.glplot, this.errorXOptions);
    this.errorX._trace = this;

    this.hasErrorY = false;
    this.errorYOptions = {
        positions: new Float32Array(0),
        errors: new Float32Array(0),
        lineWidth: 1,
        capSize: 0,
        color: [0, 0, 0, 1]
    };
    this.errorY = createError(scene.glplot, this.errorYOptions);
    this.errorY._trace = this;

    this.hasMarkers = false;
    this.scatterOptions = {
        positions: new Float32Array(0),
        sizes: [],
        colors: [],
        glyphs: [],
        borderWidths: [],
        borderColors: [],
        size: 12,
        color: [0, 0, 0, 1],
        borderSize: 1,
        borderColor: [0, 0, 0, 1]
    };
    this.scatter = createScatter(scene.glplot, this.scatterOptions);
    this.scatter._trace = this;
    this.fancyScatter = createFancyScatter(scene.glplot, this.scatterOptions);
    this.fancyScatter._trace = this;
}

var proto = LineWithMarkers.prototype;

proto.handlePick = function(pickResult) {
    var index = pickResult.pointId;

    if(pickResult.object !== this.line || this.connectgaps) {
        index = this.idToIndex[pickResult.pointId];
    }

    return {
        trace: this,
        dataCoord: pickResult.dataCoord,
        traceCoord: [
            this.pickXData[index],
            this.pickYData[index]
        ],
        textLabel: Array.isArray(this.textLabels) ?
            this.textLabels[index] :
            this.textLabels,
        color: Array.isArray(this.color) ?
            this.color[index] :
            this.color,
        name: this.name,
        hoverinfo: this.hoverinfo
    };
};

// check if trace is fancy
proto.isFancy = function(options) {
    if(this.scene.xaxis.type !== 'linear') return true;
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
    return MARKER_SYMBOLS[x] || '●';
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

/* Order is important here to get the correct laying:
 * - lines
 * - errorX
 * - errorY
 * - markers
 */
proto.update = function(options) {
    if(options.visible !== true) {
        this.hasLines = false;
        this.hasErrorX = false;
        this.hasErrorY = false;
        this.hasMarkers = false;
    }
    else {
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

    if(this.isFancy(options)) {
        this.updateFancy(options);
    }
    else {
        this.updateFast(options);
    }

    // not quite on-par with 'scatter', but close enough for now
    // does not handle the colorscale case
    this.color = getTraceColor(options, {});
};

proto.updateFast = function(options) {
    var x = this.xData = this.pickXData = options.x;
    var y = this.yData = this.pickYData = options.y;

    var len = x.length,
        idToIndex = new Array(len),
        positions = new Float32Array(2 * len),
        bounds = this.bounds,
        pId = 0,
        ptr = 0;

    var xx, yy;

    // TODO add 'very fast' mode that bypasses this loop
    // TODO bypass this on modebar +/- zoom
    for(var i = 0; i < len; ++i) {
        xx = x[i];
        yy = y[i];

        // check for isNaN is faster but doesn't skip over nulls
        if(!isNumeric(xx) || !isNumeric(yy)) continue;

        idToIndex[pId++] = i;

        positions[ptr++] = xx;
        positions[ptr++] = yy;

        bounds[0] = Math.min(bounds[0], xx);
        bounds[1] = Math.min(bounds[1], yy);
        bounds[2] = Math.max(bounds[2], xx);
        bounds[3] = Math.max(bounds[3], yy);
    }

    positions = truncate(positions, ptr);
    this.idToIndex = idToIndex;

    this.updateLines(options, positions);
    this.updateError('X', options);
    this.updateError('Y', options);

    var markerSize;

    if(this.hasMarkers) {
        this.scatterOptions.positions = positions;

        var markerColor = str2RGBArray(options.marker.color),
            borderColor = str2RGBArray(options.marker.line.color),
            opacity = (options.opacity) * (options.marker.opacity);

        markerColor[3] *= opacity;
        this.scatterOptions.color = markerColor;

        borderColor[3] *= opacity;
        this.scatterOptions.borderColor = borderColor;

        markerSize = options.marker.size;
        this.scatterOptions.size = markerSize;
        this.scatterOptions.borderSize = options.marker.line.width;

        this.scatter.update(this.scatterOptions);
    }
    else {
        this.scatterOptions.positions = new Float32Array(0);
        this.scatterOptions.glyphs = [];
        this.scatter.update(this.scatterOptions);
    }

    // turn off fancy scatter plot
    this.scatterOptions.positions = new Float32Array(0);
    this.scatterOptions.glyphs = [];
    this.fancyScatter.update(this.scatterOptions);

    // add item for autorange routine
    this.expandAxesFast(bounds, markerSize);
};

proto.updateFancy = function(options) {
    var scene = this.scene,
        xaxis = scene.xaxis,
        yaxis = scene.yaxis,
        bounds = this.bounds;

    // makeCalcdata runs d2c (data-to-coordinate) on every point
    var x = this.pickXData = xaxis.makeCalcdata(options, 'x').slice();
    var y = this.pickYData = yaxis.makeCalcdata(options, 'y').slice();

    this.xData = x.slice();
    this.yData = y.slice();

    // get error values
    var errorVals = ErrorBars.calcFromTrace(options, scene.fullLayout);

    var len = x.length,
        idToIndex = new Array(len),
        positions = new Float32Array(2 * len),
        errorsX = new Float32Array(4 * len),
        errorsY = new Float32Array(4 * len),
        pId = 0,
        ptr = 0,
        ptrX = 0,
        ptrY = 0;

    var getX = (xaxis.type === 'log') ?
            function(x) { return xaxis.d2l(x); } :
            function(x) { return x; };
    var getY = (yaxis.type === 'log') ?
            function(y) { return yaxis.d2l(y); } :
            function(y) { return y; };

    var i, j, xx, yy, ex0, ex1, ey0, ey1;

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

    var sizes;

    if(this.hasMarkers) {
        this.scatterOptions.positions = positions;

        // TODO rewrite convert function so that
        // we don't have to loop through the data another time

        this.scatterOptions.sizes = new Array(pId);
        this.scatterOptions.glyphs = new Array(pId);
        this.scatterOptions.borderWidths = new Array(pId);
        this.scatterOptions.colors = new Array(pId * 4);
        this.scatterOptions.borderColors = new Array(pId * 4);

        var markerSizeFunc = makeBubbleSizeFn(options),
            markerOpts = options.marker,
            markerOpacity = markerOpts.opacity,
            traceOpacity = options.opacity,
            colors = convertColorScale(markerOpts, markerOpacity, traceOpacity, len),
            glyphs = convertSymbol(markerOpts.symbol, len),
            borderWidths = convertNumber(markerOpts.line.width, len),
            borderColors = convertColorScale(markerOpts.line, markerOpacity, traceOpacity, len),
            index;

        sizes = convertArray(markerSizeFunc, markerOpts.size, len);

        for(i = 0; i < pId; ++i) {
            index = idToIndex[i];

            this.scatterOptions.sizes[i] = 4.0 * sizes[index];
            this.scatterOptions.glyphs[i] = glyphs[index];
            this.scatterOptions.borderWidths[i] = 0.5 * borderWidths[index];

            for(j = 0; j < 4; ++j) {
                this.scatterOptions.colors[4 * i + j] = colors[4 * index + j];
                this.scatterOptions.borderColors[4 * i + j] = borderColors[4 * index + j];
            }
        }

        this.fancyScatter.update(this.scatterOptions);
    }
    else {
        this.scatterOptions.positions = new Float32Array(0);
        this.scatterOptions.glyphs = [];
        this.fancyScatter.update(this.scatterOptions);
    }

    // turn off fast scatter plot
    this.scatterOptions.positions = new Float32Array(0);
    this.scatterOptions.glyphs = [];
    this.scatter.update(this.scatterOptions);

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
            linePositions = new Float32Array(2 * x.length);

            for(i = 0; i < x.length; ++i) {
                linePositions[p++] = x[i];
                linePositions[p++] = y[i];
            }
        }

        this.lineOptions.positions = linePositions;

        var lineColor = convertColor(options.line.color, options.opacity, 1),
            lineWidth = Math.round(0.5 * this.lineOptions.width),
            dashes = (DASHES[options.line.dash] || [1]).slice();

        for(i = 0; i < dashes.length; ++i) dashes[i] *= lineWidth;

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
        this.lineOptions.width = 2.0 * options.line.width;
        this.lineOptions.dashes = dashes;
        this.lineOptions.fillColor = [fillColor, fillColor, fillColor, fillColor];
    }
    else {
        this.lineOptions.positions = new Float32Array(0);
    }

    this.line.update(this.lineOptions);
};

proto.updateError = function(axLetter, options, positions, errors) {
    var errorObj = this['error' + axLetter],
        errorOptions = options['error_' + axLetter.toLowerCase()],
        errorObjOptions = this['error' + axLetter + 'Options'];

    if(axLetter.toLowerCase() === 'x' && errorOptions.copy_ystyle) {
        errorOptions = options.error_y;
    }

    if(this['hasError' + axLetter]) {
        errorObjOptions.positions = positions;
        errorObjOptions.errors = errors;
        errorObjOptions.capSize = errorOptions.width;
        errorObjOptions.lineWidth = errorOptions.thickness / 2;  // ballpark rescaling
        errorObjOptions.color = convertColor(errorOptions.color, 1, 1);
    }
    else {
        errorObjOptions.positions = new Float32Array(0);
    }

    errorObj.update(errorObjOptions);
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

// not quite on-par with 'scatter' (scatter fill in several other expand options),
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

function createLineWithMarkers(scene, data) {
    var plot = new LineWithMarkers(scene, data.uid);
    plot.update(data);
    return plot;
}

module.exports = createLineWithMarkers;
