/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createIsosurface = require('isosurface');
var createMesh = require('gl-mesh3d');

var parseColorScale = require('../../lib/gl_format_color').parseColorScale;
var str2RgbaArray = require('../../lib/str2rgbarray');
var zip3 = require('../../plots/gl3d/zip3');

function IsosurfaceTrace(scene, mesh, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = mesh;
    this.name = '';
    this.color = '#fff';
    this.data = null;
    this.showContour = false;
}

var proto = IsosurfaceTrace.prototype;

proto.handlePick = function(selection) {
    if(selection.object === this.mesh) {
        var selectIndex = selection.index = selection.data.index;

        selection.traceCoordinate = [
            this.data.x[selectIndex],
            this.data.y[selectIndex],
            this.data.z[selectIndex]
        ];

        var text = this.data.text;
        if(Array.isArray(text) && text[selectIndex] !== undefined) {
            selection.textLabel = text[selectIndex];
        } else if(text) {
            selection.textLabel = text;
        }

        return true;
    }
};

function parseColorArray(colors) {
    return colors.map(str2RgbaArray);
}

proto.update = function(data) {
    var scene = this.scene,
        layout = scene.fullSceneLayout;

    this.data = generateIsosurfaceMesh(data);

    // Unpack position data
    function toDataCoords(axis, coord, scale, calendar) {
        return coord.map(function(x) {
            return axis.d2l(x, 0, calendar) * scale;
        });
    }

    var positions = zip3(
        toDataCoords(layout.xaxis, data.x, scene.dataScale[0], data.xcalendar),
        toDataCoords(layout.yaxis, data.y, scene.dataScale[1], data.ycalendar),
        toDataCoords(layout.zaxis, data.z, scene.dataScale[2], data.zcalendar));

    var cells = zip3(data.i, data.j, data.k);

    var config = {
        positions: positions,
        cells: cells,
        lightPosition: [data.lightposition.x, data.lightposition.y, data.lightposition.z],
        ambient: data.lighting.ambient,
        diffuse: data.lighting.diffuse,
        specular: data.lighting.specular,
        roughness: data.lighting.roughness,
        fresnel: data.lighting.fresnel,
        vertexNormalsEpsilon: data.lighting.vertexnormalsepsilon,
        faceNormalsEpsilon: data.lighting.facenormalsepsilon,
        opacity: data.opacity,
        contourEnable: data.contour.show,
        contourColor: str2RgbaArray(data.contour.color).slice(0, 3),
        contourWidth: data.contour.width,
        useFacetNormals: data.flatshading
    };

    if(data.intensity) {
        this.color = '#fff';
        config.vertexIntensity = data.intensity;
        config.vertexIntensityBounds = [data.cmin, data.cmax];
        config.colormap = parseColorScale(data.colorscale);
    }
    else if(data.vertexcolor) {
        this.color = data.vertexcolor[0];
        config.vertexColors = parseColorArray(data.vertexcolor);
    }
    else if(data.facecolor) {
        this.color = data.facecolor[0];
        config.cellColors = parseColorArray(data.facecolor);
    }
    else {
        this.color = data.color;
        config.meshColor = str2RgbaArray(data.color);
    }

    // Update mesh
    this.mesh.update(config);
};

proto.dispose = function() {
    this.scene.glplot.remove(this.mesh);
    this.mesh.dispose();
};


