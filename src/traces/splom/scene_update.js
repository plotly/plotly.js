/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

module.exports = function sceneUpdate(gd, trace) {
    var fullLayout = gd._fullLayout;
    var uid = trace.uid;

    // must place ref to 'scene' in fullLayout, so that:
    // - it can be relinked properly on updates
    // - it can be destroyed properly when needed
    var splomScenes = fullLayout._splomScenes;
    if(!splomScenes) splomScenes = fullLayout._splomScenes = {};

    var reset = {
        dirty: true,
        selectBatch: [],
        unselectBatch: []
    };

    var first = {
        matrix: false,
        selectBatch: [],
        unselectBatch: []
    };

    var scene = splomScenes[trace.uid];

    if(!scene) {
        scene = splomScenes[uid] = Lib.extendFlat({}, reset, first);

        scene.draw = function draw() {
            if(scene.matrix && scene.matrix.draw) {
                if(scene.selectBatch.length || scene.unselectBatch.length) {
                    scene.matrix.draw(scene.unselectBatch, scene.selectBatch);
                } else {
                    scene.matrix.draw();
                }
            }

            scene.dirty = false;
        };

        // remove scene resources
        scene.destroy = function destroy() {
            if(scene.matrix && scene.matrix.destroy) {
                scene.matrix.destroy();
            }
            scene.matrixOptions = null;
            scene.selectBatch = null;
            scene.unselectBatch = null;
            scene = null;
        };
    }

    // In case if we have scene from the last calc - reset data
    if(!scene.dirty) {
        Lib.extendFlat(scene, reset);
    }

    return scene;
};
