'use strict';
var createSurface = require('gl-surface-plot'),
    str2RgbaArray = require('./str2rgbarray'),
    tinycolor = require('tinycolor2'),
    ndarray = require('ndarray'),
    fill = require('ndarray-fill');

function Surface (config) {

    this.config = config;
    this.Plotly = config.Plotly;
}

module.exports = Surface;

function parseColorScale (colorscale, alpha) {
    if (alpha === undefined) alpha = 1;

    return colorscale.map( function (elem) {
        var index = elem[0];
        var color = tinycolor(elem[1]);
        var rgb = color.toRgb();
        return {
            index: index,
            rgb: [rgb.r, rgb.g, rgb.b, alpha]
        };
    });
}

var proto = Surface.prototype;


proto.contourAttributes =  {
    show: {
        type: 'boolean',
        dflt: true
    },
    project: {
        type: 'boolean',
        dflt: false
    },
    color: {
        type: 'color',
        dflt: '#000'
    },
    width: {
        type: 'number',
        min: 1,
        max: 16,
        dflt: 2
    },
    highlight: {
        type: 'boolean',
        dflt: true
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

proto.attributes = {
    x: {type: 'data_array'},
    y: {type: 'data_array'},
    z: {type: 'data_array'},
    colorscale: {from: 'Heatmap'},
    showscale: {from: 'Heatmap'},
    reversescale: {from: 'Heatmap'},
    contour: {
        x: proto.contourAttributes,
        y: proto.contourAttributes,
        z: proto.contourAttributes
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
    }
};

proto.supplyDefaults = function (traceIn, traceOut, defaultColor, layout) {
    var i, _this = this;
    var Plotly = this.config.Plotly;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, _this.attributes, attr, dflt);
    }

    function coerceHeatmap(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, Plotly.Heatmap.attributes, attr, dflt);
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

    coerceHeatmap('colorscale');

    var dims = ['x','y','z'];
    for (i = 0; i < 3; ++i) {

        var contourDim = 'contour.' + dims[i];
        var show = coerce(contourDim + '.show');
        var highlight = coerce(contourDim + '.highlight');

        if (show || highlight ) coerce(contourDim + '.project');

        if (show) {
            coerce(contourDim + '.color');
            coerce(contourDim + '.width');
        }

        if (highlight) {
            coerce(contourDim + '.highlightColor');
            coerce(contourDim + '.highlightWidth');
        }
    }

    var reverseScale = coerceHeatmap('reversescale'),
        showScale = coerceHeatmap('showscale');

    // apply the colorscale reversal here, so we don't have to
    // do it in separate modules later
    if(reverseScale) {
        traceOut.colorscale = traceOut.colorscale.map(this.flipScale).reverse();
    }

    if(showScale) {
        Plotly.Colorbar.supplyDefaults(traceIn, traceOut, defaultColor, layout);
    }

};

proto.flipScale = function (si) {
    return [1 - si[0], si[1]];
};

proto.update = function update (scene, sceneLayout, data, surface) {

    var i,
        alpha = data.opacity,
        colormap = parseColorScale(data.colorscale, alpha),
        z = data.z,
        x = data.x,
        y = data.y,
        xaxis = sceneLayout.xaxis,
        yaxis = sceneLayout.yaxis,
        zaxis = sceneLayout.zaxis,
        ticks = [[],[]],
        xlen = z[0].length,
        ylen = z.length,
        field = ndarray(new Float32Array(xlen * ylen), [xlen, ylen]),
        coords = [
            ndarray(new Float32Array(xlen * ylen), [xlen, ylen]),
            ndarray(new Float32Array(xlen * ylen), [xlen, ylen])
        ],
        xc = coords[0],
        yc = coords[1],
        hasCoords = false,
        gl = scene.shell.gl,
        contourLevels = scene.contourLevels;

    /*
     * Fill and transpose zdata.
     * Consistent with 'heatmap' and 'contour', plotly 'surface'
     * 'z' are such that sub-arrays correspond to y-coords
     * and that the sub-array entries correspond to a x-coords,
     * which is the transpose of 'gl-surface-plot'.
     */
    fill(field, function(row, col) {
        return zaxis.d2l(z[col][row]);
    });

    // coords x
    if (Array.isArray(x[0])) {
        fill(xc, function(row, col) {
            return zaxis.d2l(x[col][row]);
        });

        hasCoords = true;

    } else {
        // ticks x
        for (i = 0; i < xlen; i++) {
            ticks[0][i] = xaxis.d2l(x[i]);
        }
    }

    // coords y
    if (Array.isArray(y[0])) {
        fill(yc, function(row, col) {
            return zaxis.d2l(y[col][row]);
        });

        hasCoords = true;

    } else {
        // ticks y
        for (i = 0; i < ylen; i++) {
            ticks[1][i] = yaxis.d2l(y[i]);
        }
    }

    var params = {
        field:          field,
        colormap:       colormap,
        levels:         [[],[],[]],
        showContour:    []
    };

    var highlightEnable            = [];
    var contourEnable              = [];
    var axis                       = [ 'x', 'y', 'z' ];

    for(i = 0; i < 3; ++i) {
        var contourParams          = data.contour[axis[i]];
        highlightEnable[i]         = contourParams.highlight;
        contourEnable[i]           = contourParams.show;

        params.showContour[i]      = contourParams.show || contourParams.highlight;
        if (!params.showContour[i])  continue;

        if (!params.contourProject)  params.contourProject = [];
        params.contourProject[i]   = contourParams.project;
        params.levels[i]           = contourLevels[i];

        if (contourParams.show) {
            if (!params.contourColor) {
                params.contourColor = [];
                params.contourWidth = [];
            }
            params.contourColor[i] = contourParams.color;
            params.contourWidth[i] = contourParams.width;
        }

        if (contourParams.highlight) {
            if (!params.dynamicColor) {
                params.dynamicColor = [];
                params.dynamicWidth = [];
            }
            params.dynamicColor[i] = contourParams.highlightColor;
            params.dynamicWidth[i] = contourParams.highlightWidth;
        }
    }

    if (hasCoords) {
        params.coords = coords;
    } else {
        params.ticks = ticks;
    }

    if (surface) {
        /*
         * We already have drawn this surface,
         * lets just update it with the latest params
         */
        surface.update(params);
    } else {
        /*
         * Push it onto the render queue
         */

        var pickIds         = scene.allocIds(1);

        params.pickId       = pickIds.ids[0];
        surface             = createSurface(gl, field, params);
        surface.groupId     = pickIds.group;
        surface.plotlyType  = data.type;
        // uids determine which data is tied to which gl-object
        surface.uid = data.uid;
        scene.glDataMap[surface.uid] = surface;

    }

    surface.highlightEnable  = highlightEnable;
    surface.contourEnable    = contourEnable;
    surface.visible          = data.visible;

    if ('lighting' in data) {
        surface.ambientLight   = data.lighting.ambient;
        surface.diffuseLight   = data.lighting.diffuse;
        surface.specularLight  = data.lighting.specular;
        surface.roughness      = data.lighting.roughness;
        surface.fresnel        = data.lighting.fresnel;
    }

    if (alpha && alpha < 1) surface.supportsTransparency = true;

    return surface;

};

proto.colorbar = function(gd, cd) {
    this.Plotly.Heatmap.colorbar(gd, cd);
};
