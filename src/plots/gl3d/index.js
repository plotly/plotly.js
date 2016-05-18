/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Scene = require('./scene');
var Plots = require('../plots');
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');

var axesNames = ['xaxis', 'yaxis', 'zaxis'];


exports.name = 'gl3d';

exports.attr = 'scene';

exports.idRoot = 'scene';

exports.idRegex = /^scene([2-9]|[1-9][0-9]+)?$/;

exports.attrRegex = /^scene([2-9]|[1-9][0-9]+)?$/;

exports.attributes = require('./layout/attributes');

exports.layoutAttributes = require('./layout/layout_attributes');

exports.supplyLayoutDefaults = require('./layout/defaults');

exports.plot = function plotGl3d(gd) {
    var fullLayout = gd._fullLayout,
        fullData = gd._fullData,
        sceneIds = Plots.getSubplotIds(fullLayout, 'gl3d');

    fullLayout._paperdiv.style({
        width: fullLayout.width + 'px',
        height: fullLayout.height + 'px'
    });

    gd._context.setBackground(gd, fullLayout.paper_bgcolor);

    for(var i = 0; i < sceneIds.length; i++) {
        var sceneId = sceneIds[i],
            fullSceneData = Plots.getSubplotData(fullData, 'gl3d', sceneId),
            sceneLayout = fullLayout[sceneId],
            scene = sceneLayout._scene;

        // If Scene is not instantiated, create one!
        if(scene === undefined) {
            initAxes(gd, sceneLayout);

            scene = new Scene({
                id: sceneId,
                graphDiv: gd,
                container: gd.querySelector('.gl-container'),
                staticPlot: gd._context.staticPlot,
                plotGlPixelRatio: gd._context.plotGlPixelRatio
            },
                fullLayout
            );

            // set ref to Scene instance
            sceneLayout._scene = scene;
        }

        scene.plot(fullSceneData, fullLayout, gd.layout);
    }
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var oldSceneKeys = Plots.getSubplotIds(oldFullLayout, 'gl3d');

    for(var i = 0; i < oldSceneKeys.length; i++) {
        var oldSceneKey = oldSceneKeys[i];

        if(!newFullLayout[oldSceneKey] && !!oldFullLayout[oldSceneKey]._scene) {
            oldFullLayout[oldSceneKey]._scene.destroy();
        }
    }
};

exports.toSVG = function(gd) {
    var fullLayout = gd._fullLayout,
        sceneIds = Plots.getSubplotIds(fullLayout, 'gl3d'),
        size = fullLayout._size;

    for(var i = 0; i < sceneIds.length; i++) {
        var sceneLayout = fullLayout[sceneIds[i]],
            domain = sceneLayout.domain,
            scene = sceneLayout._scene;

        var imageData = scene.toImage('png');
        var image = fullLayout._glimages.append('svg:image');

        image.attr({
            xmlns: xmlnsNamespaces.svg,
            'xlink:href': imageData,
            x: size.l + size.w * domain.x[0],
            y: size.t + size.h * (1 - domain.y[1]),
            width: size.w * (domain.x[1] - domain.x[0]),
            height: size.h * (domain.y[1] - domain.y[0]),
            preserveAspectRatio: 'none'
        });

        scene.destroy();
    }
};

// clean scene ids, 'scene1' -> 'scene'
exports.cleanId = function cleanId(id) {
    if(!id.match(/^scene[0-9]*$/)) return;

    var sceneNum = id.substr(5);
    if(sceneNum === '1') sceneNum = '';

    return 'scene' + sceneNum;
};

exports.setConvert = require('./set_convert');

function initAxes(gd, sceneLayout) {
    for(var j = 0; j < 3; ++j) {
        var axisName = axesNames[j];

        sceneLayout[axisName]._gd = gd;
    }
}
