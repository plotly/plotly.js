'use strict';

var Plotly = require('../../plotly');

var Gl3dAxes = module.exports = {};

Gl3dAxes.axesNames = ['xaxis', 'yaxis', 'zaxis'];

Gl3dAxes.layoutAttributes = require('../attributes/gl3daxes');

var noop = function () {};

Gl3dAxes.supplyLayoutDefaults = function(layoutIn, layoutOut, options) {

    var Axes = Plotly.Axes;
    var containerIn, containerOut;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(containerIn, containerOut,
                                 Gl3dAxes.layoutAttributes, attr, dflt);
    }

    for (var j = 0; j < Gl3dAxes.axesNames.length; j++) {
        var axName = Gl3dAxes.axesNames[j];
        containerIn = layoutIn[axName] || {};

        containerOut = {
            _id: axName[0] + options.scene,
            _name: axName
        };

        layoutOut[axName] = containerOut = Axes.handleAxisDefaults(
            containerIn,
            containerOut,
            coerce,
            {
                font: options.font,
                letter: axName[0],
                data: options.data,
                showGrid: true
            });

        coerce('gridcolor');
        coerce('title', axName[0]);  // shouldn't this be on-par with 2D?

        containerOut.setScale = noop;

        if (coerce('showspikes')) {
            coerce('spikesides');
            coerce('spikethickness');
            coerce('spikecolor');
        }
        if (coerce('showbackground')) coerce('backgroundcolor');

        coerce('showaxeslabels');
    }
};

Gl3dAxes.setConvert = function (containerOut) {
    Plotly.Axes.setConvert(containerOut);
    containerOut.setScale = noop;
};

Gl3dAxes.initAxes = function (td) {
    var fullLayout = td._fullLayout;

    // until they play better together
    delete fullLayout.xaxis;
    delete fullLayout.yaxis;

    var sceneIds = Plotly.Plots.getSubplotIds(fullLayout, 'gl3d');

    for (var i = 0; i < sceneIds.length; ++i) {
        var sceneId = sceneIds[i];
        var sceneLayout = fullLayout[sceneId];
        for (var j = 0; j < 3; ++j) {
            var axisName = Gl3dAxes.axesNames[j];
            var ax = sceneLayout[axisName];
            ax._td = td;
        }
    }
};
