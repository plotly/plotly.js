'use strict'

module.exports = computeTickMarks

var project = require('./project');

//Proportional to the scale of the y axis
function pixelLength(
    camera, 
    resolution, 
    centerPoint,
    axis,
    desiredPixelLength) {
  var p = project(camera, centerPoint)
  return 2.0 * desiredPixelLength * p[3] / resolution[1]
}

var centerPoint = [0,0,0];

function solveLength(a, b, cameraParameters, shape) {
    for(var i=0; i<3; ++i) {
        a[i] = pixelLength(cameraParameters,
                    shape,
                    centerPoint,
                    i,
                    b[i]) / cameraParameters.model[5*i];
    }
}

function computeTickMarks(scene) {
    var axesOptions = scene.axesOptions;
    var glRange     = scene.scene.axesPixels
    var sceneLayout = scene.sceneLayout

    for (var i = 0; i < 3; ++i) {
        axes = sceneLayout[this.axesNames[i]];

        axes._length = (glRange[i].hi - glRange[i].lo) *
            glRange[i].pixelsPerDataUnit;

        if (Math.abs(axes._length) === Infinity) {
            ticks[i] = [];
        } else {
            axes.range[0] = glRange[i].lo;
            axes.range[1] = glRange[i].hi;
            axes._m       = 1 / glRange[i].pixelsPerDataUnit;
            // this is necessary to short-circuit the 'y' handling
            // in autotick part of calcTicks... Treating all axes as 'y' in this case
            // running the autoticks here, then setting
            // autoticks to false to get around the 2D handling in calcTicks.
            autoTickCached = axes.autotick;
            if (axes.autotick) {
                axes.autotick = false;
                nticks = axes.nticks || scene.Plotly.Lib.constrain((axes._length/40), 4, 9);
                scene.Plotly.Axes.autoTicks(axes, Math.abs(axes.range[1]-axes.range[0])/nticks);
            }
            ticks[i] = scene.Plotly.Axes.calcTicks(axes);

            axes.autotick = autoTickCached;
        }
    }

    //Calculate tick lengths dynamically
    for(i=0; i<3; ++i) {
        centerPoint[i] = 0.5 * (scene.scene.axis.bounds[0][i] + scene.scene.axis.bounds[1][i]);
    }

    solveLength(scene.axesOpts.lineTickLength, scene.axesOpts._defaultLineTickLength, scene.cameraParameters, scene.shape);
    solveLength(scene.axesOpts.tickPad,        scene.axesOpts._defaultTickPad, scene.cameraParameters, scene.shape);
    solveLength(scene.axesOpts.labelPad,       scene.axesOpts._defaultLabelPad, scene.cameraParameters, scene.shape);
}