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
        opacity: 1, // Note: we do NOT use data.opacity directly
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

    var requestedOpacity = data.opacity;
    var activeOpacity;
    function setOpacity(opacity) {
        activeOpacity = opacity;
    }
    setOpacity(requestedOpacity);

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

    // var debug1 = 0.5 * (vMax + vMin);

    var numVertices = 0;
    var beginVertextLength;

    function beginGroup() {
        beginVertextLength = numVertices;
    }

    function findVertexId(x, y, z) {
        for(var f = beginVertextLength; f < allVs.length; f++) {
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

    function drawTri(debug, xyzv) {

        beginGroup(); // <<<<<<<<<<<<<<<<<<

        var allXYZVs = [];
        if(activeOpacity >= 1) { allXYZVs = [xyzv]; }
        else if(activeOpacity > 0) {
            var A = xyzv[0];
            var B = xyzv[1];
            var C = xyzv[2];
            var G = getCenter(A, B, C);

            var r = Math.sqrt(1 - activeOpacity);
            var p1 = getBetween(G, A, r);
            var p2 = getBetween(G, B, r);
            var p3 = getBetween(G, C, r);

            allXYZVs = [
                [A, B, p2], [p2, p1, A],
                [B, C, p3], [p3, p2, B],
                [C, A, p1], [p1, p3, C]
            ];
        }

        for(var f = 0; f < allXYZVs.length; f++) {

            xyzv = allXYZVs[f];

            var pnts = [];
            for(var i = 0; i < 3; i++) {

                var x = xyzv[i][0];
                var y = xyzv[i][1];
                var z = xyzv[i][2];
                var v = xyzv[i][3];

                var id = -1; // findVertexId(x, y, z); // <<<<<<<<<<<<<<<<<<<<<<<<<
                if(id > -1) {
                    pnts[i] = id;
                } else {
                    if(debug === undefined) {
                        pnts[i] = addVertex(x, y, z, v);
                    } else {
                        pnts[i] = addVertex(x, y, z, debug);
                    }
                }
            }

            addFace(pnts[0], pnts[1], pnts[2]);
        }
    }

    function drawQuad(debug, xyzv) {
        drawTri(debug, [xyzv[0], xyzv[1], xyzv[2]]);
        drawTri(debug, [xyzv[2], xyzv[3], xyzv[0]]);
    }

    function drawTetra(debug, xyzv) {
        drawTri(debug, [xyzv[0], xyzv[1], xyzv[2]]);
        drawTri(debug, [xyzv[0], xyzv[1], xyzv[3]]);
        drawTri(debug, [xyzv[0], xyzv[2], xyzv[3]]);
        drawTri(debug, [xyzv[1], xyzv[2], xyzv[3]]);
    }

    function calcIntersection(dst, src) {
        var value = dst[3];

        if(value < vMin) value = vMin;
        if(value > vMax) value = vMax;

        var ratio = (value - dst[3]) / (src[3] - dst[3]);

        var result = [];
        for(var s = 0; s < 4; s++) {
            result[s] = (1 - ratio) * dst[s] + ratio * src[s];
        }
        return result;
    }

    function isQuiteClose(a) {
        // tolerate certain error i.e. based on distances ...
        // return (a < 0.01);
        return (a === 0);
    }

    function isCloseToMin(value) {
        return isQuiteClose(Math.abs(value - vMin) / vDif);
    }

    function isCloseToMax(value) {
        return isQuiteClose(Math.abs(vMax - value) / vDif);
    }

    function isCloseToRanges(value) {
        return (
            isCloseToMin(value) ||
            isCloseToMax(value)
        );
    }

    function inRange(value) {
        if(vMin <= value && value <= vMax) return true;
        return isCloseToRanges(value);
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

    function tryCreateTri(a, b, c, isCore, debug) {

        var xyzv = getXYZV([a, b, c]);

        var ok = [
            inRange(xyzv[0][3]),
            inRange(xyzv[1][3]),
            inRange(xyzv[2][3])
        ];

        if(!ok[0] && !ok[1] && !ok[2]) {
            return false;
        }

        if(ok[0] && ok[1] && ok[2]) {
            if(isCore) {
                drawTri(debug, xyzv);
            }
            return false;
        }

        var shouldReturn = false;

        [
            [0, 1, 2],
            [0, 2, 1],
            [1, 2, 0]
        ].forEach(function(e) {
            if(ok[e[0]] && ok[e[1]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];

                var p1 = calcIntersection(C, A);
                var p2 = calcIntersection(C, B);

                drawTri(debug, [A, B, p2]);
                drawTri(debug, [p2, p1, A]);
                shouldReturn = true;
            }
        });
        if(shouldReturn) return shouldReturn;

        [
            [0, 1, 2],
            [1, 2, 0],
            [2, 1, 0]
        ].forEach(function(e) {
            if(ok[e[0]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];

                var p1 = calcIntersection(B, A);
                var p2 = calcIntersection(C, A);

                drawTri(debug, [A, p1, p2]);
                shouldReturn = true;
            }
        });
        if(shouldReturn) return shouldReturn;

        // We should never end up here! Anyway let's return from the function
        return false;
    }

    function tryCreateTetra(a, b, c, d, isCore, debug) {

        var xyzv = getXYZV([a, b, c, d]);

        var aboveMin = [
            xyzv[0][3] >= vMin,
            xyzv[1][3] >= vMin,
            xyzv[2][3] >= vMin,
            xyzv[3][3] >= vMin
        ];

        var belowMax = [
            xyzv[0][3] <= vMax,
            xyzv[1][3] <= vMax,
            xyzv[2][3] <= vMax,
            xyzv[3][3] <= vMax
        ];

        var ok = [
            inRange(xyzv[0][3]),
            inRange(xyzv[1][3]),
            inRange(xyzv[2][3]),
            inRange(xyzv[3][3])
        ];

        if(!ok[0] && !ok[1] && !ok[2] && !ok[3]) {
            return false;
        }

        if(ok[0] && ok[1] && ok[2] && ok[3]) {
            if(isCore) {
                drawTetra(debug, xyzv);
            }
            return false;
        }

        var shouldReturn = false;

        [
            [0, 1, 2, 3],
            [0, 1, 3, 2],
            [0, 2, 3, 1],
            [1, 2, 3, 0]
        ].forEach(function(e) {
            if(ok[e[0]] && ok[e[1]] && ok[e[2]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];
                var D = xyzv[e[3]];

                var p1 = calcIntersection(D, A);
                var p2 = calcIntersection(D, B);
                var p3 = calcIntersection(D, C);

                drawTri(debug, [p1, p2, p3]);
                if(isCore) {
                    drawQuad(debug, [A, B, p2, p1]);
                    drawQuad(debug, [B, C, p3, p2]);
                    drawQuad(debug, [C, A, p1, p3]);
                    drawTri(debug, [A, B, C]);
                }
                shouldReturn = true;
            }
        });
        if(shouldReturn) return shouldReturn;

        [
            [0, 1, 2, 3],
            [0, 2, 1, 3],
            [0, 3, 1, 2],
            [1, 2, 0, 3],
            [1, 3, 0, 2],
            [2, 3, 0, 1]
        ].forEach(function(e) {
            if(ok[e[0]] && ok[e[1]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];
                var D = xyzv[e[3]];

                var p1 = calcIntersection(C, A);
                var p2 = calcIntersection(C, B);
                var p3 = calcIntersection(D, B);
                var p4 = calcIntersection(D, A);

                drawQuad(debug, [p1, p2, p3, p4]);
                if(isCore) {
                    drawQuad(debug, [A, B, p2, p1]);
                    drawQuad(debug, [A, B, p3, p4]);
                    drawTri(debug, [A, p1, p4]);
                    drawTri(debug, [B, p2, p3]);
                }
                shouldReturn = true;
            }
        });
        if(shouldReturn) return shouldReturn;

        [
            [0, 1, 2, 3],
            [1, 0, 2, 3],
            [2, 0, 1, 3],
            [3, 0, 1, 2]
        ].forEach(function(e) {
            if(ok[e[0]]) {
                var A = xyzv[e[0]];
                var B = xyzv[e[1]];
                var C = xyzv[e[2]];
                var D = xyzv[e[3]];

                var p1 = calcIntersection(B, A);
                var p2 = calcIntersection(C, A);
                var p3 = calcIntersection(D, A);

                drawTri(debug, [p1, p2, p3]);
                if(isCore) {
                    drawTri(debug, [A, p1, p2]);
                    drawTri(debug, [A, p2, p3]);
                    drawTri(debug, [A, p3, p1]);
                }
                shouldReturn = true;
            }
        });
        if(shouldReturn) return shouldReturn;

        // We should never end up here! Anyway let's return from the function
        return false;
    }

    function addCube(p000, p001, p010, p011, p100, p101, p110, p111) {

        var a = tryCreateTetra(p000, p001, p010, p100, false);
        var b = tryCreateTetra(p011, p001, p010, p111, false);
        var c = tryCreateTetra(p101, p100, p111, p001, false);
        var d = tryCreateTetra(p110, p100, p111, p010, false);

        if(a || b || c || d) {
            tryCreateTetra(p001, p010, p100, p111, data.isocap && vDif > 0);
        }
    }

    function addRect(a, b, c, d) {
        tryCreateTri(a, b, c, true);
        tryCreateTri(c, d, a, true);
    }

    for(k = 1; k < depth; k++) {
        for(j = 1; j < height; j++) {
            for(i = 1; i < width; i++) {
                var p000 = getIndex(i - 1, j - 1, k - 1);
                var p001 = getIndex(i - 1, j - 1, k);
                var p010 = getIndex(i - 1, j, k - 1);
                var p011 = getIndex(i - 1, j, k);
                var p100 = getIndex(i, j - 1, k - 1);
                var p101 = getIndex(i, j - 1, k);
                var p110 = getIndex(i, j, k - 1);
                var p111 = getIndex(i, j, k);

                if((i + j + k) % 2 === 0) {
                    addCube(p000, p001, p010, p011, p100, p101, p110, p111);
                } else {
                    addCube(p111, p110, p101, p100, p011, p010, p001, p000);
                }
            }
        }
    }

    function drawSlice(p00, p01, p10, p11, opt) {
        if(opt) {
            addRect(p00, p01, p11, p10);
        } else {
            addRect(p01, p11, p10, p00);
        }
    }

    function drawSectionsX(items) {
        items.forEach(function(i) {
            beginGroup();

            for(var k = 1; k < depth; k++) {
                for(var j = 1; j < height; j++) {
                    drawSlice(
                        getIndex(i, j - 1, k - 1),
                        getIndex(i, j - 1, k),
                        getIndex(i, j, k - 1),
                        getIndex(i, j, k),
                        (i + j + k) % 2
                    );
                }
            }
        });
    }

    function drawSectionsY(items) {
        items.forEach(function(j) {
            beginGroup();

            for(var i = 1; i < width; i++) {
                for(var k = 1; k < depth; k++) {
                    drawSlice(
                        getIndex(i - 1, j, k - 1),
                        getIndex(i, j, k - 1),
                        getIndex(i - 1, j, k),
                        getIndex(i, j, k),
                        (i + j + k) % 2
                    );
                }
            }
        });
    }

    function drawSectionsZ(items) {
        items.forEach(function(k) {
            beginGroup();

            for(var j = 1; j < height; j++) {
                for(var i = 1; i < width; i++) {
                    drawSlice(
                        getIndex(i - 1, j - 1, k),
                        getIndex(i - 1, j, k),
                        getIndex(i, j - 1, k),
                        getIndex(i, j, k),
                        (i + j + k) % 2
                    );
                }
            }
        });
    }

    if(data.isocap && vDif > 0) {

        setOpacity(1);
        // setOpacity(0.5);

        drawSectionsX([0, width - 1]);
        drawSectionsY([0, height - 1]);
        drawSectionsZ([0, depth - 1]);
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