function generateIsosurfaceMesh(data) {

    data.intensity = [];

    data.i = [];
    data.j = [];
    data.k = [];

    var allXs = [];
    var allYs = [];
    var allZs = [];

    var allCs = [];

    var width = data.x.length;
    var height = data.y.length;
    var depth = data.z.length;

    var i, j, k;

    function getIndex(i, j, k) {
        return i + width * j + width * height * k;
    }

    var Xs = []; for(i = 0; i < width; i++) { Xs[i] = data.x[i]; }
    var Ys = []; for(j = 0; j < height; j++) { Ys[j] = data.y[j]; }
    var Zs = []; for(k = 0; k < depth; k++) { Zs[k] = data.z[k]; }

    var imin = Math.min.apply(null, data.isovalue);
    var imax = Math.max.apply(null, data.isovalue);

    var dims = [width, height, depth];

    var num_vertices = 0;

    function drawTri(xyzw) {
        for(var g = 0; g < 3; g++) {
            allXs.push(xyzw[g][0]);
            allYs.push(xyzw[g][1]);
            allZs.push(xyzw[g][2]);
            allCs.push(xyzw[g][3]);

            if(g === 0) {
                data.i.push(num_vertices);
            }
            else if(g === 1) {
                data.j.push(num_vertices);
            }
            else {
                data.k.push(num_vertices);
            }

            num_vertices++;
        }
    }

    function tryCreateTri(a, b, c) {
        var indecies = [a, b, c];
        var xyzw = [];

        for(var g = 0; g < 3; g++) {
            var index = indecies[g];

            var k = Math.floor(index / (width * height));
            var j = Math.floor((index - k * width * height) / width);
            var i = Math.floor(index - k * width * height - j * width);

            xyzw.push(
                [
                    Xs[i],
                    Ys[j],
                    Zs[k],
                    data.volume[index]
                ]
            );
        }

        function inRange(value) {
            return (imin <= value && value <= imax);
        }

        var A = xyzw[0];
        var B = xyzw[1];
        var C = xyzw[2];

        var vA = A[3];
        var vB = B[3];
        var vC = C[3];

        var a_OK = inRange(vA);
        var b_OK = inRange(vB);
        var c_OK = inRange(vC);

        if(a_OK && b_OK && c_OK) {
            drawTri(xyzw);
            return;
        }

        if(!a_OK && !b_OK && !c_OK) {
            return;
        }

        function calcIntersection(dst, src) {
            var val = dst[3];

            if(val < imin) val = imin;
            else if(val > imax) val = imax;
            else return dst;

            var ratio = (val - src[3]) / (dst[3] - src[3]);
            if(ratio < 0) return dst;
            if(ratio > 1) return dst;

            for(var l = 0; l < 4; l++) {
                dst[l] = ratio * dst[l] + (1 - ratio) * src[l];
            }
            return dst;
        }

        var p1, p2;

        if(a_OK && b_OK) {
            p1 = calcIntersection(C, A);
            p2 = calcIntersection(C, B);

            drawTri([A, B, p2]);
            drawTri([p2, p1, A]);
            return;
        }

        if(b_OK && c_OK) {
            p1 = calcIntersection(A, B);
            p2 = calcIntersection(A, C);

            drawTri([B, C, p2]);
            drawTri([p2, p1, B]);
            return;
        }

        if(c_OK && a_OK) {
            p1 = calcIntersection(B, C);
            p2 = calcIntersection(B, A);

            drawTri([C, A, p2]);
            drawTri([p2, p1, C]);
            return;
        }

        if(a_OK) {
            p1 = calcIntersection(B, A);
            p2 = calcIntersection(C, A);

            drawTri([A, p1, p2]);
            return;
        }

        if(b_OK) {
            p1 = calcIntersection(C, B);
            p2 = calcIntersection(A, B);

            drawTri([B, p1, p2]);
            return;
        }

        if(c_OK) {
            p1 = calcIntersection(A, C);
            p2 = calcIntersection(B, C);

            drawTri([C, p1, p2]);
            return;
        }
    }

    function addRect(a, b, c, d) {
        tryCreateTri(a, b, c);
        tryCreateTri(c, d, a);
    }

    if(data.isocap) {

        var p00, p01, p10, p11;
        for(j = 1; j < height; j++) {
            for(i = 1; i < width; i++) {

                for(k = 0; k < depth; k += depth - 1) {
                    p00 = getIndex(i - 1, j - 1, k);
                    p01 = getIndex(i - 1, j, k);
                    p10 = getIndex(i, j - 1, k);
                    p11 = getIndex(i, j, k);

                    addRect(p00, p01, p11, p10);
                }
            }
        }

        for(k = 1; k < depth; k++) {
            for(j = 1; j < height; j++) {

                for(i = 0; i < width; i += width - 1) {
                    p00 = getIndex(i, j - 1, k - 1);
                    p01 = getIndex(i, j - 1, k);
                    p10 = getIndex(i, j, k - 1);
                    p11 = getIndex(i, j, k);

                    addRect(p00, p01, p11, p10);
                }
            }
        }

        for(i = 1; i < width; i++) {
            for(k = 1; k < depth; k++) {

                for(j = 0; j < height; j += height - 1) {
                    p00 = getIndex(i - 1, j, k - 1);
                    p01 = getIndex(i, j, k - 1);
                    p10 = getIndex(i - 1, j, k);
                    p11 = getIndex(i, j, k);

                    addRect(p00, p01, p11, p10);
                }
            }
        }
    }

    for(var iso_id = 0; iso_id < data.isovalue.length; iso_id++) {

        var level = data.isovalue[iso_id];
        var intensity = level;

        var fXYZs = [];
        var n = 0;
        for(k = 0; k <= depth; k++) {
            for(j = 0; j <= height; j++) {
                for(i = 0; i <= width; i++) {
                    fXYZs[n] = data.volume[getIndex(i, j, k)] - level;
                    n++;
                }
            }
        }

        var isosurfaceMesh = // Note: data array is passed without bounds to disable rescales
            (data.meshalgo === 'SurfaceNets') ?
                createIsosurface.surfaceNets(dims, fXYZs) :
            (data.meshalgo === 'MarchingTetrahedra') ?
                createIsosurface.marchingTetrahedra(dims, fXYZs) :
                createIsosurface.marchingCubes(dims, fXYZs); // default: MarchingCube

        var q, len;

        var positions = isosurfaceMesh.positions;
        len = positions.length;

        var axis;

        var starts = [
            Xs[0],
            Ys[0],
            Zs[0]
        ];
        var ends = [
            Xs[Xs.length - 1],
            Ys[Ys.length - 1],
            Zs[Zs.length - 1]
        ];

        // map pixel coordinates (0..n) to (real) world coordinates
        for(axis = 0; axis < 3; axis++) {
            var start = starts[axis];
            var end = ends[axis];
            for(q = 0; q < len; q++) {
                positions[q][axis] = start + (end - start) * positions[q][axis] / (dims[axis] - 1);
            }
        }

        // handle non-uniform 3D space
        for(axis = 0; axis < 3; axis++) {
            var xyz = (axis === 0) ? data.x : (axis === 1) ? data.y : data.z;

            for(q = 0; q < len; q++) {
                var here = positions[q][axis];

                var minDist = Infinity;
                var first = 0;
                var second = 0;

                var dist;
                for(i = 0; i < dims[axis]; i++) {
                    dist = Math.abs(here - xyz[i]);

                    if(dist < minDist) {
                        minDist = dist;
                        second = first;
                        first = i;
                    }
                }

                if(dist > 0 && first !== second) {

                    var d1 = -(here - xyz[first]);
                    var d2 = (here - xyz[second]);

                    positions[q][axis] = (xyz[first] * d2 + xyz[second] * d1) / (d1 + d2);
                }
            }
        }

        // record positions & colors of iso surface
        for(q = 0; q < len; q++) {
            allXs.push(positions[q][0]);
            allYs.push(positions[q][1]);
            allZs.push(positions[q][2]);

            allCs.push(intensity);
        }

        // record cells of iso surface
        var cells = isosurfaceMesh.cells;
        len = cells.length;
        for(q = 0; q < len; q++) {
            data.i.push(cells[q][0] + num_vertices);
            data.j.push(cells[q][1] + num_vertices);
            data.k.push(cells[q][2] + num_vertices);
        }

        num_vertices += positions.length;
    }

    data.x = allXs;
    data.y = allYs;
    data.z = allZs;
    data.intensity = allCs;

    return data;
}

function createIsosurfaceTrace(scene, data) {

    var gl = scene.glplot.gl;

    var mesh = createMesh({gl: gl});

    var result = new IsosurfaceTrace(scene, mesh, data.uid);

    mesh._trace = result;
    result.update(data);
    scene.glplot.add(mesh);
    return result;
}

module.exports = createIsosurfaceTrace;
