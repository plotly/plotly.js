/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../lib');
var Plots = require('../plots/plots');

var extendFlat = Lib.extendFlat;
var extendDeep = Lib.extendDeep;

// Put default plotTile layouts here
function cloneLayoutOverride(tileClass) {
    var override;

    switch(tileClass) {
        case 'themes__thumb':
            override = {
                autosize: true,
                width: 150,
                height: 150,
                title: '',
                showlegend: false,
                margin: {l: 5, r: 5, t: 5, b: 5, pad: 0},
                annotations: []
            };
            break;

        case 'thumbnail':
            override = {
                title: '',
                hidesources: true,
                showlegend: false,
                borderwidth: 0,
                bordercolor: '',
                margin: {l: 1, r: 1, t: 1, b: 1, pad: 0},
                annotations: []
            };
            break;

        default:
            override = {};
    }


    return override;
}

function keyIsAxis(keyName) {
    var types = ['xaxis', 'yaxis', 'zaxis'];
    return (types.indexOf(keyName.slice(0, 5)) > -1);
}


module.exports = function clonePlot(graphObj, options) {

    // Polar plot compatibility
    if(graphObj.framework && graphObj.framework.isPolar) {
        graphObj = graphObj.framework.getConfig();
    }

    var i;
    var oldData = graphObj.data;
    var oldLayout = graphObj.layout;
    var newData = extendDeep([], oldData);
    var newLayout = extendDeep({}, oldLayout, cloneLayoutOverride(options.tileClass));

    if(options.width) newLayout.width = options.width;
    if(options.height) newLayout.height = options.height;

    if(options.tileClass === 'thumbnail' || options.tileClass === 'themes__thumb') {
        // kill annotations
        newLayout.annotations = [];
        var keys = Object.keys(newLayout);

        for(i = 0; i < keys.length; i++) {
            if(keyIsAxis(keys[i])) {
                newLayout[keys[i]].title = '';
            }
        }

        // kill colorbar and pie labels
        for(i = 0; i < newData.length; i++) {
            var trace = newData[i];
            trace.showscale = false;
            if(trace.marker) trace.marker.showscale = false;
            if(trace.type === 'pie') trace.textposition = 'none';
        }
    }

    if(Array.isArray(options.annotations)) {
        for(i = 0; i < options.annotations.length; i++) {
            newLayout.annotations.push(options.annotations[i]);
        }
    }

    var sceneIds = Plots.getSubplotIds(newLayout, 'gl3d');

    if(sceneIds.length) {
        var axesImageOverride = {};
        if(options.tileClass === 'thumbnail') {
            axesImageOverride = {
                title: '',
                showaxeslabels: false,
                showticklabels: false,
                linetickenable: false
            };
        }
        for(i = 0; i < sceneIds.length; i++) {
            var sceneId = sceneIds[i];

            extendFlat(newLayout[sceneId].xaxis, axesImageOverride);
            extendFlat(newLayout[sceneId].yaxis, axesImageOverride);
            extendFlat(newLayout[sceneId].zaxis, axesImageOverride);

            // TODO what does this do?
            newLayout[sceneId]._scene = null;
        }
    }

    var gd = document.createElement('div');
    if(options.tileClass) gd.className = options.tileClass;

    var plotTile = {
        gd: gd,
        td: gd, // for external (image server) compatibility
        layout: newLayout,
        data: newData,
        config: {
            staticPlot: (options.staticPlot === undefined) ?
                true :
                options.staticPlot,
            plotGlPixelRatio: (options.plotGlPixelRatio === undefined) ?
                2 :
                options.plotGlPixelRatio,
            displaylogo: options.displaylogo || false,
            showLink: options.showLink || false,
            showTips: options.showTips || false
        }
    };

    if(options.setBackground !== 'transparent') {
        plotTile.config.setBackground = options.setBackground || 'opaque';
    }

    // attaching the default Layout the gd, so you can grab it later
    plotTile.gd.defaultLayout = cloneLayoutOverride(options.tileClass);

    return plotTile;
};
