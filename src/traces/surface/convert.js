/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createSurface = require('gl-surface3d');
var ndarray = require('ndarray');
var homography = require('ndarray-homography');
var fill = require('ndarray-fill');
var ops = require('ndarray-ops');
var tinycolor = require('tinycolor2');

var str2RgbaArray = require('../../lib/str2rgbarray');

var MIN_RESOLUTION = 128;

function SurfaceTrace(scene, surface, uid) {
    this.scene = scene;
    this.uid = uid;
    this.surface = surface;
    this.data = null;
    this.showContour = [false, false, false];
    this.dataScale = 1.0;
}

var proto = SurfaceTrace.prototype;

proto.handlePick = function(selection) {
    if(selection.object === this.surface) {
        var selectIndex = [
            Math.min(
                Math.round(selection.data.index[0] / this.dataScale - 1)|0,
                this.data.z[0].length - 1
            ),
            Math.min(
                Math.round(selection.data.index[1] / this.dataScale - 1)|0,
                this.data.z.length - 1
            )
        ];
        var traceCoordinate = [0, 0, 0];

        if(Array.isArray(this.data.x[0])) {
            traceCoordinate[0] = this.data.x[selectIndex[1]][selectIndex[0]];
        } else {
            traceCoordinate[0] = this.data.x[selectIndex[0]];
        }
        if(Array.isArray(this.data.y[0])) {
            traceCoordinate[1] = this.data.y[selectIndex[1]][selectIndex[0]];
        } else {
            traceCoordinate[1] = this.data.y[selectIndex[1]];
        }

        traceCoordinate[2] = this.data.z[selectIndex[1]][selectIndex[0]];
        selection.traceCoordinate = traceCoordinate;

        var sceneLayout = this.scene.fullSceneLayout;
        selection.dataCoordinate = [
            sceneLayout.xaxis.d2l(traceCoordinate[0], 0, this.data.xcalendar) * this.scene.dataScale[0],
            sceneLayout.yaxis.d2l(traceCoordinate[1], 0, this.data.ycalendar) * this.scene.dataScale[1],
            sceneLayout.zaxis.d2l(traceCoordinate[2], 0, this.data.zcalendar) * this.scene.dataScale[2]
        ];

        var text = this.data.text;
        if(text && text[selectIndex[1]] && text[selectIndex[1]][selectIndex[0]] !== undefined) {
            selection.textLabel = text[selectIndex[1]][selectIndex[0]];
        }
        else selection.textLabel = '';

        selection.data.dataCoordinate = selection.dataCoordinate.slice();

        this.surface.highlight(selection.data);

        // Snap spikes to data coordinate
        this.scene.glplot.spikes.position = selection.dataCoordinate;

        return true;
    }
};

function parseColorScale(colorscale, alpha) {
    if(alpha === undefined) alpha = 1;

    return colorscale.map(function(elem) {
        var index = elem[0];
        var color = tinycolor(elem[1]);
        var rgb = color.toRgb();
        return {
            index: index,
            rgb: [rgb.r, rgb.g, rgb.b, alpha]
        };
    });
}

function isColormapCircular(colormap) {
    var first = colormap[0].rgb,
        last = colormap[colormap.length - 1].rgb;

    return (
        first[0] === last[0] &&
        first[1] === last[1] &&
        first[2] === last[2] &&
        first[3] === last[3]
    );
}

