/**
* Copyright 2012-2018, Plotly, Inc.
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

var isArrayOrTypedArray = require('../../lib').isArrayOrTypedArray;
var parseColorScale = require('../../lib/gl_format_color').parseColorScale;
var str2RgbaArray = require('../../lib/str2rgbarray');

function SurfaceTrace(scene, surface, uid) {
    this.scene = scene;
    this.uid = uid;
    this.surface = surface;
    this.data = null;
    this.showContour = [false, false, false];
    this.dataScale = 1.0; // Note we could have two different scales for width & height
}

var proto = SurfaceTrace.prototype;

proto.getXat = function(a, b) {
    return (!isArrayOrTypedArray(this.data.x)) ?
                a :
           (isArrayOrTypedArray(this.data.x[0])) ?
                this.data.x[b][a] :
                this.data.x[a];
};

proto.getYat = function(a, b) {
    return (!isArrayOrTypedArray(this.data.y)) ?
                b :
           (isArrayOrTypedArray(this.data.y[0])) ?
                this.data.y[b][a] :
                this.data.y[b];
};

proto.handlePick = function(selection) {
    if(selection.object === this.surface) {
        var selectIndex = selection.index = [
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

        traceCoordinate[0] = this.getXat(selectIndex[0], selectIndex[1]);
        traceCoordinate[1] = this.getYat(selectIndex[0], selectIndex[1]);

        traceCoordinate[2] = this.data.z[selectIndex[1]][selectIndex[0]];
        selection.traceCoordinate = traceCoordinate;

        var sceneLayout = this.scene.fullSceneLayout;
        selection.dataCoordinate = [
            sceneLayout.xaxis.d2l(traceCoordinate[0], 0, this.data.xcalendar) * this.scene.dataScale[0],
            sceneLayout.yaxis.d2l(traceCoordinate[1], 0, this.data.ycalendar) * this.scene.dataScale[1],
            sceneLayout.zaxis.d2l(traceCoordinate[2], 0, this.data.zcalendar) * this.scene.dataScale[2]
        ];

        var text = this.data.text;
        if(Array.isArray(text) && text[selectIndex[1]] && text[selectIndex[1]][selectIndex[0]] !== undefined) {
            selection.textLabel = text[selectIndex[1]][selectIndex[0]];
        } else if(text) {
            selection.textLabel = text;
        } else {
            selection.textLabel = '';
        }

        selection.data.dataCoordinate = selection.dataCoordinate.slice();

        this.surface.highlight(selection.data);

        // Snap spikes to data coordinate
        this.scene.glplot.spikes.position = selection.dataCoordinate;

        return true;
    }
};

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

var highlyComposites = [1, 2, 4, 6, 12, 24, 36, 48, 60, 120, 180, 240, 360, 720, 840, 1260];

var MIN_RESOLUTION = 140; //35; //highlyComposites[9];

var shortPrimes = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
    101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199,
    211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293,
    307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397,
    401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499,
    503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599,
    601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691,
    701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797,
    809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887,
    907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
];

function getPow(a, b) {
    var n = 0;
    while(Math.floor(a % b) === 0) {
        a /= b;
        n++;
    }
    return n;
}

function getFactors(a) {
    var powers = [];
    for(var i = 0; i < shortPrimes.length; i++) {
        var b = shortPrimes[i];
        powers.push(
            Math.pow(b, getPow(a, b))
        );
    }

    return powers;
}

proto.calcXstep = function(xlen) {
    var maxDist = this.getXat(0, 0) - this.getXat(xlen - 1, 0)
    var minDist = Infinity;
    for(var i = 1; i < xlen; i++) {
        var dist = this.getXat(i, 0) - this.getXat(i - 1, 0);
        if(minDist > dist) {
            minDist = dist;
        }
    }

    console.log("minDist=", minDist);
    console.log("maxDist=", maxDist);

    return (minDist === Infinity || maxDist === 0) ? 1 : minDist / maxDist;
}

proto.calcYstep = function(ylen) {
    var maxDist = this.getYat(0, 0) - this.getYat(0, ylen - 1)
    var minDist = Infinity;
    for(var i = 1; i < ylen; i++) {
        var dist = this.getYat(0, i) - this.getYat(0, i - 1);
        if(minDist > dist) {
            minDist = dist;
        }
    }

    console.log("minDist=", minDist);
    console.log("maxDist=", maxDist);

    return (minDist === Infinity || maxDist === 0) ? 1 : minDist / maxDist;
}

proto.estimateScale = function(width, height) {

    var res = Math.max(width, height);

    console.log("width=", width);
    console.log("height=", height);

    var xStep = this.calcXstep(width);
    var yStep = this.calcYstep(height);
    console.log("xStep=", xStep);
    console.log("yStep=", yStep);

    console.log("1/xStep=", 1/xStep);
    console.log("1/yStep=", 1/yStep);

    var scale = MIN_RESOLUTION / res;
    return (scale > 1) ? scale : 1;
};



/*
proto.estimateScale = function(width, height) {

    var res = Math.max(width, height);

    var scale = MIN_RESOLUTION / res;
    return (scale > 1) ? scale : 1;
};
*/

proto.refineCoords = function(coords) {

    var scaleW = this.dataScale;
    var scaleH = this.dataScale;

    var width = coords[0].shape[0];
    var height = coords[0].shape[1];

    var newWidth = Math.floor(coords[0].shape[0] * scaleW + 1) | 0;
    var newHeight = Math.floor(coords[0].shape[1] * scaleH + 1) | 0;

    // Pad coords by +1
    var padWidth = 1 + width + 1;
    var padHeight = 1 + height + 1;
    var padImg = ndarray(new Float32Array(padWidth * padHeight), [padWidth, padHeight]);

    for(var i = 0; i < coords.length; ++i) {

        this.surface.padField(padImg, coords[i]);

        var scaledImg = ndarray(new Float32Array(newWidth * newHeight), [newWidth, newHeight]);
        homography(scaledImg, padImg,
            [
                scaleW, 0, 0,
                0, scaleH, 0,
                0, 0, 1
            ]
        );
        coords[i] = scaledImg;
    }
};

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
        ylen = data._ylength,
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
    if(!isArrayOrTypedArray(x)) {
        fill(xc, function(row) {
            return xaxis.d2l(row, 0, xcalendar) * scaleFactor[0];
        });
    } else if(isArrayOrTypedArray(x[0])) {
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
    if(!isArrayOrTypedArray(x)) {
        fill(yc, function(row, col) {
            return yaxis.d2l(col, 0, xcalendar) * scaleFactor[1];
        });
    } else if(isArrayOrTypedArray(y[0])) {
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

    // Refine surface color if necessary
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

    this.dataScale = this.estimateScale(coords[0].shape[0], coords[0].shape[1]);
    if(this.dataScale !== 1) {
        this.refineCoords(coords);
    }

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
    surface.enableHighlight = highlightEnable;

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
