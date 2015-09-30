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
}


function createCamera(scene) {
  var element = scene.canvas;
  var plot = scene.glplot;
  var result = new Camera2D(element, plot);

  result.mouseListener = mouseChange(element, function(buttons, x, y) {
    y = window.innerHeight - y;
    x *= plot.pixelRatio;
    y *= plot.pixelRatio;

    var xrange = scene.fullLayout.scene2d.xaxis.range;
    var yrange = scene.fullLayout.scene2d.yaxis.range;

    var lastX = result.lastPos[0];
    var lastY = result.lastPos[1];

    if(buttons & 1) {
      var dx = (lastX - x) * (xrange[1] - xrange[0]) /
        (plot.viewBox[2] - plot.viewBox[0]);
      var dy = (lastY - y) * (yrange[1] - yrange[0]) /
        (plot.viewBox[3] - plot.viewBox[1]);
        /*
      xrange[0] += dx;
      xrange[1] += dy;
      yrange[0] += dx;
      yrange[1] += dy;
      */
      result.lastInputTime = Date.now();

      scene.cameraChanged();
    }

    result.lastPos[0] = x;
    result.lastPos[1] = y;
  });

  result.wheelListener = mouseWheel(element, function(dx, dy) {

    var scale = Math.exp(0.1 * dy / (plot.viewBox[3] - plot.viewBox[1]));

    var xrange = scene.fullLayout.scene2d.xaxis.range;
    var yrange = scene.fullLayout.scene2d.yaxis.range;

    var lastX = result.lastPos[0];
    var lastY = result.lastPos[1];

    var cx = (lastX - plot.viewBox[0]) / (plot.viewBox[2] - plot.viewBox[0]) * (xrange[1] - xrange[0]) + xrange[0];
    var cy = (plot.viewBox[1] - lastY) / (plot.viewBox[3] - plot.viewBox[1]) * (yrange[1] - yrange[0]) + yrange[0];
    /*
    xrange[0] = (xrange[0] - cx) * scale + cx;
    xrange[1] = (xrange[1] - cy) * scale + cy;
    yrange[0] = (yrange[0] - cx) * scale + cx;
    yrange[1] = (yrange[1] - cy) * scale + cy;
*/
    result.lastInputTime = Date.now();
    scene.cameraChanged();

    return true;
  });

  return result;
}
