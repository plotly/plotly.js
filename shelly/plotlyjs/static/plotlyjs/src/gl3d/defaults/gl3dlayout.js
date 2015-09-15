'use strict';

var Plotly = require('../../plotly');

var Gl3dLayout = module.exports = {};

Plotly.Plots.registerSubplot('gl3d', 'scene', 'scene', {
    scene: {
        valType: 'sceneid',
        role: 'info',
        dflt: 'scene',
        description: [
            'Sets a reference between this trace\'s 3D coordinate system and',
            'a 3D scene.',
            'If *scene* (the default value), the (x,y,z) coordinates refer to',
            '`layout.scene`.',
            'If *scene2*, the (x,y,z) coordinates refer to `layout.scene2`,',
            'and so on.'
        ].join(' ')
    }
});

Gl3dLayout.layoutAttributes = require('../attributes/gl3dlayout');

Gl3dLayout.supplyLayoutDefaults = function (layoutIn, layoutOut, fullData) {

    if (!layoutOut._hasGL3D) return;

    var scenes = Plotly.Plots.getSubplotIdsInData(fullData, 'gl3d');
    var attributes = Gl3dLayout.layoutAttributes;
    var i;

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

        var cameraKeys = Object.keys(attributes.camera);

        for(var j = 0; j < cameraKeys.length; j++) {
            coerce('camera.' + cameraKeys[j] + '.x');
            coerce('camera.' + cameraKeys[j] + '.y');
            coerce('camera.' + cameraKeys[j] + '.z');
        }

        coerce('domain.x', [i / scenesLength, (i+1) / scenesLength]);
        coerce('domain.y');

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
