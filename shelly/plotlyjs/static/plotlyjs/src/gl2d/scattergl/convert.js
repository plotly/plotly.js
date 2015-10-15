'use strict';

var Plotly = require('../../plotly');

var createScatter = require('gl-scatter2d');
var createFancyScatter = require('gl-scatter2d-fancy');
var createLine = require('gl-line2d');
var createError = require('gl-error2d');

var str2RGBArray = require('../../gl3d/lib/str2rgbarray');

var MARKER_SYMBOLS = require('../../gl3d/lib/markers.json');
var DASHES = require('../lib/dashes.json');

function LineWithMarkers(scene, uid) {
  this.scene = scene;
  this.uid = uid;
  this.name = '';
  this.color = 'rgb(0,0,0)';

  this.xData = [];
  this.yData = [];
  this.textLabels = [];

  this.errorXOptions = {
    positions: new Float32Array(),
    errors: new Float32Array(),
    lineWidth: 1,
    capSize: 0,
    color: [0,0,0,1]
  };
  this.errorX = createError(scene.glplot, this.errorXOptions);
  this.errorX._trace = this;

  this.errorYOptions = {
    positions: new Float32Array(),
    errors: new Float32Array(),
    lineWidth: 1,
    capSize: 0,
    color: [0,0,0,1]
  };
  this.errorY = createError(scene.glplot, this.errorYOptions);
  this.errorY._trace = this;

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

  this.scatterOptions = {
    positions:    new Float32Array(),
    sizes:        [],
    colors:       [],
    glyphs:       [],
    borderWidths: [],
    borderColors: [],

    size:         12,
    color:        [0, 0, 0, 1],
    borderSize:   1,
    borderColor:  [0, 0, 0, 1]
  };

  this.scatter = createScatter(scene.glplot, this.scatterOptions);
  this.scatter._trace = this;

  this.fancyScatter = createFancyScatter(scene.glplot, this.scatterOptions);
  this.fancyScatter._trace = this;

  this.bounds = [0,0,0,0];
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
    name: this.name,
    color: this.color,
    text: this.text && this.text[id]
  };
};

//Check if a marker is fancy
function checkFancyScatter(marker) {
  if(Array.isArray(marker.symbol) ||
     marker.symbol !== 'circle' ||
     Array.isArray(marker.size) ||
     Array.isArray(marker.line.width) ||
     Array.isArray(marker.opacity)) {
    return true;
  }

  var color = marker.color;
  if(Array.isArray(color)) {
    return true;
  }

  var lineColor = Array.isArray(marker.line.color);
  if(Array.isArray(lineColor)) {
    return true;
  }

  return false;
}


//Handle the situation where values can be array-like or not array like
function convertArray(convert, data, count) {
  if(!Array.isArray(data)) {
    data = [ data ];
  }
  var result = new Array(count);
  for(var i=0; i<count; ++i) {
    if(i >= data.length) {
      result[i] = convert(data[0]);
    } else {
      result[i] = convert(data[i]);
    }
  }
  return result;
}

var convertNumber = convertArray.bind(null, function(x) { return +x; });
var convertColorBase = convertArray.bind(null, str2RGBArray);
var convertSymbol = convertArray.bind(null, function(x) {
  return MARKER_SYMBOLS[x] || '●';
});

function convertColor(color, opacity, count) {
  var colors = convertColorBase(color, count);
  var opacities = convertNumber(opacity, count);
  var result = new Array(4 * count);
  for(var i=0; i<count; ++i) {
    for(var j=0; j<3; ++j) {
      result[4*i+j] = colors[i][j];
    }
    result[4*i+3] = Math.min(colors[i][j], opacities[i]);
  }
  return result;
}


