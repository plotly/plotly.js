/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Scene2D = require('./scene2d');
var Plots = require('../plots');
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');
var constants = require('../cartesian/constants');
var Cartesian = require('../cartesian')

exports.name = 'gl2d';

exports.attr = ['xaxis', 'yaxis'];

exports.idRoot = ['x', 'y'];

exports.idRegex = constants.idRegex;

exports.attrRegex = constants.attrRegex;

var axisIds = require('../cartesian/axis_ids');
var Lib = require('../../lib');
var d3 = require('d3');

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
                id: subplotId,
                graphDiv: gd,
                container: gd.querySelector('.gl-container'),
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
        var id = oldSceneKeys[i],
            oldSubplot = oldFullLayout._plots[id];

        // old subplot wasn't gl2d; nothing to do
        if(!oldSubplot._scene2d) continue;

        // if no traces are present, delete gl2d subplot
        var subplotData = Plots.getSubplotData(newFullData, 'gl2d', id);
        if(subplotData.length === 0) {
            oldSubplot._scene2d.destroy();
            delete oldFullLayout._plots[id];
        }
    }

    //since we use cartesian interactions, do cartesian clean
    Cartesian.clean.apply(this, arguments)
};

exports.drawFramework = Cartesian.drawFramework

exports.toSVG = function(gd) {
    var fullLayout = gd._fullLayout,
        subplotIds = Plots.getSubplotIds(fullLayout, 'gl2d');

    for(var i = 0; i < subplotIds.length; i++) {
        var subplot = fullLayout._plots[subplotIds[i]],
            scene = subplot._scene2d;

        var imageData = scene.toImage('png');
        var image = fullLayout._glimages.append('svg:image');

        image.attr({
            xmlns: xmlnsNamespaces.svg,
            'xlink:href': imageData,
            x: 0,
            y: 0,
            width: '100%',
            height: '100%',
            preserveAspectRatio: 'none'
        });

        scene.destroy();
    }
};


function makeSubplotData(gd) {
    var fullLayout = gd._fullLayout,
        subplots = Object.keys(fullLayout._plots);

    var subplotData = [],
        overlays = [];

    for(var i = 0; i < subplots.length; i++) {
        var subplot = subplots[i],
            plotinfo = fullLayout._plots[subplot];

        var xa = plotinfo.xaxis,
            ya = plotinfo.yaxis;

        // is this subplot overlaid on another?
        // ax.overlaying is the id of another axis of the same
        // dimension that this one overlays to be an overlaid subplot,
        // the main plot must exist make sure we're not trying to
        // overlay on an axis that's already overlaying another
        var xa2 = axisIds.getFromId(gd, xa.overlaying) || xa;
        if(xa2 !== xa && xa2.overlaying) {
            xa2 = xa;
            xa.overlaying = false;
        }

        var ya2 = axisIds.getFromId(gd, ya.overlaying) || ya;
        if(ya2 !== ya && ya2.overlaying) {
            ya2 = ya;
            ya.overlaying = false;
        }

        var mainplot = xa2._id + ya2._id;
        if(mainplot !== subplot && subplots.indexOf(mainplot) !== -1) {
            plotinfo.mainplot = mainplot;
            plotinfo.mainplotinfo = fullLayout._plots[mainplot];
            overlays.push(subplot);

            // for now force overlays to overlay completely... so they
            // can drag together correctly and share backgrounds.
            // Later perhaps we make separate axis domain and
            // tick/line domain or something, so they can still share
            // the (possibly larger) dragger and background but don't
            // have to both be drawn over that whole domain
            xa.domain = xa2.domain.slice();
            ya.domain = ya2.domain.slice();
        }
        else {
            subplotData.push(subplot);
        }
    }

    // main subplots before overlays
    subplotData = subplotData.concat(overlays);

    return subplotData;
}
