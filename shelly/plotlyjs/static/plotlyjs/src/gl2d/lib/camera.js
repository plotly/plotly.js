'use strict';

var mouseChange = require('mouse-change');
var mouseWheel = require('mouse-wheel');

module.exports = createCamera;

function Camera2D(element, plot) {
  this.element        = element;
  this.plot           = plot;
  this.mouseListener  = null;
  this.wheelListener  = null;
  this.dataBox        = [0,0,0,0];
  this.lastInputTime  = Date.now();
  this.lastPos        = [0,0];
}

Camera2D.prototype.syncDataBox = function() {
  var dataBox = this.dataBox;
  var plot = this.plot;

  dataBox[0] = plot.dataBox[0];
  dataBox[1] = plot.dataBox[1];
  dataBox[2] = plot.dataBox[2];
  dataBox[3] = plot.dataBox[3];
};

function createCamera(scene) {
  var element = scene.canvas;
  var plot = scene.glplot;
  var result = new Camera2D(element, plot);
  result.syncDataBox();

  var dataBox = result.dataBox;

  result.mouseListener = mouseChange(element, function(buttons, x, y) {
    y = window.innerHeight - y;
    x *= plot.pixelRatio;
    y *= plot.pixelRatio;

    var lastX = result.lastPos[0];
    var lastY = result.lastPos[1];

    if(buttons & 1) {
      var dx = (lastX - x) * (dataBox[2] - dataBox[0]) /
        (plot.viewBox[2] - plot.viewBox[0]);
      var dy = (lastY - y) * (dataBox[3] - dataBox[1]) /
        (plot.viewBox[3] - plot.viewBox[1]);

      dataBox[0] += dx;
      dataBox[1] += dy;
      dataBox[2] += dx;
      dataBox[3] += dy;

      result.lastInputTime = Date.now();

      scene.cameraChanged();
    }

    result.lastPos[0] = x;
    result.lastPos[1] = y;
  });

  result.wheelListener = mouseWheel(element, function(dx, dy) {

    var scale = Math.exp(0.1 * dy / (plot.viewBox[3] - plot.viewBox[1]));

    var lastX = result.lastPos[0];
    var lastY = result.lastPos[1];

    var cx = (lastX - plot.viewBox[0]) / (plot.viewBox[2] - plot.viewBox[0]) * (dataBox[2] - dataBox[0]) + dataBox[0];
    var cy = (plot.viewBox[1] - lastY) / (plot.viewBox[3] - plot.viewBox[1]) * (dataBox[3] - dataBox[1]) + dataBox[3];

    dataBox[0] = (dataBox[0] - cx) * scale + cx;
    dataBox[1] = (dataBox[1] - cy) * scale + cy;
    dataBox[2] = (dataBox[2] - cx) * scale + cx;
    dataBox[3] = (dataBox[3] - cy) * scale + cy;

    result.lastInputTime = Date.now();
    scene.cameraChanged();

    return true;
  });

  return result;
}
