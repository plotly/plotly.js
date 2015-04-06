module.exports = Gl3dAxes;

function Gl3dAxes (config) {
    this.config = config;
    this.axesNames = ['xaxis', 'yaxis', 'zaxis'];

    var Plotly = config.Plotly,
        axesAttrs = Plotly.Axes.layoutAttributes,
        extendFlat = Plotly.Lib.extendFlat;

    this.layoutAttributes = {
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
}

var proto = Gl3dAxes.prototype;


proto.supplyLayoutDefaults = function(layoutIn, layoutOut, options) {

    var _this = this;
    var Plotly = this.config.Plotly;
    var Axes = Plotly.Axes;

    var containerIn, containerOut;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(containerIn, containerOut,
                                 _this.layoutAttributes, attr, dflt);
    }

    for (var j = 0; j < this.axesNames.length; j++) {
        var axName = this.axesNames[j];
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

        containerOut.setScale = function () {};

        if (coerce('showspikes')) {
            coerce('spikesides');
            coerce('spikethickness');
            coerce('spikecolor');
        }
        if (coerce('showbackground')) {
            coerce('backgroundcolor');
        }

        coerce('showaxeslabels');
    }

};


proto.initAxes = function (td) {
    var Plotly = this.config.Plotly;
    var fullLayout = td._fullLayout;

    // until they play better together
    delete fullLayout.xaxis;
    delete fullLayout.yaxis;

    var sceneKeys = Plotly.Lib.getSceneKeys(fullLayout);

    for (var i = 0; i < sceneKeys.length; ++i) {
        var sceneKey = sceneKeys[i];
        var sceneLayout = fullLayout[sceneKey];
        for (var j = 0; j < 3; ++j) {
            var axisName = this.axesNames[j];
            var ax = sceneLayout[axisName];
            ax._td = td;
        }
    }
};