// Pad coords by +1
function padField(field) {
    var shape = field.shape;
    var nshape = [shape[0] + 2, shape[1] + 2];
    var nfield = ndarray(new Float32Array(nshape[0] * nshape[1]), nshape);

    // Center
    ops.assign(nfield.lo(1, 1).hi(shape[0], shape[1]), field);

    // Edges
    ops.assign(nfield.lo(1).hi(shape[0], 1),
                field.hi(shape[0], 1));
    ops.assign(nfield.lo(1, nshape[1] - 1).hi(shape[0], 1),
                field.lo(0, shape[1] - 1).hi(shape[0], 1));
    ops.assign(nfield.lo(0, 1).hi(1, shape[1]),
                field.hi(1));
    ops.assign(nfield.lo(nshape[0] - 1, 1).hi(1, shape[1]),
                field.lo(shape[0] - 1));

    // Corners
    nfield.set(0, 0, field.get(0, 0));
    nfield.set(0, nshape[1] - 1, field.get(0, shape[1] - 1));
    nfield.set(nshape[0] - 1, 0, field.get(shape[0] - 1, 0));
    nfield.set(nshape[0] - 1, nshape[1] - 1, field.get(shape[0] - 1, shape[1] - 1));

    return nfield;
}

function refine(coords) {
    var minScale = Math.max(coords[0].shape[0], coords[0].shape[1]);

    if(minScale < MIN_RESOLUTION) {
        var scaleF = MIN_RESOLUTION / minScale;
        var nshape = [
            Math.floor((coords[0].shape[0]) * scaleF + 1)|0,
            Math.floor((coords[0].shape[1]) * scaleF + 1)|0 ];
        var nsize = nshape[0] * nshape[1];

        for(var i = 0; i < coords.length; ++i) {
            var padImg = padField(coords[i]);
            var scaledImg = ndarray(new Float32Array(nsize), nshape);
            homography(scaledImg, padImg, [scaleF, 0, 0,
                0, scaleF, 0,
                0, 0, 1]);
            coords[i] = scaledImg;
        }

        return scaleF;
    }

    return 1.0;
}

proto.setContourLevels = function() {
    var nlevels = [[], [], []];
    var needsUpdate = false;

    for(var i = 0; i < 3; ++i) {
        if(this.showContour[i]) {
            needsUpdate = true;
            nlevels[i] = this.scene.contourLevels[i];
        }
    }

    if(needsUpdate) {
        this.surface.update({ levels: nlevels });
    }
};

