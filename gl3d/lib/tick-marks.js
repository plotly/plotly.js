'use strict'

module.exports = computeTickMarks

var project = require('./project');

var AXES_NAMES = ['xaxis', 'yaxis', 'zaxis']

//Proportional to the scale of the y axis
function pixelLength(
    camera, 
    resolution, 
    centerPoint,
    axis,
    desiredPixelLength) {
    /*
    var p = project(camera, centerPoint);
    return 2.0 * desiredPixelLength * p[3] / resolution[1];
    */
    return 0.005 * desiredPixelLength
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
    var glRange     = scene.scene.axesPixels;
    var sceneLayout = scene.sceneLayout;

    var ticks = [[],[],[]];

    for (var i = 0; i < 3; ++i) {
        var axes = sceneLayout[AXES_NAMES[i]];

        axes._length = (glRange[i].hi - glRange[i].lo) *
            glRange[i].pixelsPerDataUnit;

        if (Math.abs(axes._length) === Infinity) {
            ticks[i] = [];
        } else {
            axes.range[0] = glRange[i].lo;
            axes.range[1] = glRange[i].hi;
            axes._m       = 1 / glRange[i].pixelsPerDataUnit;

            if(axes.range[0] === axes.range[1]) {
                axes.range[0] -= 1
                axes.range[1] += 1
            }
            // this is necessary to short-circuit the 'y' handling
            // in autotick part of calcTicks... Treating all axes as 'y' in this case
            // running the autoticks here, then setting
            // autoticks to false to get around the 2D handling in calcTicks.
            var autoTickCached = axes.autotick;
            if (axes.autotick) {
                axes.autotick = false;
                var nticks = axes.nticks || scene.Plotly.Lib.constrain((axes._length/40), 4, 9);
                scene.Plotly.Axes.autoTicks(axes, Math.abs(axes.range[1]-axes.range[0])/nticks);
            }
            ticks[i] = scene.Plotly.Axes.calcTicks(axes);

            axes.autotick = autoTickCached;
        }
    }

    axesOptions.ticks = ticks;

    //Calculate tick lengths dynamically
    for(var i=0; i<3; ++i) {
        centerPoint[i] = 0.5 * (scene.scene.bounds[0][i] + scene.scene.bounds[1][i]);
        for(var j=0; j<2; ++j) {
            axesOptions.bounds[j][i] = scene.scene.bounds[j][i]
        }
    }

    solveLength(scene.axesOptions.lineTickLength, scene.axesOptions._defaultLineTickLength, scene.scene.cameraParams, scene.scene.shape);
    solveLength(scene.axesOptions.tickPad,        scene.axesOptions._defaultTickPad, scene.scene.cameraParams, scene.scene.shape);
    solveLength(scene.axesOptions.labelPad,       scene.axesOptions._defaultLabelPad, scene.scene.cameraParams, scene.scene.shape);
}