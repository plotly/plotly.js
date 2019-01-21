/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

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

function findNearestOnAxis(w, arr, nPoints, nDim, step) {
    var id = nDim;
    for(var q = nPoints - 1; q > 0 && id > 0; q -= step) {
        id--;
        var min = Math.min(arr[q], arr[q - step]);
        var max = Math.max(arr[q], arr[q - step]);
        if(max > min && min < w && w <= max) {
            return {
                id: id,
                distRatio: (max - w) / (max - min)
            };
        }
    }
    return {
        id: 0,
        distRatio: 0
    };
}

proto.handlePick = function(selection) {
    if(selection.object === this.mesh) {

        var rawId = selection.data.index;

        var x = this.data.x[rawId];
        var y = this.data.y[rawId];
        var z = this.data.z[rawId];

        var width = this.data.width;
        var height = this.data.height;
        var depth = this.data.depth;
        var nPoints = width * height * depth;

        var i = findNearestOnAxis(x, this.data.x, nPoints, width, 1 + depth * height).id;
        var j = findNearestOnAxis(y, this.data.y, nPoints, height, 1 + depth).id;
        var k = findNearestOnAxis(z, this.data.z, nPoints, depth, 1).id;

        var selectIndex = selection.index = k + depth * j + depth * height * i;

        selection.traceCoordinate = [
            this.data.x[selectIndex],
            this.data.y[selectIndex],
            this.data.z[selectIndex],
            this.data.value[selectIndex]
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
        opacity: 1, // Note: no need to create transparent surfaces
        contourEnable: data.contour.show,
        contourColor: str2RgbaArray(data.contour.color).slice(0, 3),
        contourWidth: data.contour.width,
        useFacetNormals: data.flatshading
    };

    config.vertexIntensity = data.intensity;
    config.vertexIntensityBounds = [data.cmin, data.cmax];
    config.colormap = parseColorScale(data);

    // Update mesh
    this.mesh.update(config);
};

proto.dispose = function() {
    this.scene.glplot.remove(this.mesh);
    this.mesh.dispose();
};

function generateIsosurfaceMesh(data) {

    data.i = [];
    data.j = [];
    data.k = [];

    var showSurface = data.surface.show;
    var showSpaceframe = data.spaceframe.show;

    var surfaceFill = data.surface.fill;
    var spaceframeFill = data.spaceframe.fill;

    var drawingSurface = false;
    var drawingSpaceframe = false;
    var drawingEdge = false;

    var numFaces = 0;
    var numVertices;
    var beginVertextLength;

    var width = data.width;
    var height = data.height;
    var depth = data.depth;

    function getIndex(i, j, k) {
        return k + depth * j + depth * height * i;
    }

    var minValues = data._minValues;
    var maxValues = data._maxValues;

    var vMin = data._vMin;
    var vMax = data._vMax;

    var allXs;
    var allYs;
    var allZs;
    var allVs;

    function findVertexId(x, y, z) {
        // could be used to find the vertex id of previously generated vertex within the group

        var len = allVs.length;
        for(var f = beginVertextLength; f < len; f++) {
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

    function beginGroup() {
        beginVertextLength = numVertices;
    }

    function emptyVertices() {
        allXs = [];
        allYs = [];
        allZs = [];
        allVs = [];
        numVertices = 0;

        beginGroup();
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
        numFaces++;

        return numFaces - 1;
    }

    function getCenter(A, B, C) {
        var M = [];
        for(var i = 0; i < A.length; i++) {
            M[i] = (A[i] + B[i] + C[i]) / 3.0;
        }
        return M;
    }

    function getBetween(A, B, r) {
        var M = [];
        for(var i = 0; i < A.length; i++) {
            M[i] = A[i] * (1 - r) + r * B[i];
        }
        return M;
    }

    var activeFill;
    function setFill(fill) {
        activeFill = fill;
    }

    function createOpenTri(xyzv, abc) {
        var A = xyzv[0];
        var B = xyzv[1];
        var C = xyzv[2];
        var G = getCenter(A, B, C);

        var r = Math.sqrt(1 - activeFill);
        var p1 = getBetween(G, A, r);
        var p2 = getBetween(G, B, r);
        var p3 = getBetween(G, C, r);

        var a = abc[0];
        var b = abc[1];
        var c = abc[2];

        return {
            xyzv: [
                [A, B, p2], [p2, p1, A],
                [B, C, p3], [p3, p2, B],
                [C, A, p1], [p1, p3, C]
            ],
            abc: [
                [a, b, -1], [-1, -1, a],
                [b, c, -1], [-1, -1, b],
                [c, a, -1], [-1, -1, c]
            ]
        };
    }

    function styleIncludes(style, char) {
        if(style === 'all' || style === null) return true;
        return (style.indexOf(char) > -1);
    }

    function mapValue(style, value) {
        if(style === null) return value;
        return style;
    }

    function drawTri(style, xyzv, abc) {

        beginGroup();

        var allXYZVs = [xyzv];
        var allABCs = [abc];
        if(activeFill >= 1) {
            allXYZVs = [xyzv];
            allABCs = [abc];
        } else if(activeFill > 0) {
            var openTri = createOpenTri(xyzv, abc);
            allXYZVs = openTri.xyzv;
            allABCs = openTri.abc;
        }

        for(var f = 0; f < allXYZVs.length; f++) {

            xyzv = allXYZVs[f];
            abc = allABCs[f];

            var pnts = [];
            for(var i = 0; i < 3; i++) {

                var x = xyzv[i][0];
                var y = xyzv[i][1];
                var z = xyzv[i][2];
                var v = xyzv[i][3];

                var id = (abc[i] > -1) ? abc[i] : findVertexId(x, y, z);
                if(id > -1) {
                    pnts[i] = id;
                } else {
                    pnts[i] = addVertex(x, y, z, mapValue(style, v));
                }
            }

            addFace(pnts[0], pnts[1], pnts[2]);
        }
    }

    function drawQuad(style, xyzv, abcd) {
        var makeTri = function(i, j, k) {
            drawTri(style, [xyzv[i], xyzv[j], xyzv[k]], [abcd[i], abcd[j], abcd[k]]);
        };

        makeTri(0, 1, 2);
        makeTri(2, 3, 0);
    }

    function drawTetra(style, xyzv, abcd) {
        var makeTri = function(i, j, k) {
            drawTri(style, [xyzv[i], xyzv[j], xyzv[k]], [abcd[i], abcd[j], abcd[k]]);
        };

        makeTri(0, 1, 2);
        makeTri(3, 0, 1);
        makeTri(2, 3, 0);
        makeTri(1, 2, 3);
    }

    function calcIntersection(pointOut, pointIn, min, max) {
        var value = pointOut[3];

        if(value < min) value = min;
        if(value > max) value = max;

        var ratio = (pointOut[3] - value) / (pointOut[3] - pointIn[3]);

        var result = [];
        for(var s = 0; s < 4; s++) {
            result[s] = (1 - ratio) * pointOut[s] + ratio * pointIn[s];
        }
        return result;
    }

    function inRange(value, min, max) {
        return (
            value >= min &&
            value <= max
        );
    }

    function almostInFinalRange(value) {
        var vErr = 0.01 * (vMax - vMin);
        return (
            value >= vMin - vErr &&
            value <= vMax + vErr
        );
    }

    function getXYZV(indecies) {
        var xyzv = [];
        for(var q = 0; q < 4; q++) {
            var index = indecies[q];
            xyzv.push(
                [
                    data.x[index],
                    data.y[index],
                    data.z[index],
                    data.value[index]
                ]
            );
        }

        return xyzv;
    }

    function tryCreateTri(style, xyzv, abc, min, max, isSecondPass) {

        abc = [-1, -1, -1]; // Note: for the moment we had to override indices
        // for planar surfaces (i.e. caps and slices) due to group shading
        // bug of gl-mesh3d. But don't worry this would run faster!

        var tryDrawTri = function(style, xyzv, abc) {
            if( // we check here if the points are in `real` iso-min/max range
                almostInFinalRange(xyzv[0][3]) &&
                almostInFinalRange(xyzv[1][3]) &&
                almostInFinalRange(xyzv[2][3])
            ) {
                drawTri(style, xyzv, abc);
            } else if(!isSecondPass) {
                tryCreateTri(style, xyzv, abc, vMin, vMax, true); // i.e. second pass
            }
        };

        var ok = [
            inRange(xyzv[0][3], min, max),
            inRange(xyzv[1][3], min, max),
            inRange(xyzv[2][3], min, max)
        ];

        var interpolated = false;

        if(!ok[0] && !ok[1] && !ok[2]) {
            return interpolated;
        }

        if(ok[0] && ok[1] && ok[2]) {
            if(!drawingEdge) {
                tryDrawTri(style, xyzv, abc);
            }
            return interpolated;
        }

        [
            [0, 1, 2],
            [2, 0, 1],
            [1, 2, 0]
        ].forEach(function(e) {
            if(ok[e[0]] && ok[e[1]] && !ok[e[2]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];

                var p1 = calcIntersection(C, A, min, max);
                var p2 = calcIntersection(C, B, min, max);

                tryDrawTri(style, [p2, p1, A], [-1, -1, abc[e[0]]]);
                tryDrawTri(style, [A, B, p2], [abc[e[0]], abc[e[1]], -1]);

                interpolated = true;
            }
        });
        if(interpolated) return interpolated;

        [
            [0, 1, 2],
            [1, 2, 0],
            [2, 0, 1]
        ].forEach(function(e) {
            if(ok[e[0]] && !ok[e[1]] && !ok[e[2]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];

                var p1 = calcIntersection(B, A, min, max);
                var p2 = calcIntersection(C, A, min, max);

                tryDrawTri(style, [p2, p1, A], [-1, -1, abc[e[0]]]);

                interpolated = true;
            }
        });
        return interpolated;
    }

    function tryCreateTetra(style, abcd, min, max) {

        var xyzv = getXYZV(abcd);

        var ok = [
            inRange(xyzv[0][3], min, max),
            inRange(xyzv[1][3], min, max),
            inRange(xyzv[2][3], min, max),
            inRange(xyzv[3][3], min, max)
        ];

        var interpolated = false;

        if(!ok[0] && !ok[1] && !ok[2] && !ok[3]) {
            return interpolated;
        }

        if(ok[0] && ok[1] && ok[2] && ok[3]) {
            if(drawingSpaceframe) {
                drawTetra(style, xyzv, abcd);
            }
            return interpolated;
        }

        [
            [0, 1, 2, 3],
            [3, 0, 1, 2],
            [2, 3, 0, 1],
            [1, 2, 3, 0]
        ].forEach(function(e) {
            if(ok[e[0]] && ok[e[1]] && ok[e[2]] && !ok[e[3]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];
                var D = xyzv[e[3]];

                if(drawingSpaceframe) {
                    drawTri(style, [A, B, C], [abcd[e[0]], abcd[e[1]], abcd[e[2]]]);
                } else {
                    var p1 = calcIntersection(D, A, min, max);
                    var p2 = calcIntersection(D, B, min, max);
                    var p3 = calcIntersection(D, C, min, max);

                    drawTri(null, [p1, p2, p3], [-1, -1, -1]);
                }

                interpolated = true;
            }
        });
        if(interpolated) return interpolated;

        [
            [0, 1, 2, 3],
            [1, 2, 3, 0],
            [2, 3, 0, 1],
            [3, 0, 1, 2],
            [0, 2, 3, 1],
            [1, 3, 2, 0]
        ].forEach(function(e) {
            if(ok[e[0]] && ok[e[1]] && !ok[e[2]] && !ok[e[3]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];
                var D = xyzv[e[3]];

                var p1 = calcIntersection(C, A, min, max);
                var p2 = calcIntersection(C, B, min, max);
                var p3 = calcIntersection(D, B, min, max);
                var p4 = calcIntersection(D, A, min, max);

                if(drawingSpaceframe) {
                    drawTri(style, [A, p4, p1], [abcd[e[0]], -1, -1]);
                    drawTri(style, [B, p2, p3], [abcd[e[1]], -1, -1]);
                } else {
                    drawQuad(null, [p1, p2, p3, p4], [-1, -1, -1, -1]);
                }

                interpolated = true;
            }
        });
        if(interpolated) return interpolated;

        [
            [0, 1, 2, 3],
            [1, 2, 3, 0],
            [2, 3, 0, 1],
            [3, 0, 1, 2]
        ].forEach(function(e) {
            if(ok[e[0]] && !ok[e[1]] && !ok[e[2]] && !ok[e[3]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];
                var D = xyzv[e[3]];

                var p1 = calcIntersection(B, A, min, max);
                var p2 = calcIntersection(C, A, min, max);
                var p3 = calcIntersection(D, A, min, max);

                if(drawingSpaceframe) {
                    drawTri(style, [A, p1, p2], [abcd[e[0]], -1, -1]);
                    drawTri(style, [A, p2, p3], [abcd[e[0]], -1, -1]);
                    drawTri(style, [A, p3, p1], [abcd[e[0]], -1, -1]);
                } else {
                    drawTri(null, [p1, p2, p3], [-1, -1, -1]);
                }

                interpolated = true;
            }
        });
        return interpolated;
    }

    function addCube(style, p000, p001, p010, p011, p100, p101, p110, p111, min, max) {

        if(drawingSurface) {
            if(styleIncludes(style, 'A')) {
                tryCreateTetra(null, [p000, p001, p010, p100], min, max);
            }
            if(styleIncludes(style, 'B')) {
                tryCreateTetra(null, [p001, p010, p011, p111], min, max);
            }
            if(styleIncludes(style, 'C')) {
                tryCreateTetra(null, [p001, p100, p101, p111], min, max);
            }
            if(styleIncludes(style, 'D')) {
                tryCreateTetra(null, [p010, p100, p110, p111], min, max);
            }
            if(styleIncludes(style, 'E')) {
                tryCreateTetra(null, [p001, p010, p100, p111], min, max);
            }
        }

        if(drawingSpaceframe) {
            tryCreateTetra(style, [p001, p010, p100, p111], min, max);
        }
    }

    function addRect(style, a, b, c, d, min, max) {
        tryCreateTri(style, getXYZV([a, b, c]), [a, b, c], min, max);
        tryCreateTri(style, getXYZV([c, d, a]), [c, d, a], min, max);
    }

    function begin2dCell(style, p00, p01, p10, p11, min, max, isEven) {
        // used to create caps and/or slices on exact axis points
        if(isEven) {
            addRect(style, p00, p01, p11, p10, min, max);
        } else {
            addRect(style, p01, p11, p10, p00, min, max);
        }
    }

    function beginSection(style, i, j, k, min, max, distRatios) {
        // used to create slices between axis points

        var A, B, C, D;

        var makeSection = function() {
            tryCreateTri(style, [A, B, C], [-1, -1, -1], min, max);
            tryCreateTri(style, [C, D, A], [-1, -1, -1], min, max);
        };

        var rX = distRatios[0];
        var rY = distRatios[1];
        var rZ = distRatios[2];

        if(rX) {
            A = getBetween(getXYZV([getIndex(i, j - 0, k - 0)])[0], getXYZV([getIndex(i - 1, j - 0, k - 0)])[0], rX);
            B = getBetween(getXYZV([getIndex(i, j - 0, k - 1)])[0], getXYZV([getIndex(i - 1, j - 0, k - 1)])[0], rX);
            C = getBetween(getXYZV([getIndex(i, j - 1, k - 1)])[0], getXYZV([getIndex(i - 1, j - 1, k - 1)])[0], rX);
            D = getBetween(getXYZV([getIndex(i, j - 1, k - 0)])[0], getXYZV([getIndex(i - 1, j - 1, k - 0)])[0], rX);
            makeSection();
        }

        if(rY) {
            A = getBetween(getXYZV([getIndex(i - 0, j, k - 0)])[0], getXYZV([getIndex(i - 0, j - 1, k - 0)])[0], rY);
            B = getBetween(getXYZV([getIndex(i - 0, j, k - 1)])[0], getXYZV([getIndex(i - 0, j - 1, k - 1)])[0], rY);
            C = getBetween(getXYZV([getIndex(i - 1, j, k - 1)])[0], getXYZV([getIndex(i - 1, j - 1, k - 1)])[0], rY);
            D = getBetween(getXYZV([getIndex(i - 1, j, k - 0)])[0], getXYZV([getIndex(i - 1, j - 1, k - 0)])[0], rY);
            makeSection();
        }

        if(rZ) {
            A = getBetween(getXYZV([getIndex(i - 0, j - 0, k)])[0], getXYZV([getIndex(i - 0, j - 0, k - 1)])[0], rZ);
            B = getBetween(getXYZV([getIndex(i - 0, j - 1, k)])[0], getXYZV([getIndex(i - 0, j - 1, k - 1)])[0], rZ);
            C = getBetween(getXYZV([getIndex(i - 1, j - 1, k)])[0], getXYZV([getIndex(i - 1, j - 1, k - 1)])[0], rZ);
            D = getBetween(getXYZV([getIndex(i - 1, j - 0, k)])[0], getXYZV([getIndex(i - 1, j - 0, k - 1)])[0], rZ);
            makeSection();
        }
    }

    function begin3dCell(style, p000, p001, p010, p011, p100, p101, p110, p111, min, max, isEven) {
        // used to create spaceframe and/or iso-surfaces
        var cellStyle = style;
        if(isEven) {
            if(drawingSurface && style === 'even') cellStyle = null;
            addCube(cellStyle, p000, p001, p010, p011, p100, p101, p110, p111, min, max);
        } else {
            if(drawingSurface && style === 'odd') cellStyle = null;
            addCube(cellStyle, p111, p110, p101, p100, p011, p010, p001, p000, min, max);
        }
    }

    function draw2dX(style, items, min, max) {
        for(var q = 0; q < items.length; q++) {
            var i = items[q];
            for(var k = 1; k < depth; k++) {
                for(var j = 1; j < height; j++) {
                    begin2dCell(style,
                        getIndex(i, j - 1, k - 1),
                        getIndex(i, j - 1, k),
                        getIndex(i, j, k - 1),
                        getIndex(i, j, k),
                        min,
                        max,
                        (i + j + k) % 2
                    );
                }
            }
        }
    }

    function draw2dY(style, items, min, max) {
        for(var q = 0; q < items.length; q++) {
            var j = items[q];
            for(var i = 1; i < width; i++) {
                for(var k = 1; k < depth; k++) {
                    begin2dCell(style,
                        getIndex(i - 1, j, k - 1),
                        getIndex(i, j, k - 1),
                        getIndex(i - 1, j, k),
                        getIndex(i, j, k),
                        min,
                        max,
                        (i + j + k) % 2
                    );
                }
            }
        }
    }

    function draw2dZ(style, items, min, max) {
        for(var q = 0; q < items.length; q++) {
            var k = items[q];
            for(var j = 1; j < height; j++) {
                for(var i = 1; i < width; i++) {
                    begin2dCell(style,
                        getIndex(i - 1, j - 1, k),
                        getIndex(i - 1, j, k),
                        getIndex(i, j - 1, k),
                        getIndex(i, j, k),
                        min,
                        max,
                        (i + j + k) % 2
                    );
                }
            }
        }
    }

    function draw3d(style, min, max) {
        for(var k = 1; k < depth; k++) {
            for(var j = 1; j < height; j++) {
                for(var i = 1; i < width; i++) {
                    begin3dCell(style,
                        getIndex(i - 1, j - 1, k - 1),
                        getIndex(i - 1, j - 1, k),
                        getIndex(i - 1, j, k - 1),
                        getIndex(i - 1, j, k),
                        getIndex(i, j - 1, k - 1),
                        getIndex(i, j - 1, k),
                        getIndex(i, j, k - 1),
                        getIndex(i, j, k),
                        min,
                        max,
                        (i + j + k) % 2
                    );
                }
            }
        }
    }

    function drawSpaceframe(style, min, max) {
        drawingSpaceframe = true;
        draw3d(style, min, max);
        drawingSpaceframe = false;
    }

    function drawSurface(style, min, max) {
        drawingSurface = true;
        draw3d(style, min, max);
        drawingSurface = false;
    }

    function drawSectionX(style, items, min, max, distRatios) {
        for(var q = 0; q < items.length; q++) {
            var i = items[q];
            for(var k = 1; k < depth; k++) {
                for(var j = 1; j < height; j++) {
                    beginSection(style, i, j, k, min, max, distRatios[q]);
                }
            }
        }
    }

    function drawSectionY(style, items, min, max, distRatios) {
        for(var q = 0; q < items.length; q++) {
            var j = items[q];
            for(var i = 1; i < width; i++) {
                for(var k = 1; k < depth; k++) {
                    beginSection(style, i, j, k, min, max, distRatios[q]);
                }
            }
        }
    }

    function drawSectionZ(style, items, min, max, distRatios) {
        for(var q = 0; q < items.length; q++) {
            var k = items[q];
            for(var j = 1; j < height; j++) {
                for(var i = 1; i < width; i++) {
                    beginSection(style, i, j, k, min, max, distRatios[q]);
                }
            }
        }
    }

    function createRange(a, b) {
        var range = [];
        for(var q = a; q < b; q++) {
            range.push(q);
        }
        return range;
    }

    function insertGridPoints() {
        for(var i = 0; i < width; i++) {
            for(var j = 0; j < height; j++) {
                for(var k = 0; k < depth; k++) {
                    var index = getIndex(i, j, k);
                    addVertex(
                        data.x[index],
                        data.y[index],
                        data.z[index],
                        data.value[index]
                    );
                }
            }
        }
    }

    function drawAll() {

        emptyVertices();

        // insert grid points
        insertGridPoints();

        var activeStyle = null;

        // draw spaceframes
        if(showSpaceframe && spaceframeFill) {
            setFill(spaceframeFill);

            drawSpaceframe(activeStyle, vMin, vMax);
        }

        // draw iso-surfaces
        if(showSurface && surfaceFill) {
            setFill(surfaceFill);

            var surfacePattern = data.surface.pattern;
            var surfaceCount = data.surface.count;
            for(var q = 0; q < surfaceCount; q++) {
                var ratio = (surfaceCount === 1) ? 0.5 : q / (surfaceCount - 1);
                var level = (1 - ratio) * vMin + ratio * vMax;

                var d1 = Math.abs(level - minValues);
                var d2 = Math.abs(level - maxValues);
                var ranges = (d1 > d2) ?
                    [minValues, level] :
                    [level, maxValues];

                drawSurface(surfacePattern, ranges[0], ranges[1]);
            }
        }

        var setupMinMax = [
            [ Math.min(vMin, maxValues), Math.max(vMin, maxValues) ],
            [ Math.min(minValues, vMax), Math.max(minValues, vMax) ]
        ];

        ['x', 'y', 'z'].forEach(function(e) {
            for(var s = 0; s < setupMinMax.length; s++) {

                drawingEdge = (s === 0) ? false : true;

                var activeMin = setupMinMax[s][0];
                var activeMax = setupMinMax[s][1];

                // draw slices
                var slice = data.slices[e];
                if(slice.show && slice.fill) {
                    setFill(slice.fill);

                    var exactIndices = [];
                    var ceilIndices = [];
                    var distRatios = [];
                    if(slice.locations.length) {

                        for(var q = 0; q < slice.locations.length; q++) {

                            var location = slice.locations[q];

                            var near;
                            if(e === 'x') {
                                near = findNearestOnAxis(location, data.x, width * height * depth, width, 1 + depth * height);
                            } else if(e === 'y') {
                                near = findNearestOnAxis(location, data.y, width * height * depth, height, 1 + depth);
                            } else {
                                near = findNearestOnAxis(location, data.z, width * height * depth, depth, 1);
                            }

                            if(near.distRatio === 0) {
                                exactIndices.push(near.id);
                            } else if(near.id > 0) {
                                ceilIndices.push(near.id);
                                if(e === 'x') {
                                    distRatios.push([near.distRatio, 0, 0]);
                                } else if(e === 'y') {
                                    distRatios.push([0, near.distRatio, 0]);
                                } else {
                                    distRatios.push([0, 0, near.distRatio]);
                                }
                            }
                        }
                    } else {
                        if(e === 'x') {
                            exactIndices = createRange(1, width - 1);
                        } else if(e === 'y') {
                            exactIndices = createRange(1, height - 1);
                        } else {
                            exactIndices = createRange(1, depth - 1);
                        }
                    }

                    if(ceilIndices.length > 0) {
                        if(e === 'x') {
                            drawSectionX(activeStyle, ceilIndices, activeMin, activeMax, distRatios);
                        } else if(e === 'y') {
                            drawSectionY(activeStyle, ceilIndices, activeMin, activeMax, distRatios);
                        } else {
                            drawSectionZ(activeStyle, ceilIndices, activeMin, activeMax, distRatios);
                        }
                    }

                    if(exactIndices.length > 0) {
                        if(e === 'x') {
                            draw2dX(activeStyle, exactIndices, activeMin, activeMax);
                        } else if(e === 'y') {
                            draw2dY(activeStyle, exactIndices, activeMin, activeMax);
                        } else {
                            draw2dZ(activeStyle, exactIndices, activeMin, activeMax);
                        }
                    }
                }

                // draw caps
                var cap = data.caps[e];
                if(cap.show && cap.fill) {
                    setFill(cap.fill);
                    if(e === 'x') {
                        draw2dX(activeStyle, [0, width - 1], activeMin, activeMax);
                    } else if(e === 'y') {
                        draw2dY(activeStyle, [0, height - 1], activeMin, activeMax);
                    } else {
                        draw2dZ(activeStyle, [0, depth - 1], activeMin, activeMax);
                    }
                }
            }
        });

        // remove vertices arrays (i.e. grid points) in case no face was created.
        if(numFaces === 0) {
            emptyVertices();
        }

        data.x = allXs;
        data.y = allYs;
        data.z = allZs;
        data.intensity = allVs;
    }

    drawAll();

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