proto.update = function(data) {
    var i,
        scene = this.scene,
        sceneLayout = scene.fullSceneLayout,
        surface = this.surface,
        alpha = data.opacity,
        colormap = parseColorScale(data.colorscale, alpha),
        z = data.z,
        x = data.x,
        y = data.y,
        xaxis = sceneLayout.xaxis,
        yaxis = sceneLayout.yaxis,
        zaxis = sceneLayout.zaxis,
        scaleFactor = scene.dataScale,
        xlen = z[0].length,
        ylen = z.length,
        coords = [
            ndarray(new Float32Array(xlen * ylen), [xlen, ylen]),
            ndarray(new Float32Array(xlen * ylen), [xlen, ylen]),
            ndarray(new Float32Array(xlen * ylen), [xlen, ylen])
        ],
        xc = coords[0],
        yc = coords[1],
        contourLevels = scene.contourLevels;

    // Save data
    this.data = data;

    /*
     * Fill and transpose zdata.
     * Consistent with 'heatmap' and 'contour', plotly 'surface'
     * 'z' are such that sub-arrays correspond to y-coords
     * and that the sub-array entries correspond to a x-coords,
     * which is the transpose of 'gl-surface-plot'.
     */

    var xcalendar = data.xcalendar,
        ycalendar = data.ycalendar,
        zcalendar = data.zcalendar;

    fill(coords[2], function(row, col) {
        return zaxis.d2l(z[col][row], 0, zcalendar) * scaleFactor[2];
    });

    // coords x
    if(Array.isArray(x[0])) {
        fill(xc, function(row, col) {
            return xaxis.d2l(x[col][row], 0, xcalendar) * scaleFactor[0];
        });
    } else {
        // ticks x
        fill(xc, function(row) {
            return xaxis.d2l(x[row], 0, xcalendar) * scaleFactor[0];
        });
    }

    // coords y
    if(Array.isArray(y[0])) {
        fill(yc, function(row, col) {
            return yaxis.d2l(y[col][row], 0, ycalendar) * scaleFactor[1];
        });
    } else {
        // ticks y
        fill(yc, function(row, col) {
            return yaxis.d2l(y[col], 0, ycalendar) * scaleFactor[1];
        });
    }

    var params = {
        colormap: colormap,
        levels: [[], [], []],
        showContour: [true, true, true],
        showSurface: !data.hidesurface,
        contourProject: [
            [false, false, false],
            [false, false, false],
            [false, false, false]
        ],
        contourWidth: [1, 1, 1],
        contourColor: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]],
        contourTint: [1, 1, 1],
        dynamicColor: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]],
        dynamicWidth: [1, 1, 1],
        dynamicTint: [1, 1, 1],
        opacity: data.opacity
    };

    params.intensityBounds = [data.cmin, data.cmax];

    // Refine if necessary
    if(data.surfacecolor) {
        var intensity = ndarray(new Float32Array(xlen * ylen), [xlen, ylen]);

        fill(intensity, function(row, col) {
            return data.surfacecolor[col][row];
        });

        coords.push(intensity);
    }
    else {
        // when 'z' is used as 'intensity',
        // we must scale its value
        params.intensityBounds[0] *= scaleFactor[2];
        params.intensityBounds[1] *= scaleFactor[2];
    }

    this.dataScale = refine(coords);

    if(data.surfacecolor) {
        params.intensity = coords.pop();
    }

    var highlightEnable = [true, true, true];
    var axis = ['x', 'y', 'z'];

    for(i = 0; i < 3; ++i) {
        var contourParams = data.contours[axis[i]];
        highlightEnable[i] = contourParams.highlight;

        params.showContour[i] = contourParams.show || contourParams.highlight;
        if(!params.showContour[i]) continue;

        params.contourProject[i] = [
            contourParams.project.x,
            contourParams.project.y,
            contourParams.project.z
        ];

        if(contourParams.show) {
            this.showContour[i] = true;
            params.levels[i] = contourLevels[i];
            surface.highlightColor[i] = params.contourColor[i] = str2RgbaArray(contourParams.color);

            if(contourParams.usecolormap) {
                surface.highlightTint[i] = params.contourTint[i] = 0;
            }
            else {
                surface.highlightTint[i] = params.contourTint[i] = 1;
            }
            params.contourWidth[i] = contourParams.width;
        } else {
            this.showContour[i] = false;
        }

        if(contourParams.highlight) {
            params.dynamicColor[i] = str2RgbaArray(contourParams.highlightcolor);
            params.dynamicWidth[i] = contourParams.highlightwidth;
        }
    }

    // see https://github.com/plotly/plotly.js/issues/940
    if(isColormapCircular(colormap)) {
        params.vertexColor = true;
    }

    params.coords = coords;

    surface.update(params);

    surface.visible = data.visible;
    surface.enableDynamic = highlightEnable;

    surface.snapToData = true;

    if('lighting' in data) {
        surface.ambientLight = data.lighting.ambient;
        surface.diffuseLight = data.lighting.diffuse;
        surface.specularLight = data.lighting.specular;
        surface.roughness = data.lighting.roughness;
        surface.fresnel = data.lighting.fresnel;
    }

    if('lightposition' in data) {
        surface.lightPosition = [data.lightposition.x, data.lightposition.y, data.lightposition.z];
    }

    if(alpha && alpha < 1) {
        surface.supportsTransparency = true;
    }
};

proto.dispose = function() {
    this.scene.glplot.remove(this.surface);
    this.surface.dispose();
};

function createSurfaceTrace(scene, data) {
    var gl = scene.glplot.gl;
    var surface = createSurface({ gl: gl });
    var result = new SurfaceTrace(scene, surface, data.uid);
    surface._trace = result;
    result.update(data);
    scene.glplot.add(surface);
    return result;
}

module.exports = createSurfaceTrace;
