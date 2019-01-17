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

proto.findNearestOnAxis = function(w, arr) {
    for(var q = arr.length - 1; q > 0; q--) {
        var min = Math.min(arr[q], arr[q - 1]);
        var max = Math.max(arr[q], arr[q - 1]);
        if(w <= max && w > min) return q;
    }
    return 0;
};

proto.handlePick = function(selection) {
    if(selection.object === this.mesh) {

        var rawId = selection.data.index;

        var x = this.data.x[rawId];
        var y = this.data.y[rawId];
        var z = this.data.z[rawId];

        var i = this.findNearestOnAxis(x, this.data._Xs);
        var j = this.findNearestOnAxis(y, this.data._Ys);
        var k = this.findNearestOnAxis(z, this.data._Zs);

        var width = this.data._Xs.length;
        var height = this.data._Ys.length;

        var selectIndex = selection.index = i + width * j + width * height * k;

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

    var showSurface = data.surface.show;
    var showVolume = data.volume.show;

    var surfaceFill = data.surface.fill;
    var volumeFill = data.volume.fill;

    var drawingSurface = false;
    var drawingVolume = false;
    var drawingEdge = false;

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

    function getIndex(i, j, k) {
        return i + width * j + width * height * k;
    }

    var Xs = [];
    var Ys = [];
    var Zs = [];

    function fillXs() {
        for(var i = 0; i < width; i++) {
            Xs[i] = data.x[i];
        }
    }

    function fillYs() {
        for(var j = 0; j < height; j++) {
            Ys[j] = data.y[j];
        }
    }

    function fillZs() {
        for(var k = 0; k < depth; k++) {
            Zs[k] = data.z[k];
        }
    }

    fillXs();
    fillYs();
    fillZs();

    var minValues = data._minValues;
    var maxValues = data._maxValues;

    var vMin = data._vMin;
    var vMax = data._vMax;

    if(vMin > vMax) {
        var vTmp = vMin;
        vMin = vMax;
        vMax = vTmp;
    }

    var numVertices = 0;
    var beginVertextLength;

    function beginGroup() {
        beginVertextLength = numVertices;
    }

    beginGroup();

    function findVertexId(x, y, z) {
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
                [A, B, p2],
                [p2, p1, A],

                [B, C, p3],
                [p3, p2, B],

                [C, A, p1],
                [p1, p3, C]
            ],
            abc: [
                [a, b, -1],
                [-1, -1, a],

                [b, c, -1],
                [-1, -1, b],

                [c, a, -1],
                [-1, -1, c]
            ]
        };
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
            if(drawingVolume) {
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

                if(drawingVolume) {
                    drawTri(style, [A, B, C], [abcd[e[0]], abcd[e[1]], abcd[e[2]]]);
                } else {
                    var p1 = calcIntersection(D, A, min, max);
                    var p2 = calcIntersection(D, B, min, max);
                    var p3 = calcIntersection(D, C, min, max);

                    drawTri(style, [p1, p2, p3], [-1, -1, -1]);
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

                if(drawingVolume) {
                    drawTri(style, [A, p4, p1], [abcd[e[0]], -1, -1]);
                    drawTri(style, [B, p2, p3], [abcd[e[1]], -1, -1]);
                } else {
                    drawQuad(style, [p1, p2, p3, p4], [-1, -1, -1, -1]);
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

                if(drawingVolume) {
                    drawTri(style, [A, p1, p2], [abcd[e[0]], -1, -1]);
                    drawTri(style, [A, p2, p3], [abcd[e[0]], -1, -1]);
                    drawTri(style, [A, p3, p1], [abcd[e[0]], -1, -1]);
                } else {
                    drawTri(style, [p1, p2, p3], [-1, -1, -1]);
                }

                interpolated = true;
            }
        });
        return interpolated;
    }

    function addCube(style, p000, p001, p010, p011, p100, p101, p110, p111, min, max) {

        if(drawingSurface) {
            var a = tryCreateTetra(style, [p000, p001, p010, p100], min, max);
            var b = tryCreateTetra(style, [p001, p010, p011, p111], min, max);
            var c = tryCreateTetra(style, [p001, p100, p101, p111], min, max);
            var d = tryCreateTetra(style, [p010, p100, p110, p111], min, max);

            if(a || b || c || d) {
                tryCreateTetra(style, [p001, p010, p100, p111], min, max);
            }
        }

        if(drawingVolume) {
            tryCreateTetra(style, [p001, p010, p100, p111], min, max);
        }
    }

    function addRect(style, a, b, c, d, min, max) {
        tryCreateTri(style, getXYZV([a, b, c]), [a, b, c], min, max);
        tryCreateTri(style, getXYZV([c, d, a]), [c, d, a], min, max);
    }

    function beginSlice(style, p00, p01, p10, p11, min, max, isEven) {
        if(isEven) {
            addRect(style, p00, p01, p11, p10, min, max);
        } else {
            addRect(style, p01, p11, p10, p00, min, max);
        }
    }

    function beginCell(style, p000, p001, p010, p011, p100, p101, p110, p111, min, max, isEven) {
        if(isEven) {
            addCube(style, p000, p001, p010, p011, p100, p101, p110, p111, min, max);
        } else {
            addCube(style, p111, p110, p101, p100, p011, p010, p001, p000, min, max);
        }
    }

    function drawSectionsX(style, items, min, max) {
        items.forEach(function(i) {
            for(var k = 1; k < depth; k++) {
                for(var j = 1; j < height; j++) {
                    beginSlice(style,
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
        });
    }

    function drawSectionsY(style, items, min, max) {
        items.forEach(function(j) {
            for(var i = 1; i < width; i++) {
                for(var k = 1; k < depth; k++) {
                    beginSlice(style,
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
        });
    }

    function drawSectionsZ(style, items, min, max) {
        items.forEach(function(k) {
            for(var j = 1; j < height; j++) {
                for(var i = 1; i < width; i++) {
                    beginSlice(style,
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
        });
    }

    function drawVolume(style, min, max) {
        drawingVolume = true;
        for(var k = 1; k < depth; k++) {
            for(var j = 1; j < height; j++) {
                for(var i = 1; i < width; i++) {
                    beginCell(style,
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
        drawingVolume = false;
    }

    function drawSurface(style, min, max) {
        drawingSurface = true;
        for(var k = 1; k < depth; k++) {
            for(var j = 1; j < height; j++) {
                for(var i = 1; i < width; i++) {
                    beginCell(style,
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
        drawingSurface = false;
    }

    function createRange(a, b) {
        var range = [];
        for(var q = a; q < b; q++) {
            range.push(q);
        }
        return range;
    }

    function insertGridPoints() {
        for(var k = 0; k < depth; k++) {
            for(var j = 0; j < height; j++) {
                for(var i = 0; i < width; i++) {
                    addVertex(Xs[i], Ys[j], Zs[k], data.value[getIndex(i, j, k)]);
                }
            }
        }
    }

    var activeStyle = null;

    // insert grid points
    insertGridPoints();

    // draw volume
    if(showVolume && volumeFill) {
        setFill(volumeFill);

        drawVolume(activeStyle, vMin, vMax);
    }

    // draw surfaces
    if(showSurface && surfaceFill) {
        setFill(surfaceFill);

        drawSurface(activeStyle, vMin, maxValues);
        drawSurface(activeStyle, minValues, vMax);
    }

    var setupMinMax = [
        [ vMin, maxValues ],
        [ minValues, vMax ]
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
                if(e === 'x') drawSectionsX(activeStyle, createRange(1, width - 1), activeMin, activeMax);
                if(e === 'y') drawSectionsY(activeStyle, createRange(1, height - 1), activeMin, activeMax);
                if(e === 'z') drawSectionsZ(activeStyle, createRange(1, depth - 1), activeMin, activeMax);
            }

            // draw caps
            var cap = data.caps[e];
            if(cap.show && cap.fill) {
                setFill(cap.fill);
                if(e === 'x') drawSectionsX(activeStyle, [0, width - 1], activeMin, activeMax);
                if(e === 'y') drawSectionsY(activeStyle, [0, height - 1], activeMin, activeMax);
                if(e === 'z') drawSectionsZ(activeStyle, [0, depth - 1], activeMin, activeMax);
            }

        }
    });

    data._Xs = Xs;
    data._Ys = Ys;
    data._Zs = Zs;

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
