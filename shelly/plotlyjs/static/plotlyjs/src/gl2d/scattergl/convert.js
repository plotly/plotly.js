'use strict';

var Plotly = require('../../plotly');

var createScatter = require('gl-scatter2d');
var createFancyScatter = require('gl-scatter2d-fancy');
var createLine = require('gl-line2d');
var createError = require('gl-error2d');

var str2RGBArray = require('../../gl3d/lib/str2rgbarray');
var formatColor = require('../../gl3d/lib/format-color');

var MARKER_SYMBOLS = require('../../gl3d/lib/markers.json');
var DASHES = require('../lib/dashes.json');


function LineWithMarkers(scene, uid) {
    this.scene = scene;
    this.uid = uid;

    this.xData = [];
    this.yData = [];
    this.textLabels = [];
    this.color = 'rgb(0, 0, 0)';
    this.name = '';
    this.hoverinfo = 'all';

    this.bounds = [0, 0, 0, 0];

    this.scatterOptions = {
        positions: new Float32Array(),
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

    this.lineOptions = {
      positions:  new Float32Array(),
      color:      [0, 0, 0, 1],
      width:      1,
      fill:       [false, false, false, false],
      fillColor:  [
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1]],
      dashes:     [1]
    };
    this.line = createLine(scene.glplot, this.lineOptions);
    this.line._trace = this;

    this.fancyScatter = createFancyScatter(scene.glplot, this.scatterOptions);
    this.fancyScatter._trace = this;

    this.errorXOptions = {
        positions: new Float32Array(),
        errors: new Float32Array(),
        lineWidth: 1,
        capSize: 0,
        color: [0, 0, 0, 1]
    };
    this.errorX = createError(scene.glplot, this.errorXOptions);
    this.errorX._trace = this;

    this.errorYOptions = {
        positions: new Float32Array(),
        errors: new Float32Array(),
        lineWidth: 1,
        capSize: 0,
        color: [0, 0, 0, 1]
    };
    this.errorY = createError(scene.glplot, this.errorYOptions);
    this.errorY._trace = this;
}

var proto = LineWithMarkers.prototype;

proto.handlePick = function(pickResult) {
    var id = pickResult.pointId;

    return {
        trace: this,
        dataCoord: pickResult.dataCoord,
        traceCoord: [
            this.xData[id],
            this.yData[id]
        ],
        textLabel: Array.isArray(this.textLabels) ? this.textLabels[id] : this.textLabels,
        color: Array.isArray(this.color) ? this.color[id] : this.color,
        name: this.name,
        hoverinfo: this.hoverinfo
    };
};

// check if a marker is fancy
function checkFancyScatter(marker) {
    if(Array.isArray(marker.symbol) ||
         marker.symbol !== 'circle' ||
         Array.isArray(marker.size) ||
         Array.isArray(marker.line.width) ||
         Array.isArray(marker.opacity)) {
        return true;
    }

    var color = marker.color;
    if(Array.isArray(color)) return true;

    var lineColor = Array.isArray(marker.line.color);
    if(Array.isArray(lineColor)) return true;

    return false;
}

//Handle the situation where values can be array-like or not array like
function convertArray(convert, data, count) {
    if(!Array.isArray(data)) data = [data];

    return _convertArray(convert, data, count);
}

