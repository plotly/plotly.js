'use strict';

var mouseChange = require('mouse-change');
var mouseWheel = require('mouse-wheel');

module.exports = createCamera;

function Camera2D(element, plot) {
  this.element        = element;
  this.plot           = plot;
  this.mouseListener  = null;
  this.wheelListener  = null;
  this.lastInputTime  = Date.now();
  this.lastPos        = [0,0];
  this.boxEnabled     = false;
  this.boxStart       = [0,0];
  this.boxEnd         = [0,0];
}


function createCamera(scene) {
  var element = scene.canvas;
  var plot = scene.glplot;
  var result = new Camera2D(element, plot);

  result.mouseListener = mouseChange(element, function(buttons, x, y) {
    x *= plot.pixelRatio;
    y *= plot.pixelRatio;
    y = element.height - y;

    var xrange = scene.fullLayout.xaxis.range;
    var yrange = scene.fullLayout.yaxis.range;

    var lastX = result.lastPos[0];
    var lastY = result.lastPos[1];

    switch(scene.fullLayout.dragmode) {
      case 'zoom':
        if(buttons) {
          var dataX = (x - plot.viewBox[0]) /
            (plot.viewBox[2]-plot.viewBox[0]) * (xrange[1] - xrange[0]) +
            xrange[0];
          var dataY = (y - plot.viewBox[1]) /
            (plot.viewBox[3]-plot.viewBox[1]) * (yrange[1] - yrange[0]) +
            yrange[0];
          if(!result.boxEnabled) {
            result.boxStart[0] = dataX;
            result.boxStart[1] = dataY;
          }

          result.boxEnd[0] = dataX;
          result.boxEnd[1] = dataY;
          result.boxEnabled = true;
        } else if(result.boxEnabled) {
          xrange[0] = Math.min(result.boxStart[0], result.boxEnd[0]);
          xrange[1] = Math.max(result.boxStart[0], result.boxEnd[0]);
          yrange[0] = Math.min(result.boxStart[1], result.boxEnd[1]);
          yrange[1] = Math.max(result.boxStart[1], result.boxEnd[1]);

          result.boxEnabled = false;
        }
      break;

      case 'pan':
        result.boxEnabled = false;

        if(buttons) {
          var dx = (lastX - x) * (xrange[1] - xrange[0]) /
            (plot.viewBox[2] - plot.viewBox[0]);
          var dy = (lastY - y) * (yrange[1] - yrange[0]) /
            (plot.viewBox[3] - plot.viewBox[1]);

          xrange[0] += dx;
          xrange[1] += dx;
          yrange[0] += dy;
          yrange[1] += dy;

          result.lastInputTime = Date.now();

          scene.cameraChanged();
        }
      break;
    }

    result.lastPos[0] = x;
    result.lastPos[1] = y;
  });

  result.wheelListener = mouseWheel(element, function(dx, dy) {
    var xrange = scene.fullLayout.xaxis.range;
    var yrange = scene.fullLayout.yaxis.range;

    var lastX = result.lastPos[0];
    var lastY = result.lastPos[1];

    switch(scene.fullLayout.dragmode) {
      case 'zoom':
      break;

      case 'pan':
        var scale = Math.exp(0.1 * dy / (plot.viewBox[3] - plot.viewBox[1]));

        var cx = (lastX - plot.viewBox[0]) / (plot.viewBox[2] - plot.viewBox[0]) * (xrange[1] - xrange[0]) + xrange[0];
        var cy = (plot.viewBox[1] - lastY) / (plot.viewBox[3] - plot.viewBox[1]) * (yrange[1] - yrange[0]) + yrange[0];

        xrange[0] = (xrange[0] - cx) * scale + cx;
        xrange[1] = (xrange[1] - cy) * scale + cy;
        yrange[0] = (yrange[0] - cx) * scale + cx;
        yrange[1] = (yrange[1] - cy) * scale + cy;

        result.lastInputTime = Date.now();
        scene.cameraChanged();
      break;
    }

    return true;
  });

  return result;
}