proto.update = function(options) {
  var x = options.x;
  var y = options.y;
  var i;

  var xaxis = this.scene.xaxis;
  var yaxis = this.scene.yaxis;
  var errorVals = Plotly.ErrorBars.calcFromTrace(options, this.scene.fullLayout);

  this.name = options.name;

  this.xData = x;
  this.yData = y;
  this.textLabels = options.text;
  var bounds = this.bounds = [Infinity, Infinity, -Infinity, -Infinity];

  var numPoints = x.length;
  var positions = new Float32Array(2 * numPoints);
  var errorsX = new Float32Array(4 * numPoints);
  var errorsY = new Float32Array(4 * numPoints);
  var ptr = 0;
  var ptrX = 0;
  var ptrY = 0;

  for(i=0; i<x.length; ++i) {
    var xx = positions[ptr++] = xaxis.d2l(x[i]);
    var yy = positions[ptr++] = yaxis.d2l(y[i]);

    var ex0 = errorsX[ptrX++] = xx - errorVals[i].xs || 0;
    var ex1 = errorsX[ptrX++] = errorVals[i].xh - xx || 0;
    errorsX[ptrX++] = 0;
    errorsX[ptrX++] = 0;

    errorsY[ptrY++] = 0;
    errorsY[ptrY++] = 0;
    var ey0 = errorsY[ptrY++] = yy - errorVals[i].ys || 0;
    var ey1 = errorsY[ptrY++] = errorVals[i].yh - yy || 0;

    bounds[0] = Math.min(bounds[0], xx - ex0);
    bounds[1] = Math.min(bounds[1], yy - ey0);
    bounds[2] = Math.max(bounds[2], xx + ex1);
    bounds[3] = Math.max(bounds[3], yy + ey1);
  }

  var mode = options.mode;

  if(mode.indexOf('line') >= 0) {
    this.lineOptions.positions = positions;
  } else {
    this.lineOptions.positions = new Float32Array();
  }

  this.errorXOptions.positions = positions;
  this.errorXOptions.errors = errorsX;
  this.errorXOptions.capSize = options.error_x.width;
  this.errorXOptions.lineWidth = options.error_x.thickness / 2;  // ballpark rescaling
  this.errorXOptions.color = convertColor(options.error_x.color, 1, 1);

  this.errorYOptions.positions = positions;
  this.errorYOptions.errors = errorsY;
  this.errorYOptions.capSize = options.error_y.width;
  this.errorYOptions.lineWidth = options.error_y.thickness / 2;  // ballpark rescaling
  this.errorYOptions.color = convertColor(options.error_y.color, 1, 1);

  if(('marker' in options) && mode.indexOf('marker') >= 0) {

    var markerSizeFunc = Plotly.Scatter.getBubbleSizeFn(options);

    var fancy = checkFancyScatter(options.marker);
    this.scatterOptions.positions = positions;

    //Check if we need fancy mode (slower, but more features)
    if(fancy) {

      this.scatterOptions.sizes =
        convertArray(markerSizeFunc, options.marker.size, numPoints);
      this.scatterOptions.glyphs =
        convertSymbol(options.marker.symbol, numPoints);
      this.scatterOptions.colors =
        convertColor(options.marker.color, options.marker.opacity, numPoints);
      this.scatterOptions.borderWidths =
        convertNumber(options.marker.line.width, numPoints);
      this.scatterOptions.borderColors =
        convertColor(options.marker.line.color,
          options.marker.opacity,
          numPoints);

      for(i=0; i<numPoints; ++i) {
        this.scatterOptions.sizes[i] *= 4.0;
        this.scatterOptions.borderWidths[i] *= 0.5;
      }

      this.color = options.marker.color;

      this.fancyScatter.update(this.scatterOptions);

      this.scatterOptions.positions = new Float32Array();
      this.scatter.update(this.scatterOptions);

    } 
    else {

      var color            = options.marker.color;
      var borderColor      = options.marker.line.color;

      var colorArray       = str2RGBArray(color);
      var borderColorArray = str2RGBArray(borderColor);
      var opacity          = +options.marker.opacity;
      colorArray[3]       *= opacity;
      borderColorArray[3] *= opacity;

      this.color = color;

      this.scatterOptions.size       = 2.0 * markerSizeFunc(options.marker.size);
      this.scatterOptions.borderSize = +options.marker.line.width;
      this.scatterOptions.color       = colorArray;
      this.scatterOptions.borderColor = borderColorArray;

      this.scatter.update(this.scatterOptions);

      //Turn off fancy scatter plot
      this.scatterOptions.positions = new Float32Array();
      this.scatterOptions.glyphs = [];
      this.fancyScatter.update(this.scatterOptions);
    }
  } else {
    //Don't draw markers
    console.log('markers disabled');
    this.scatterOptions.positions = new Float32Array();
    this.scatterOptions.glyphs = [];
    this.scatter.update(this.scatterOptions);
    this.fancyScatter.update(this.scatterOptions);
  }


  if('line' in options) {
    var lineColor = str2RGBArray(options.line.color);
    if('marker' in options) {
      lineColor[3] *= options.marker.opacity;
    }
    this.lineOptions.color = lineColor;
    this.lineOptions.width = 2.0 * options.line.width;

    var lineWidth = Math.round(0.5 * this.lineOptions.width);
    var dashes = (DASHES[options.line.dash] || [1]).slice();
    for(i=0; i<dashes.length; ++i) {
      dashes[i] *= lineWidth;
    }
    this.lineOptions.dashes = dashes;

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

    var fillColor = this.lineOptions.color.slice();
    fillColor[3] *= 0.5;
    if('fillcolor' in options) {
      fillColor = str2RGBArray(options.fillcolor);
    }
    this.lineOptions.fillColor = [fillColor, fillColor, fillColor, fillColor];

  } else {
    this.lineOptions.position = new Float32Array();
  }


  this.line.update(this.lineOptions);
  this.errorX.update(this.errorXOptions);
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
