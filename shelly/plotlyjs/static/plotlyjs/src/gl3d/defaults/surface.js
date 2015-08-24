'use strict';

var Plotly = require('../../plotly');

var Surface = module.exports = {};

Plotly.Plots.register(Surface, 'surface', ['gl3d', 'noOpacity']);

Surface.attributes = require('../attributes/surface');

Surface.supplyDefaults = function (traceIn, traceOut, defaultColor, layout) {
    var i, j, _this = this;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, _this.attributes, attr, dflt);
    }

    var z = coerce('z');
    if(!z) {
        traceOut.visible = false;
        return;
    }

    var xlen = z[0].length;
    var ylen = z.length;

    coerce('x');
    coerce('y');

    if (!Array.isArray(traceOut.x)) {
        // build a linearly scaled x
        traceOut.x = [];
        for (i = 0; i < xlen; ++i) {
            traceOut.x[i] = i;
        }
    }

    coerce('text');
    if (!Array.isArray(traceOut.y)) {
        traceOut.y = [];
        for (i = 0; i < ylen; ++i) {
            traceOut.y[i] = i;
        }
    }

    coerce('lighting.ambient');
    coerce('lighting.diffuse');
    coerce('lighting.specular');
    coerce('lighting.roughness');
    coerce('lighting.fresnel');
    coerce('hidesurface');
    coerce('opacity');

    coerce('colorscale');

    var dims = ['x', 'y', 'z'];
    for (i = 0; i < 3; ++i) {

        var contourDim = 'contours.' + dims[i];
        var show = coerce(contourDim + '.show');
        var highlight = coerce(contourDim + '.highlight');

        if (show || highlight ) {
            for (j = 0; j < 3; ++j) {
                coerce(contourDim + '.project.' + dims[j]);
            }
        }

        if (show) {
            coerce(contourDim + '.color');
            coerce(contourDim + '.width');
            coerce(contourDim + '.usecolormap');
        }

        if (highlight) {
            coerce(contourDim + '.highlightColor');
            coerce(contourDim + '.highlightWidth');
        }
    }

    Plotly.Colorscale.handleDefaults(
        traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'z'}
    );
};

Surface.colorbar = Plotly.Colorbar.traceColorbar;

Surface.calc = function(gd, trace) {

    // auto-z and autocolorscale if applicable
    Plotly.Colorscale.calc(trace, trace.z, '', 'z');

};
