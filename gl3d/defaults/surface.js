'use strict';
var str2RgbaArray = require('../lib/str2rgbarray'),
    tinycolor = require('tinycolor2');

function Surface (config) {

    this.config = config;

    var Plotly = config.Plotly,
        heatmapAttrs = Plotly.Heatmap.attributes,
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

    this.attributes = {
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

}

module.exports = Surface;

var proto = Surface.prototype;

proto.supplyDefaults = function (traceIn, traceOut, defaultColor, layout) {
    var i, j, _this = this;
    var Plotly = this.config.Plotly;

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

    coerce('colorscale');

    var dims = ['x','y','z'];
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
        contourLevels = [[],[],[]]; //TODO: figure out where this is initialized/computed

    /*
     * Fill and transpose zdata.
     * Consistent with 'heatmap' and 'contour', plotly 'surface'
     * 'z' are such that sub-arrays correspond to y-coords
     * and that the sub-array entries correspond to a x-coords,
     * which is the transpose of 'gl-surface-plot'.
     */
    fill(coords[2], function(row, col) {
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
        colormap:       colormap,
        levels:         [[],[],[]],
        showContour:    [ true, true, true ],
        contourProject: [ [ false, false, false ],
                          [ false, false, false ],
                          [ false, false, false ] ],
        contourWidth:   [ 1, 1, 1 ],
        contourColor:   [ [1,1,1,1], [1,1,1,1], [1,1,1,1] ],
        contourTint:    [ 1, 1, 1 ],
        dynamicColor:   [ [1,1,1,1], [1,1,1,1], [1,1,1,1] ],
        dynamicWidth:   [ 1, 1, 1 ],
        dynamicTint:    [ 1, 1, 1 ]
    };

    var highlightEnable            = [ true, true, true ];
    var contourEnable              = [ true, true, true ];
    var axis                       = [ 'x', 'y', 'z' ];

    for(i = 0; i < 3; ++i) {
        var contourParams          = data.contours[axis[i]];
        highlightEnable[i]         = contourParams.highlight;
        contourEnable[i]           = contourParams.show;

        params.showContour[i]      = contourParams.show || contourParams.highlight;
        if (!params.showContour[i]) {
            continue;
        }

        params.contourProject[i]   = [
            contourParams.project.x,
            contourParams.project.y,
            contourParams.project.z ];

        if (contourParams.show) {
            params.levels[i]       = contourLevels[i];
            params.contourColor[i] = contourParams.color;
            params.contourWidth[i] = contourParams.width;
        }

        if (contourParams.highlight) {
            params.dynamicColor[i] = str2RgbaArray(contourParams.highlightColor);
            params.dynamicWidth[i] = contourParams.highlightWidth;
        }
    }

    if (hasCoords) {
        params.coords = coords;
    } else {
        params.ticks = ticks;
        params.field = coords[2]
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
}
