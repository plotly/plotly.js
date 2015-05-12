'use strict';

var Plotly = require('../../plotly');
var Gl3dAxes = {};
var axesAttrs = Plotly.Axes.layoutAttributes;
var extendFlat = Plotly.Lib.extendFlat;

module.exports = Gl3dAxes;

Gl3dAxes.axesNames = ['xaxis', 'yaxis', 'zaxis'];

Gl3dAxes.layoutAttributes = {
    showspikes: {
        type: 'boolean',
        dflt: true
    },
    spikesides: {
        type: 'boolean',
        dflt: true
    },
    spikethickness: {
        type: 'number',
        min: 0,
        dflt: 2
    },
    spikecolor: {
        type: 'color',
        dflt: 'rgb(0,0,0)'
    },
    showbackground: {
        type: 'boolean',
        dflt: false
    },
    backgroundcolor: {
        type: 'color',
        dflt: 'rgba(204, 204, 204, 0.5)'
    },
    showaxeslabels: {
        type: 'boolean',
        dflt: true
    },
    title: axesAttrs.title,
    titlefont: axesAttrs.titlefont,
    type: axesAttrs.type,
    autorange: axesAttrs.autorange,
    rangemode: axesAttrs.rangemode,
    range: axesAttrs.range,
    fixedrange: axesAttrs.fixedrange,
    // ticks
    autotick: axesAttrs.autotick,
    nticks: axesAttrs.nticks,
    tick0: axesAttrs.tick0,
    dtick: axesAttrs.dtick,
    ticks: axesAttrs.ticks,
    mirror: axesAttrs.mirror,
    ticklen: axesAttrs.ticklen,
    tickwidth: axesAttrs.tickwidth,
    tickcolor: axesAttrs.tickcolor,
    showticklabels: axesAttrs.showticklabels,
    tickfont: axesAttrs.tickfont,
    tickangle: axesAttrs.tickangle,
    tickprefix: axesAttrs.tickprefix,
    showtickprefix: axesAttrs.showtickprefix,
    ticksuffix: axesAttrs.ticksuffix,
    showticksuffix: axesAttrs.showticksuffix,
    showexponent: axesAttrs.showexponent,
    exponentformat: axesAttrs.exponentformat,
    tickformat: axesAttrs.tickformat,
    hoverformat: axesAttrs.hoverformat,
    // lines and grids
    showline: axesAttrs.showline,
    linecolor: axesAttrs.linecolor,
    linewidth: axesAttrs.linewidth,
    showgrid: axesAttrs.showgrid,
    gridcolor: extendFlat(axesAttrs.gridcolor,  // shouldn't this be on-par with 2D?
                          {dflt: 'rgb(204, 204, 204)'}),
    gridwidth: axesAttrs.gridwidth,
    zeroline: axesAttrs.zeroline,
    zerolinecolor: axesAttrs.zerolinecolor,
    zerolinewidth: axesAttrs.zerolinewidth
};

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
