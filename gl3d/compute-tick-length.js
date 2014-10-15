'use strict'

module.exports = calculateScaleFactor

var project = require('./project');

//Proportional to the scale of the y axis
function calculateScaleFactor(
    camera, 
    resolution, 
    centerPoint,
    axis,
    desiredPixelLength) {
  var p = project(camera, centerPoint)
  return 2.0 * desiredPixelLength * p[3] / resolution[1]
}