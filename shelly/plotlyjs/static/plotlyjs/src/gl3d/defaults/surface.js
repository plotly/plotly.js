'use strict';

var Plotly = require('../../plotly');

var Surface = {};

module.exports = Surface;

Plotly.Plots.register(Surface, 'surface', ['gl3d', 'noOpacity', 'nolegend']);

var  heatmapAttrs = Plotly.Heatmap.attributes,
    contourAttributes =  {
        show: {
            type: 'boolean',
            dflt: false
        },
        project: {
            x: {
                type: 'boolean',
                dflt: false
            },
            y: {
                type: 'boolean',
                dflt: false
            },
            z: {
                type: 'boolean',
                dflt: false
            }
        },
        color: {
            type: 'color',
            dflt: '#000'
        },
        usecolormap: {
            type: 'boolean',
            dflt: false
        },
        width: {
            type: 'number',
            min: 1,
            max: 16,
            dflt: 2
        },
        highlight: {
            type: 'boolean',
            dflt: false
        },
        highlightColor: {
            type: 'color',
            dflt: '#000'
        },
        highlightWidth: {
            type: 'number',
            min: 1,
            max: 16,
            dflt: 2
        }
    };


Surface.attributes = {
    x: {type: 'data_array'},
    y: {type: 'data_array'},
    z: {type: 'data_array'},
    colorscale: heatmapAttrs.colorscale,
    showscale: heatmapAttrs.showscale,
    reversescale: heatmapAttrs.reversescale,
    contours: {
        x: contourAttributes,
        y: contourAttributes,
        z: contourAttributes
    },
    hidesurface: {
      type: 'boolean',
      dflt: false
    },
    lighting: {
        ambient: {
            type: 'number',
            min: 0.00,
            max: 1.0,
            dflt: 0.8
        },
        diffuse: {
            type: 'number',
            min: 0.00,
            max: 1.00,
            dflt: 0.8
        },
        specular: {
            type: 'number',
            min: 0.00,
            max: 2.00,
            dflt: 0.05
        },
        roughness: {
            type: 'number',
            min: 0.00,
            max: 1.00,
            dflt: 0.5
        },
        fresnel: {
            type: 'number',
            min: 0.00,
            max: 5.00,
            dflt: 0.2
        }
    },
    _nestedModules: {  // nested module coupling
        'colorbar': 'Colorbar'
    }
};


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

    var reverseScale = coerce('reversescale'),
        showScale = coerce('showscale');

    // apply the colorscale reversal here, so we don't have to
    // do it in separate modules later
    if(reverseScale) {
        traceOut.colorscale = traceOut.colorscale.map(this.flipScale).reverse();
    }

    if(showScale) {
        Plotly.Colorbar.supplyDefaults(traceIn, traceOut, defaultColor, layout);
    }


};

Surface.flipScale = function (si) {
    return [1 - si[0], si[1]];
};

Surface.colorbar = function(gd, cd) {
    Plotly.Heatmap.colorbar(gd, cd);
};
