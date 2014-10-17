module.exports = Gl3dAxes;


function Gl3dAxes (config) {

    this.config = config;
    this.axesNames = ['xaxis', 'yaxis', 'zaxis'];
}


var proto = Gl3dAxes.prototype;

proto.attributes = {
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
            dlft: true
        },
        gridcolor: {from: 'Axes'},
        title: {from: 'Axes'},
        titlefont: {from: 'Axes'},
        type: {from: 'Axes'},
        autorange: {from: 'Axes'},
        rangemode: {from: 'Axes'},
        range: {from: 'Axes'},
        // ticks
        autotick: {from: 'Axes'},
        nticks: {from: 'Axes'},
        tick0: {from: 'Axes'},
        dtick: {from: 'Axes'},
        ticks: {from: 'Axes'},
        mirror: {from: 'Axes'},
        ticklen: {from: 'Axes'},
        tickwidth: {from: 'Axes'},
        tickcolor: {from: 'Axes'},
        showticklabels: {from: 'Axes'},
        tickfont: {from: 'Axes'},
        tickangle: {from: 'Axes'},
        // lines and grids
        showline: {from: 'Axes'},
        linecolor: {from: 'Axes'},
        linewidth: {from: 'Axes'},
        showgrid: {from: 'Axes'},
        gridcolor: {from: 'Axes'},
        gridwidth: {from: 'Axes'}
    };

proto.supplyDefaults = function(layoutIn, layoutOut, options) {
    var _this = this;
    var Plotly = this.config.Plotly;
    var Axes = Plotly.Axes;

    var containerIn, containerOut;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(containerIn, containerOut,
                                 _this.attributes, attr, dflt);
    }

    for (var j = 0; j < this.axesNames.length; j++) {
        var axName = this.axesNames[j];
        containerIn = layoutIn[axName] || {};

        containerOut = {
            _id: axName[0] + options.scene,
            _name: axName
        };

        layoutOut[axName] = containerOut = Axes.supplyAxisDefaults(
            containerIn,
            containerOut, {
                letter: axName[0],
                data: options.data
            });

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

    var scenes = Object.keys(fullLayout).filter(function(k){
        return k.match(/^scene[0-9]*$/);
    });

    for (var i = 0; i < scenes.length; ++i) {
        var scene = scenes[i];
        var sceneLayout = fullLayout[scene];
        for (var j = 0; j < 3; ++j) {
            var axisName = this.axesNames[j];
            var ax = sceneLayout[axisName];
            ax._td = td;
        }
    }

};
