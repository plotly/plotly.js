/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// var createIsosurface = require('isosurface').marchingCubes;
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

    function drawTri(debug, xyzv) {
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
                if(debug === undefined) {
                    pnts[g] = addVertex(x, y, z, v);
                } else {
                    pnts[g] = addVertex(x, y, z, debug);
                }
            }
        }

        addFace(pnts[0], pnts[1], pnts[2]);
    }

    function drawTetra(debug, xyzv) {

        beginSection(); // <<<<<<<<<<<<<<<<<<<<<<<<<<<

        drawTri(debug, [xyzv[0], xyzv[1], xyzv[2]]);
        drawTri(debug, [xyzv[0], xyzv[1], xyzv[3]]);
        drawTri(debug, [xyzv[0], xyzv[2], xyzv[3]]);
        drawTri(debug, [xyzv[1], xyzv[2], xyzv[3]]);
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

    function inRange(value) {

        if(vMin <= value && value <= vMax) return true;

        var dA = Math.abs(value - vMin);
        var dB = Math.abs(value - vMax);
        var closeness = Math.min(dA, dB) / vDif;

        // tolerate certain error i.e. based on distances ...
        if(closeness < 0.001) return true;

        return false;
    }

    function tryCreateTetra(a, b, c, d, debug) {

        var indecies = [a, b, c, d];
        var xyzv = [];

        for(var g = 0; g < 4; g++) {
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

        var ok = [
            inRange(xyzv[0][3]),
            inRange(xyzv[1][3]),
            inRange(xyzv[2][3]),
            inRange(xyzv[3][3])
        ];

        if(ok[0] && ok[1] && ok[2] && ok[3]) {
            drawTetra(debug, xyzv);
            return;
        }

        if(!ok[0] && !ok[1] && !ok[2] && !ok[3]) {
            return;
        }

        var p1, p2, p3;

        [[0, 1, 2], [1, 2, 0], [2, 0, 1]].forEach(function(e) {
            if(ok[e[0]] && ok[e[1]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];

                p1 = calcIntersection(C, A);
                p2 = calcIntersection(C, B);

                drawTri(debug, [A, B, p2]);
                drawTri(debug, [p2, p1, A]);
                return;
            }
        });

        [[0, 1, 2], [1, 2, 0], [2, 0, 1]].forEach(function(e) {
            if(ok[e[0]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];

                p1 = calcIntersection(B, A);
                p2 = calcIntersection(C, A);

                drawTri(debug, [A, p1, p2]);
                return;
            }
        });
    }

    function addCube(p000, p001, p010, p011, p100, p101, p110, p111) {
        tryCreateTetra(p000, p001, p010, p100);
        tryCreateTetra(p011, p001, p010, p111);
        tryCreateTetra(p101, p100, p111, p001);
        tryCreateTetra(p110, p100, p111, p010);
    }

    if(data.isocap && vDif > 0) {
        for(k = 1; k < depth; k++) {
            for(j = 1; j < height; j++) {
                for(i = 1; i < width; i++) {
                    addCube(
                        getIndex(i - 1, j - 1, k - 1),
                        getIndex(i - 1, j - 1, k ),
                        getIndex(i - 1, j , k - 1),
                        getIndex(i - 1, j , k ),
                        getIndex(i , j - 1, k - 1),
                        getIndex(i , j - 1, k ),
                        getIndex(i , j , k - 1),
                        getIndex(i , j , k )
                    );
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
