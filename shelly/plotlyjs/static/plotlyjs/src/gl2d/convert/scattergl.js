'use strict';

var createScatter = require('gl-scatter2d');
var str2RGBArray = require('../../gl3d/lib/str2rgbarray');

function LineWithMarkers(scene, uid) {
  this.scene = scene;
  this.uid = uid;

  this.scatterOptions = {
    positions:    new Float32Array(),
    size:         12,
    borderSize:   1,
    color:        [0, 0, 0, 1],
    borderColor:  [0, 0, 0, 1]
  };

  this.scatter = createScatter(scene.glplot, this.scatterOptions);
}

var proto = LineWithMarkers.prototype;

proto.update = function(options) {
  var x = options.x;
  var y = options.y;
  var i;

  var numPoints = 0;
  for(i=0; i<x.length; ++i) {
    if(isNaN(x[i]) || isNaN(y[i])) {
      continue;
    }
    numPoints += 1;
  }

  var positions =
      this.scatterOptions.positions = new Float32Array(2 * numPoints);
  var ptr = 0;
  for(i=0; i<x.length; ++i) {
    if(isNaN(x[i]) || isNaN(y[i])) {
      continue;
    }
    positions[ptr++] = x[i];
    positions[ptr++] = y[i];
  }

  this.scatterOptions.size = options.marker.size;
  this.scatterOptions.borderSize = options.marker.line.width;

  var color = options.marker.color;
  var borderColor = options.marker.line.color;

  var colorArray = str2RGBArray(color);
  var borderColorArray = str2RGBArray(borderColor);

  this.scatterOptions.color = colorArray;
  this.scatterOptions.borderColor = borderColorArray;

  this.scatter.update(this.scatterOptions);
};

function createLineWithMarkers(scene, data) {
    var plot = new LineWithMarkers(scene, data.uid);
    plot.update(data);
    return plot;
}

module.exports = createLineWithMarkers;
