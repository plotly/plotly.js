/* jshint shadow: true */

'use strict';

var AXES_NAMES = ['xaxis', 'yaxis', 'zaxis'];

var centerPoint = [0,0,0];

function contourLevelsFromTicks(ticks) {
    var result = new Array(3);
    for(var i=0; i<3; ++i) {
        var tlevel = ticks[i];
        var clevel = new Array(tlevel.length);
        for(var j=0; j<tlevel.length; ++j) {
            clevel[j] = tlevel[j].x;
        }
        result[i] = clevel;
    }
    return result;
}

function computeTickMarks(scene) {
    var axesOptions = scene.axesOptions;
    var glRange     = scene.glplot.axesPixels;
    var sceneLayout = scene.fullSceneLayout;

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
                axes.range[0] -= 1;
                axes.range[1] += 1;
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
        centerPoint[i] = 0.5 * (scene.glplot.bounds[0][i] + scene.glplot.bounds[1][i]);
        for(var j=0; j<2; ++j) {
            axesOptions.bounds[j][i] = scene.glplot.bounds[j][i];
        }
    }

    scene.contourLevels = contourLevelsFromTicks(ticks);
}

module.exports = computeTickMarks;
