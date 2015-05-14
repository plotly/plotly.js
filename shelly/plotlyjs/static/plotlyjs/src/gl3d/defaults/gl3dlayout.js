'use strict';

var Plotly = require('../../plotly');

var Gl3dLayout = {};

module.exports = Gl3dLayout;

function makeVector(x, y, z) {
  return {
    x: {type: 'number', dflt: x},
    y: {type: 'number', dflt: y},
    z: {type: 'number', dflt: z}
  };
}

Gl3dLayout.layoutAttributes = {
    bgcolor: {
        type: 'color',
        dflt: 'rgba(0,0,0,0)'
    },
    camera: {
        up:     makeVector(0, 0, 1),
        center: makeVector(0, 0, 0),
        eye:    makeVector(1.25, 1.25, 1.25)
    },
    // old api -- to be deprecated
    cameraposition: {
        type: 'data_array'
    },
    domain: {
        x: [
            {type: 'number', min: 0, max: 1},
            {type: 'number', min: 0, max: 1}
        ],
        y:[
            {type: 'number', min: 0, max: 1, dflt: 0},
            {type: 'number', min: 0, max: 1, dflt: 1}
        ]
    },
    _nestedModules: {  // nested module coupling
        'xaxis': 'Gl3dAxes',
        'yaxis': 'Gl3dAxes',
        'zaxis': 'Gl3dAxes'
    },
    aspectmode: {
        type: 'enumerated',
        values: ['auto', 'cube', 'data', 'manual'],
        dflt: 'auto'
    },
    aspectratio: { // must be positive (0's are coerced to 1)
        x: {
            type: 'number',
            min: 0
        },
        y: {
            type: 'number',
            min: 0
        },
        z: {
            type: 'number',
            min: 0
        }
    }
};

Gl3dLayout.supplyLayoutDefaults = function (layoutIn, layoutOut, fullData) {

    if (!layoutOut._hasGL3D) return;

    var scenes = [];
    var attributes = Gl3dLayout.layoutAttributes;
    var i;

    for (i = 0; i < fullData.length; ++i) {
        var d = fullData[i];
        if (Plotly.Plots.isGL3D(d.type)) {
            if (scenes.indexOf(d.scene) === -1) {
                scenes.push(d.scene);
            }
        }
    }

    // until they play better together
    delete layoutOut.xaxis;
    delete layoutOut.yaxis;

    // Get number of scenes to compute default scene domain
    var scenesLength = scenes.length;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(sceneLayoutIn, sceneLayoutOut,
                                 attributes, attr, dflt);
    }

    for (i = 0; i < scenesLength; ++i) {
        var scene = scenes[i];
        /*
         * Scene numbering proceeds as follows
         * scene
         * scene2
         * scene3
         *
         * and d.scene will be undefined or some number or number string
         *
         * Also write back a blank scene object to user layout so that some
         * attributes like aspectratio can be written back dynamically.
         */
        var sceneLayoutIn;
        if(layoutIn[scene] !== undefined) sceneLayoutIn = layoutIn[scene];
        else layoutIn[scene] = sceneLayoutIn = {};

        var sceneLayoutOut = layoutOut[scene] || {};

        coerce('bgcolor');

        // coerce cameraposition in old graphs
        if(sceneLayoutIn.cameraposition !== undefined) coerce('cameraposition');

        var cameraKeys = Object.keys(attributes.camera);

        for(var j = 0; j < cameraKeys.length; j++) {
            coerce('camera.' + cameraKeys[j] + '.x');
            coerce('camera.' + cameraKeys[j] + '.y');
            coerce('camera.' + cameraKeys[j] + '.z');
        }

        coerce('domain.x[0]', i / scenesLength);
        coerce('domain.x[1]', (i+1) / scenesLength);
        coerce('domain.y[0]');
        coerce('domain.y[1]');

        /*
         * coerce to positive number (min 0) but also do not accept 0 (>0 not >=0)
         * note that 0's go false with the !! call
         */
        var hasAspect = !!coerce('aspectratio.x') &&
                        !!coerce('aspectratio.y') &&
                        !!coerce('aspectratio.z');

        var defaultAspectMode = hasAspect ? 'manual' : 'auto';
        var aspectMode = coerce('aspectmode', defaultAspectMode);

        /*
         * We need aspectratio object in all the Layouts as it is dynamically set
         * in the calculation steps, ie, we cant set the correct data now, it happens later.
         * We must also account for the case the user sends bad ratio data with 'manual' set
         * for the mode. In this case we must force change it here as the default coerce
         * misses it above.
         */
        if (!hasAspect) {
            sceneLayoutIn.aspectratio = sceneLayoutOut.aspectratio = {x: 1, y: 1, z: 1};

            if (aspectMode === 'manual') sceneLayoutOut.aspectmode = 'auto';
        }

         /*
          * scene arrangements need to be implemented: For now just splice
          * along the horizontal direction. ie.
          * x:[0,1] -> x:[0,0.5], x:[0.5,1] ->
          *     x:[0, 0.333] x:[0.333,0.666] x:[0.666, 1]
          */
        Plotly.Gl3dAxes.supplyLayoutDefaults(sceneLayoutIn, sceneLayoutOut, {
            font: layoutOut.font,
            scene: scene,
            data: fullData
        });

        layoutOut[scene] = sceneLayoutOut;
    }
};

// Clean scene ids, 'scene1' -> 'scene'
Gl3dLayout.cleanId = function cleanId(id) {
    if (!id.match(/^scene[0-9]*$/)) return;

    var sceneNum = id.substr(5);
    if (sceneNum === '1') sceneNum = '';

    return 'scene' + sceneNum;
};
