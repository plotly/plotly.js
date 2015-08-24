'use strict';

var extend = require('extend');
var Plotly = require('../plotly');

// Put default plotTile layouts here
function cloneLayoutOverride (tileClass) {
    var override;

    switch (tileClass) {
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
    if (graphObj.framework && graphObj.framework.isPolar) {
        graphObj = graphObj.framework.getConfig();
    }

    var i;
    var oldData = graphObj.data;
    var oldLayout = graphObj.layout;
    var newData =  extend(true, [], oldData);
    var newLayout = extend(true, {}, oldLayout, cloneLayoutOverride(options.tileClass));

    if (options.width) newLayout.width = options.width;
    if (options.height) newLayout.height = options.height;

    if (options.tileClass === 'thumbnail' || options.tileClass === 'themes__thumb') {
        // kill annotations
        newLayout.annotations = [];
        var keys = Object.keys(newLayout);

        for (i = 0; i < keys.length; i++) {
            if (keyIsAxis(keys[i])) {
                newLayout[keys[i]].title = '';
            }
        }

        // kill colorbar and pie labels
        for (i = 0; i < newData.length; i++) {
            var trace = newData[i];
            trace.showscale = false;
            if(trace.marker) trace.marker.showscale = false;
            if(trace.type === 'pie') trace.textposition = 'none';
        }
    }

    if (Array.isArray(options.annotations)) {
        for (i = 0; i < options.annotations.length; i++) {
            newLayout.annotations.push(options.annotations[i]);
        }
    }

    var sceneIds = Plotly.Plots.getSubplotIds(newLayout, 'gl3d');

    if (sceneIds.length) {
        var axesImageOverride = {};
        if (options.tileClass === 'thumbnail') {
            axesImageOverride = {
                title: '',
                showaxeslabels: false,
                showticklabels: false,
                linetickenable: false
            };
        }
        // presumes webgl plots won't have 2D plots.
        for (i = 0; i < sceneIds.length; i++) {
            var sceneId = sceneIds[i];
            newLayout[sceneId].xaxis = extend(newLayout[sceneId].xaxis, axesImageOverride);
            newLayout[sceneId].yaxis = extend(newLayout[sceneId].yaxis, axesImageOverride);
            newLayout[sceneId].zaxis = extend(newLayout[sceneId].zaxis, axesImageOverride);
            newLayout[sceneId]._scene = null;
        }

        newLayout.glopts = {preserveDrawingBuffer: true};
    }

    var td = document.createElement('div');
    if (options.tileClass) td.className = options.tileClass;

    var plotTile = {
        td: td,
        layout: newLayout,
        data: newData,
        config: {
            staticPlot: options.staticPlot === undefined ? true : options.staticPlot,
            plot3dPixelRatio: options.plot3dPixelRatio === undefined ? 2 : options.plot3dPixelRatio,
            displaylogo: options.displaylogo || false,
            showLink: options.showLink || false,
            showTips: options.showTips || false
        }
    };

    if (options.setBackground !== 'transparent') {
        plotTile.config.setBackground = options.setBackground || 'opaque';
    }

    // attaching the default Layout the the td, so you can grab it later
    plotTile.td.defaultLayout = cloneLayoutOverride(options.tileClass);

    return plotTile;
};
