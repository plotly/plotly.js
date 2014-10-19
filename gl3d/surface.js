'use strict';
var createSurface = require('gl-surface-plot'),
    tinycolor = require('tinycolor2'),
    ndarray = require('ndarray'),
    ops = require('ndarray-ops'),
    fill = require('ndarray-fill');

function Surface (config) {

    this.config = config;

}

module.exports = Surface;

function parseColorScale (colorscale) {
    return colorscale.map( function (elem) {
        var index = elem[0];
        var color = tinycolor(elem[1]);
        var rgb = color.toRgb();
        return {
            index: index,
            rgb: [rgb.r, rgb.g, rgb.b]
        };
    });
}



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


proto.supplyDefaults = function (traceIn, traceOut) {
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


proto.plot = function (scene, sceneLayout, data) {

    /*
     * Create a new surfac
     */

    var surface,
        i , j,
        colormap = parseColorScale(data.colorscale),
        zdata = data.z,
        x = data.x,
        y = data.y,
        xaxis = sceneLayout.xaxis,
        yaxis = sceneLayout.yaxis,
        zaxis = sceneLayout.zaxis,
        ticks = [[],[]],
        Nx = zdata[0].length,
        Ny = zdata.length,
        field = ndarray(new Float32Array(Nx*Ny), [Nx, Ny]),
        gl = scene.shell.gl;

    /*
     * Fill and transpose zdata.
     * Consistent with 'heatmap' and 'contour', plotly 'surface'
     * 'z' are such that sub-arrays correspond to y-coords
     * and that the sub-array entries correspond to a x-coords,
     * which is the transpose of 'gl-surface-plot'.
     */
    fill(field, function(row, col) {
        return Number(zdata[col][row]);
    });

    // Map zdata if log axis
    if (zaxis.type === 'log') {
        ops.divseq(ops.logeq(field), Math.LN10);
    }

    if (Array.isArray(x) && x.length) {
       // if x is set, use it to defined the ticks
        for (i=0; i<Nx; i++) {
            ticks[0][i] = xaxis.d2c(x[i]);
        }
    } else {
       // if not, make linear space
        for (i=0; i<Nx; i++) {
            if (xaxis.type === 'log') ticks[0][i] = xaxis.c2l(i);
            else ticks[0][i] = i;
        }
    }

    if (Array.isArray(y) && y.length) {
       // if y is set, use it to defined the ticks
        for (j=0; j<Ny; j++) {
            ticks[1][j] = yaxis.d2c(y[j]);
        }
    } else {
       // if not, make linear space
        for (j=0; j<Ny; j++) {
            if (yaxis.type === 'log') ticks[1][j] = yaxis.c2l(j);
            else ticks[1][j] = j;
        }
    }


    var params = {
        field: field,
        ticks: ticks,
        colormap: colormap
    };


    surface = scene.glDataMap[data.uid];

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
        params.pickId       = (scene.objectCount++) % 256;
        surface             =  createSurface(gl, field, params);
        surface.groupId     = (scene.objectCount-1) >>> 8;
        surface.plotlyType  = data.type;
    }

    // uids determine which data is tied to which gl-object
    surface.uid = data.uid;
    surface.visible = data.visible;
    scene.update(sceneLayout, surface);

};
