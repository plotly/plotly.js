'use strict'

var createSurface = require('gl-surface3d'),
    ndarray = require('ndarray'),
    homography = require('ndarray-homography'),
    fill = require('ndarray-fill');

var MIN_RESOLUTION = 128

module.exports = createSurfaceTrace

function SurfaceTrace(scene, surface, uid) {
  this.scene    = scene
  this.uid      = uid
  this.surface  = surface
}

var proto = SurfaceTrace.prototype

proto.handlePick = function(selection) {
}

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

function refine(coords) {
    var minScale = Math.min(coords[0].shape[0], coords[0].shape[1])
    if(minScale < MIN_RESOLUTION) {
        var scaleF = MIN_RESOLUTION / minScale
        var nshape = [ 
            Math.floor((coords[0].shape[0]-1)*scaleF+1)|0, 
            Math.floor((coords[0].shape[1]-1)*scaleF+1)|0 ]
        var nsize = nshape[0]*nshape[1]
        for(var i=0; i<3; ++i) {
            var scaledImg = ndarray(new Float32Array(nsize), nshape)
            homography(scaledImg, coords[i], [scaleF, 0, 0, 
                                              0, scaleF, 0,
                                              0, 0, 1])
            coords[i] = scaledImg
        }
    }
}

proto.update = function(data) {
    var i,
        scene = this.scene,
        sceneLayout = scene.sceneLayout,
        surface = this.surface,
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
        coords = [
            ndarray(new Float32Array(xlen * ylen), [xlen, ylen]),
            ndarray(new Float32Array(xlen * ylen), [xlen, ylen]),
            ndarray(new Float32Array(xlen * ylen), [xlen, ylen])
        ],
        xc = coords[0],
        yc = coords[1],
        gl = scene.gl,
        contourLevels = scene.contourLevels;

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
            return xaxis.d2l(x[col][row]);
        });
    } else {
        // ticks x
        fill(xc, function(row, col) {
            return xaxis.d2l(x[col]);
        });
    }

    // coords y
    if (Array.isArray(y[0])) {
        fill(yc, function(row, col) {
            return yaxis.d2l(y[col][row]);
        });
    } else {
        // ticks y
        fill(yc, function(row, col) {
            return yaxis.d2l(y[row]);
        });
    }

    //Refine if necessary
    refine(coords)

    console.log(coords[0].shape)

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

    params.coords = coords;
    surface.update(params);

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

    if (alpha && alpha < 1) {
        surface.supportsTransparency = true;
    }
}

proto.colorbar = function(gd, cd) {
    this.config.Plotly.Heatmap.colorbar(gd, cd)
}

proto.dispose = function() {
  this.scene.remove(this.surface)
  this.surface.dispose()
}

function createSurfaceTrace(scene, data) {
  var gl = scene.scene.gl
  var surface = createSurface({
    gl: gl
  })
  var result = new SurfaceTrace(scene, surface, data.uid)
  result.update(data)
  scene.scene.add(surface)
  return result
}