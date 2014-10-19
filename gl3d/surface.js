'use strict';

function Surface (config) {

    this.config = config;

}

module.exports = Surface;

var proto = Surface.prototype;

proto.attributes = {
    x: {type: 'data_array'},
    y: {type: 'data_array'},
    z: {type: 'data_array'},
    scene: {
        type: 'sceneid',
        dflt: 'scene'
    },
    colorscale: {
        type: 'colorscale'
    }
};



proto.supplyDefaults = function (traceIn, traceOut, defaultColor, layout) {
    var _this = this;
    var Plotly = this.config.Plotly;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, _this.attributes, attr, dflt);
    }


    var z = coerce('z');
    if(!z) {
        traceOut.visible = false;
        return;
    }
    coerce('x');
    coerce('y');

    coerce('colorscale');
    coerce('scene');
};
