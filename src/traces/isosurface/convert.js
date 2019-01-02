/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createIsosurface = require('isosurface').marchingCubes;
var createMesh = require('gl-mesh3d');

var parseColorScale = require('../../lib/gl_format_color').parseColorScale;
var str2RgbaArray = require('../../lib/str2rgbarray');
var zip3 = require('../../plots/gl3d/zip3');

function IsosurfaceTrace(scene, mesh, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = mesh;
    this.name = '';
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

proto.update = function(data) {
    var scene = this.scene;
    var layout = scene.fullSceneLayout;

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

    config.vertexIntensity = data.intensity;
    config.vertexIntensityBounds = [data.cmin, data.cmax];
    config.colormap = parseColorScale(data.colorscale);

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

    var allVs = [];

    var width = data.x.length;
    var height = data.y.length;
    var depth = data.z.length;

    var i;
    var j;
    var k;

    function getIndex(i, j, k) {
        return i + width * j + width * height * k;
    }

    var Xs = []; for(i = 0; i < width; i++) { Xs[i] = data.x[i]; }
    var Ys = []; for(j = 0; j < height; j++) { Ys[j] = data.y[j]; }
    var Zs = []; for(k = 0; k < depth; k++) { Zs[k] = data.z[k]; }

    var vMin = Math.min.apply(null, data.isovalue);
    var vMax = Math.max.apply(null, data.isovalue);
    var vDif = vMax - vMin;

    var dims = [width, height, depth];

    var numVertices = 0;
    var beginVertextLength;

    function beginSection() {
        beginVertextLength = numVertices;
    }

    function getVertexId(x, y, z) {
        for(var f = beginVertextLength; f < allVs.length - 1; f++) {
            if(
                x === allXs[f] &&
                y === allYs[f] &&
                z === allZs[f]
            ) {
                return f;
            }
        }
        return -1;
    }

    function addVertex(x, y, z, v) {
        allXs.push(x);
        allYs.push(y);
        allZs.push(z);
        allVs.push(v);
        numVertices++;

        return numVertices - 1;
    }

    function addFace(a, b, c) {
        data.i.push(a);
        data.j.push(b);
        data.k.push(c);
    }

    function drawTri(xyzv) {
        var pnts = [];
        for(var g = 0; g < 3; g++) {

            var x = xyzv[g][0];
            var y = xyzv[g][1];
            var z = xyzv[g][2];
            var v = xyzv[g][3];

            var id = getVertexId(x, y, z);
            if(id > -1) {
                pnts[g] = id;
            } else {
                pnts[g] = addVertex(x, y, z, v);
            }
        }

        addFace(pnts[0], pnts[1], pnts[2]);
    }

    function tryCreateTri(a, b, c) {
        var indecies = [a, b, c];
        var xyzv = [];

        for(var g = 0; g < 3; g++) {
            var index = indecies[g];

            var k = Math.floor(index / (width * height));
            var j = Math.floor((index - k * width * height) / width);
            var i = Math.floor(index - k * width * height - j * width);

            xyzv.push(
                [
                    Xs[i],
                    Ys[j],
                    Zs[k],
                    data.value[index]
                ]
            );
        }

        function inRange(value) {

            if(vMin <= value && value <= vMax) return true;

            var PA = Math.abs(value - vMin);
            var PB = Math.abs(value - vMax);
            var closeness = Math.min(PA, PB) / vDif;

            // tolerate certain error i.e. based on distances ...
            if(closeness < 0.001) return true;

            return false;
        }

        var A = xyzv[0];
        var B = xyzv[1];
        var C = xyzv[2];

        var vA = A[3];
        var vB = B[3];
        var vC = C[3];

        var aOk = inRange(vA);
        var bOk = inRange(vB);
        var cOk = inRange(vC);

        if(aOk && bOk && cOk) {
            drawTri(xyzv);
            return;
        }

        if(!aOk && !bOk && !cOk) {
            return;
        }

        function calcIntersection(dst, src) {
            var result = [dst[0], dst[1], dst[2], dst[3]];

            var value = dst[3];
            if(value < vMin) value = vMin;
            else if(value > vMax) value = vMax;
            else return result;

            var ratio = (value - dst[3]) / (src[3] - dst[3]);
            for(var l = 0; l < 4; l++) {
                result[l] = (1 - ratio) * dst[l] + ratio * src[l];
            }
            return result;
        }

        var p1, p2;

        if(aOk && bOk) {
            p1 = calcIntersection(C, A);
            p2 = calcIntersection(C, B);

            drawTri([A, B, p2]);
            drawTri([p2, p1, A]);
            return;
        }

        if(bOk && cOk) {
            p1 = calcIntersection(A, B);
            p2 = calcIntersection(A, C);

            drawTri([B, C, p2]);
            drawTri([p2, p1, B]);
            return;
        }

        if(cOk && aOk) {
            p1 = calcIntersection(B, C);
            p2 = calcIntersection(B, A);

            drawTri([C, A, p2]);
            drawTri([p2, p1, C]);
            return;
        }

        if(aOk) {
            p1 = calcIntersection(B, A);
            p2 = calcIntersection(C, A);

            drawTri([A, p1, p2]);
            return;
        }

        if(bOk) {
            p1 = calcIntersection(C, B);
            p2 = calcIntersection(A, B);

            drawTri([B, p1, p2]);
            return;
        }

        if(cOk) {
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

    if(data.isocap && vDif > 0) {

        var p00, p01, p10, p11;

        for(k = 0; k < depth; k += depth - 1) {
            beginSection();

            for(j = 1; j < height; j++) {
                for(i = 1; i < width; i++) {

                    p00 = getIndex(i - 1, j - 1, k);
                    p01 = getIndex(i - 1, j, k);
                    p10 = getIndex(i, j - 1, k);
                    p11 = getIndex(i, j, k);

                    addRect(p00, p01, p11, p10);
                }
            }
        }

        for(i = 0; i < width; i += width - 1) {
            beginSection();

            for(k = 1; k < depth; k++) {
                for(j = 1; j < height; j++) {

                    p00 = getIndex(i, j - 1, k - 1);
                    p01 = getIndex(i, j - 1, k);
                    p10 = getIndex(i, j, k - 1);
                    p11 = getIndex(i, j, k);

                    addRect(p00, p01, p11, p10);
                }
            }
        }

        for(j = 0; j < height; j += height - 1) {
            beginSection();

            for(i = 1; i < width; i++) {
                for(k = 1; k < depth; k++) {

                    p00 = getIndex(i - 1, j, k - 1);
                    p01 = getIndex(i, j, k - 1);
                    p10 = getIndex(i - 1, j, k);
                    p11 = getIndex(i, j, k);

                    addRect(p00, p01, p11, p10);
                }
            }
        }
    }

    for(var layer = 0; layer < data.isovalue.length; layer++) {

        var value = data.isovalue[layer];

        var fXYZs = [];
        var n = 0;
        for(k = 0; k <= depth; k++) {
            for(j = 0; j <= height; j++) {
                for(i = 0; i <= width; i++) {
                    fXYZs[n] = data.value[getIndex(i, j, k)] - value;
                    n++;
                }
            }
        }

        var isosurfaceMesh = createIsosurface(dims, fXYZs); // Note: data array is passed without bounds to disable rescales

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
            for(q = 0; q < len; q++) {
                positions[q][axis] = starts[axis] + (ends[axis] - starts[axis]) * positions[q][axis] / (dims[axis] - 1);
            }
        }

        // handle non-uniform 3D space
        for(axis = 0; axis < 3; axis++) {
            var ref = (axis === 0) ? data.x : (axis === 1) ? data.y : data.z;

            for(q = 0; q < len; q++) {
                var here = positions[q][axis];

                var minDist = Infinity;
                var first = 0;
                var second = 0;

                var dist;
                for(i = 0; i < dims[axis]; i++) {
                    dist = Math.abs(here - ref[i]);

                    if(dist < minDist) {
                        minDist = dist;
                        second = first;
                        first = i;
                    }
                }

                if(dist > 0 && first !== second) {

                    var d0 = Math.abs(ref[first] - ref[second]);
                    var d1 = Math.abs(here - ref[first]);
                    var d2 = Math.abs(here - ref[second]);

                    if(d1 + d2 > d0) { // extrapolation
                        positions[q][axis] = (ref[first] * d2 - ref[second] * d1) / d0;
                    } else { // interpolation
                        positions[q][axis] = (ref[first] * d2 + ref[second] * d1) / d0;
                    }
                }
            }
        }

        beginSection();
        len = isosurfaceMesh.cells.length;
        for(var f = 0; f < len; f++) {
            var xyzv = [];

            for(var g = 0; g < 3; g++) {
                var p = isosurfaceMesh.cells[f][g];

                xyzv.push(
                    [
                        positions[p][0],
                        positions[p][1],
                        positions[p][2],
                        value
                    ]
                );
            }

            drawTri(xyzv);
        }
    }

    data.x = allXs;
    data.y = allYs;
    data.z = allZs;
    data.intensity = allVs;

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
