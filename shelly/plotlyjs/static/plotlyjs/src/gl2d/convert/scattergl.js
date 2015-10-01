'use strict';

var createScatter = require('gl-scatter2d');
var str2RGBArray = require('../../gl3d/lib/str2rgbarray');

function LineWithMarkers(scene, uid) {
  this.scene = scene;
  this.uid = uid;
  this.name = '';
  this.color = 'rgb(0,0,0)';

  this.xData = [];
  this.yData = [];
  this.textLabels = [];

  this.scatterOptions = {
    positions:    new Float32Array(),
    size:         12,
    borderSize:   1,
    color:        [0, 0, 0, 1],
    borderColor:  [0, 0, 0, 1]
  };
  this.scatter = createScatter(scene.glplot, this.scatterOptions);
  this.scatter._trace = this;
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

proto.update = function(options) {
  var x = options.x;
  var y = options.y;
  var i;

  this.name = options.name;

  this.xData = x;
  this.yData = y;
  this.textLabels = options.text;

  var numPoints = x.length;
  var positions =
      this.scatterOptions.positions = new Float32Array(2 * numPoints);
  var ptr = 0;
  for(i=0; i<x.length; ++i) {
    positions[ptr++] = x[i];
    positions[ptr++] = y[i];
  }

  this.scatterOptions.size = options.marker.size;
  this.scatterOptions.borderSize = options.marker.line.width;

  var color = options.marker.color;
  var borderColor = options.marker.line.color;

  this.color = color;

  var colorArray = str2RGBArray(color);
  var borderColorArray = str2RGBArray(borderColor);

  this.scatterOptions.color = colorArray;
  this.scatterOptions.borderColor = borderColorArray;

  this.scatter.update(this.scatterOptions);

  this.bounds = this.scatter.bounds.slice();
};

function createLineWithMarkers(scene, data) {
  var plot = new LineWithMarkers(scene, data.uid);
  plot.update(data);
  return plot;
}

module.exports = createLineWithMarkers;