function _convertArray(convert, data, count) {
    var result = new Array(count);

    for(var i = 0; i < count; ++i) {
        result[i] = (i >= data.length) ?
            convert(data[0]) :
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

function convertColorOrColorScale(containerIn, opacity, count) {
    var colors = formatColor(containerIn, opacity, count);

    colors = Array.isArray(colors[0]) ?
        colors :
        _convertArray(Plotly.Lib.identity, [colors], count);

    return _convertColor(
        colors,
        convertNumber(opacity, count),
        count
    );
}

function _convertColor(colors, opacities, count) {
    var result = new Array(4 * count);

    for(var i = 0; i < count; ++i) {
        for(var j = 0; j < 3; ++j) result[4*i+j] = colors[i][j];
        result[4*i+3] = colors[i][j] * opacities[i];
    }

    return result;
}

proto.update = function(options) {
    var x = options.x,
        y = options.y,
        scene = this.scene,
        xaxis = scene.xaxis,
        yaxis = scene.yaxis,
        hasMarkers = Plotly.Scatter.hasMarkers(options),
        hasLines = Plotly.Scatter.hasLines(options),
        hasErrorX = (options.error_x.visible === true),
        hasErrorY = (options.error_y.visible === true);

    this.xData = xaxis.makeCalcdata(options, 'x');
    this.yData = yaxis.makeCalcdata(options, 'y');
    this.textLabels = options.text;

    // not quite on-par with 'scatter', but close enough for now
    this.color = hasMarkers ? options.marker.color : options.line.color;

    this.name = options.name;
    this.hoverinfo = options.hoverinfo;

    var bounds = this.bounds = [Infinity, Infinity, -Infinity, -Infinity];

    var numPoints = x.length,
        positions = new Float32Array(2 * numPoints),
        errorVals = Plotly.ErrorBars.calcFromTrace(options, scene.fullLayout),
        errorsX = new Float32Array(4 * numPoints),
        errorsY = new Float32Array(4 * numPoints),
        ptr = 0,
        ptrX = 0,
        ptrY = 0;

    var i, xx, yy, ex0, ex1, ey0, ey1;

    for(i = 0; i < x.length; ++i) {
        xx = positions[ptr++] = xaxis.d2l(x[i]);
        yy = positions[ptr++] = yaxis.d2l(y[i]);

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

    if(hasMarkers) {
        this.scatterOptions.positions = positions;

        var markerSizeFunc = Plotly.Scatter.getBubbleSizeFn(options),
            isFancy = checkFancyScatter(options.marker);

        // check if we need fancy mode (slower, but more features)
        if(isFancy) {
            this.scatterOptions.sizes = convertArray(
                markerSizeFunc, options.marker.size, numPoints);
            this.scatterOptions.glyphs = convertSymbol(
                options.marker.symbol, numPoints);
            this.scatterOptions.colors = convertColorOrColorScale(
                options.marker, options.marker.opacity, numPoints);
            this.scatterOptions.borderWidths = convertNumber(
                options.marker.line.width, numPoints);
            this.scatterOptions.borderColors = convertColorOrColorScale(
                options.marker.line, options.marker.opacity, numPoints);

            for(i = 0; i < numPoints; ++i) {
                this.scatterOptions.sizes[i] *= 4.0;
                this.scatterOptions.borderWidths[i] *= 0.5;
            }

            this.fancyScatter.update(this.scatterOptions);
            this.scatterOptions.positions = new Float32Array();
            this.scatter.update(this.scatterOptions);
        }
        else {
            var color = options.marker.color,
                borderColor = options.marker.line.color,
                colorArray = str2RGBArray(color),
                borderColorArray = str2RGBArray(borderColor),
                opacity = +options.marker.opacity;

            colorArray[3] *= opacity;
            borderColorArray[3] *= opacity;

            this.scatterOptions.size = 2.0 * markerSizeFunc(options.marker.size);
            this.scatterOptions.borderSize = +options.marker.line.width;
            this.scatterOptions.color = colorArray;
            this.scatterOptions.borderColor = borderColorArray;

            this.scatter.update(this.scatterOptions);

            // turn off fancy scatter plot
            this.scatterOptions.positions = new Float32Array();
            this.scatterOptions.glyphs = [];
            this.fancyScatter.update(this.scatterOptions);
        }
    }
    else {
        // don't draw markers
        this.scatterOptions.positions = new Float32Array();
        this.scatterOptions.glyphs = [];
        this.scatter.update(this.scatterOptions);
        this.fancyScatter.update(this.scatterOptions);
    }

    if(hasLines) {
        this.lineOptions.positions = positions;

        var lineColor = str2RGBArray(options.line.color);
        if(hasMarkers) lineColor[3] *= options.marker.opacity;


        var lineWidth = Math.round(0.5 * this.lineOptions.width),
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
        this.lineOptions.position = new Float32Array();
    }

    this.line.update(this.lineOptions);

    if(hasErrorX) {
        this.errorXOptions.positions = positions;
        this.errorXOptions.errors = errorsX;
        this.errorXOptions.capSize = options.error_x.width;
        this.errorXOptions.lineWidth = options.error_x.thickness / 2;  // ballpark rescaling
        this.errorXOptions.color = convertColor(options.error_x.color, 1, 1);
    }
    else {
        this.errorXOptions.positions = new Float32Array();
    }

    this.errorX.update(this.errorXOptions);

    if(hasErrorY) {
        this.errorYOptions.positions = positions;
        this.errorYOptions.errors = errorsY;
        this.errorYOptions.capSize = options.error_y.width;
        this.errorYOptions.lineWidth = options.error_y.thickness / 2;  // ballpark rescaling
        this.errorYOptions.color = convertColor(options.error_y.color, 1, 1);
    }
    else {
        this.errorYOptions.positions = new Float32Array();
    }

    this.errorY.update(this.errorYOptions);
};

proto.dispose = function() {
    this.line.dispose();
    this.scatter.dispose();
    this.errorX.dispose();
    this.errorY.dispose();
    this.fancyScatter.dispose();
};

function createLineWithMarkers(scene, data) {
    var plot = new LineWithMarkers(scene, data.uid);
    plot.update(data);
    return plot;
}

module.exports = createLineWithMarkers;
