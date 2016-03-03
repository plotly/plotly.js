/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../../lib');
var Plots = require('../../plots');
var layoutAttributes = require('./layout_attributes');
var supplyGl3dAxisLayoutDefaults = require('./axis_defaults');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    if(!layoutOut._hasGL3D) return;

    var scenes = Plots.findSubplotIds(fullData, 'gl3d'),
        scenesLength = scenes.length;

    var sceneLayoutIn, sceneLayoutOut;

    function coerce(attr, dflt) {
        return Lib.coerce(sceneLayoutIn, sceneLayoutOut, layoutAttributes, attr, dflt);
    }

    // some layout-wide attribute are used in all scenes
    // if 3D is the only visible plot type
    function getDfltFromLayout(attr) {
        var isOnlyGL3D = !(
            layoutOut._hasCartesian ||
            layoutOut._hasGeo ||
            layoutOut._hasGL2D ||
            layoutOut._hasPie
        );

        var isValid = layoutAttributes[attr].values.indexOf(layoutIn[attr]) !== -1;

        if(isOnlyGL3D && isValid) return layoutIn[attr];
    }

    for(var i = 0; i < scenesLength; i++) {
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

        // gl3d traces get a layout scene for free!
        if(layoutIn[scene]) sceneLayoutIn = layoutIn[scene];
        else layoutIn[scene] = sceneLayoutIn = {};

        sceneLayoutOut = layoutOut[scene] || {};

        coerce('bgcolor');

        var cameraKeys = Object.keys(layoutAttributes.camera);

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
        if(!hasAspect) {
            sceneLayoutIn.aspectratio = sceneLayoutOut.aspectratio = {x: 1, y: 1, z: 1};

            if(aspectMode === 'manual') sceneLayoutOut.aspectmode = 'auto';
        }

        /*
         * scene arrangements need to be implemented: For now just splice
         * along the horizontal direction. ie.
         * x:[0,1] -> x:[0,0.5], x:[0.5,1] ->
         *     x:[0, 0.333] x:[0.333,0.666] x:[0.666, 1]
         */
        supplyGl3dAxisLayoutDefaults(sceneLayoutIn, sceneLayoutOut, {
            font: layoutOut.font,
            scene: scene,
            data: fullData
        });

        coerce('dragmode', getDfltFromLayout('dragmode'));
        coerce('hovermode', getDfltFromLayout('hovermode'));

        layoutOut[scene] = sceneLayoutOut;
    }
};
