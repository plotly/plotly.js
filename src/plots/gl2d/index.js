/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

var Scene2D = require('./scene2d');

var Plots = Plotly.Plots;


exports.name = 'gl2d';

exports.attr = ['xaxis', 'yaxis'];

exports.idRoot = ['x', 'y'];

exports.idRegex = {
    x: /^x([2-9]|[1-9][0-9]+)?$/,
    y: /^y([2-9]|[1-9][0-9]+)?$/
};

exports.attrRegex = {
    x: /^xaxis([2-9]|[1-9][0-9]+)?$/,
    y: /^yaxis([2-9]|[1-9][0-9]+)?$/
};

exports.attributes = require('../cartesian/attributes');

exports.plot = function plotGl2d(gd) {
    var fullLayout = gd._fullLayout,
        fullData = gd._fullData,
        subplotIds = Plots.getSubplotIds(fullLayout, 'gl2d');

    for(var i = 0; i < subplotIds.length; i++) {
        var subplotId = subplotIds[i],
            subplotObj = fullLayout._plots[subplotId],
            fullSubplotData = Plots.getSubplotData(fullData, 'gl2d', subplotId);

        // ref. to corresp. Scene instance
        var scene = subplotObj._scene2d;

        // If Scene is not instantiated, create one!
        if(scene === undefined) {
            scene = new Scene2D({
                container: gd.querySelector('.gl-container'),
                id: subplotId,
                staticPlot: gd._context.staticPlot,
                plotGlPixelRatio: gd._context.plotGlPixelRatio
            },
                fullLayout
            );

            // set ref to Scene instance
            subplotObj._scene2d = scene;
        }

        scene.plot(fullSubplotData, gd.calcdata, fullLayout, gd.layout);
    }
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var oldSceneKeys = Plots.getSubplotIds(oldFullLayout, 'gl2d');

    for(var i = 0; i < oldSceneKeys.length; i++) {
        var oldSubplot = oldFullLayout._plots[oldSceneKeys[i]],
            xaName = oldSubplot.xaxis._name,
            yaName = oldSubplot.yaxis._name;

        if(!!oldSubplot._scene2d && (!newFullLayout[xaName] || !newFullLayout[yaName])) {
            oldSubplot._scene2d.destroy();
        }
    }
};
