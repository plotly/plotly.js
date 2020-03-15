/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

// make sure scene exists on subplot, return it
module.exports = function sceneUpdate(gd, subplot) {
    var scene = subplot._scene;

    var resetOpts = {
        // number of traces in subplot, since scene:subplot -> 1:1
        count: 0,
        // whether scene requires init hook in plot call (dirty plot call)
        dirty: true,
        // last used options
        lineOptions: [],
        fillOptions: [],
        markerOptions: [],
        markerSelectedOptions: [],
        markerUnselectedOptions: [],
        errorXOptions: [],
        errorYOptions: [],
        textOptions: [],
        textSelectedOptions: [],
        textUnselectedOptions: [],
        // selection batches
        selectBatch: [],
        unselectBatch: []
    };

    // regl- component stubs, initialized in dirty plot call
    var initOpts = {
        fill2d: false,
        scatter2d: false,
        error2d: false,
        line2d: false,
        glText: false,
        select2d: false
    };

    if(!subplot._scene) {
        scene = subplot._scene = {};

        scene.init = function init() {
            Lib.extendFlat(scene, initOpts, resetOpts);
        };

        scene.init();

        // apply new option to all regl components (used on drag)
        scene.update = function update(opt) {
            var opts = Lib.repeat(opt, scene.count);

            if(scene.fill2d) scene.fill2d.update(opts);
            if(scene.scatter2d) scene.scatter2d.update(opts);
            if(scene.line2d) scene.line2d.update(opts);
            if(scene.error2d) scene.error2d.update(opts.concat(opts));
            if(scene.select2d) scene.select2d.update(opts);
            if(scene.glText) {
                for(var i = 0; i < scene.count; i++) {
                    scene.glText[i].update(opt);
                }
            }
        };

        // draw traces in proper order
        scene.draw = function draw() {
            var count = scene.count;
            var fill2d = scene.fill2d;
            var error2d = scene.error2d;
            var line2d = scene.line2d;
            var scatter2d = scene.scatter2d;
            var glText = scene.glText;
            var select2d = scene.select2d;
            var selectBatch = scene.selectBatch;
            var unselectBatch = scene.unselectBatch;

            for(var i = 0; i < count; i++) {
                if(fill2d && scene.fillOrder[i]) {
                    fill2d.draw(scene.fillOrder[i]);
                }
                if(line2d && scene.lineOptions[i]) {
                    line2d.draw(i);
                }
                if(error2d) {
                    if(scene.errorXOptions[i]) error2d.draw(i);
                    if(scene.errorYOptions[i]) error2d.draw(i + count);
                }
                if(scatter2d && scene.markerOptions[i]) {
                    if(unselectBatch[i].length) {
                        var arg = Lib.repeat([], scene.count);
                        arg[i] = unselectBatch[i];
                        scatter2d.draw(arg);
                    } else if(!selectBatch[i].length) {
                        scatter2d.draw(i);
                    }
                }
                if(glText[i] && scene.textOptions[i]) {
                    glText[i].render();
                }
            }

            if(select2d) {
                select2d.draw(selectBatch);
            }

            scene.dirty = false;
        };

        // remove scene resources
        scene.destroy = function destroy() {
            if(scene.fill2d && scene.fill2d.destroy) scene.fill2d.destroy();
            if(scene.scatter2d && scene.scatter2d.destroy) scene.scatter2d.destroy();
            if(scene.error2d && scene.error2d.destroy) scene.error2d.destroy();
            if(scene.line2d && scene.line2d.destroy) scene.line2d.destroy();
            if(scene.select2d && scene.select2d.destroy) scene.select2d.destroy();
            if(scene.glText) {
                scene.glText.forEach(function(text) {
                    if(text.destroy) text.destroy();
                });
            }

            scene.lineOptions = null;
            scene.fillOptions = null;
            scene.markerOptions = null;
            scene.markerSelectedOptions = null;
            scene.markerUnselectedOptions = null;
            scene.errorXOptions = null;
            scene.errorYOptions = null;
            scene.textOptions = null;
            scene.textSelectedOptions = null;
            scene.textUnselectedOptions = null;

            scene.selectBatch = null;
            scene.unselectBatch = null;

            // we can't just delete _scene, because `destroy` is called in the
            // middle of supplyDefaults, before relinkPrivateKeys which will put it back.
            subplot._scene = null;
        };
    }

    // in case if we have scene from the last calc - reset data
    if(!scene.dirty) {
        Lib.extendFlat(scene, resetOpts);
    }

    return scene;
};
