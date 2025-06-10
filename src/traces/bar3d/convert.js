'use strict';

var createMesh = require('../../../stackgl_modules').gl_mesh3d;
var parseColorScale = require('../../lib/gl_format_color').parseColorScale;
var isArrayOrTypedArray = require('../../lib').isArrayOrTypedArray;
var str2RgbaArray = require('../../lib/str2rgbarray');
var extractOpts = require('../../components/colorscale').extractOpts;
var zip3 = require('../../plots/gl3d/zip3');

function Bar3dTrace(scene, mesh, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = mesh;
    this.name = '';
    this.data = null;
    this.showContour = false;
}

var proto = Bar3dTrace.prototype;

proto.handlePick = function(selection) {
    if(selection.object === this.mesh) {
        var rawId = selection.data.index;

        var selectIndex = selection.index = this.data._meshG[rawId];

        if(selectIndex === -1) return false;

        selection.traceCoordinate = [
            this.data._Xs[selectIndex],
            this.data._Ys[selectIndex],
            this.data._Zs[selectIndex] +
            this.data._value[selectIndex]
        ];

        var text = this.data.hovertext || this.data.text;
        if(isArrayOrTypedArray(text) && text[selectIndex] !== undefined) {
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

    this.data = generateMeshes(data);

    // Unpack position data
    function toDataCoords(axis, coord, scale, calendar) {
        return coord.map(function(x) {
            return axis.d2l(x, 0, calendar) * scale;
        });
    }

    var positions = zip3(
        toDataCoords(layout.xaxis, data._meshX, scene.dataScale[0], data.xcalendar),
        toDataCoords(layout.yaxis, data._meshY, scene.dataScale[1], data.ycalendar),
        toDataCoords(layout.zaxis, data._meshZ, scene.dataScale[2], data.zcalendar));

    var cells = zip3(data._meshI, data._meshJ, data._meshK);

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

    var cOpts = extractOpts(data);
    var color = data.marker.color;
    if(!color) {
        config.vertexIntensity = data._meshIntensity;
        config.vertexIntensityBounds = [cOpts.min, cOpts.max];
        config.colormap = parseColorScale(data);
    } else {
        config.meshColor = str2RgbaArray(color);
    }

    // Update mesh
    this.mesh.update(config);
};

proto.dispose = function() {
    this.scene.glplot.remove(this.mesh);
    this.mesh.dispose();
};

function generateMeshes(data) {
    data._meshI = [];
    data._meshJ = [];
    data._meshK = [];

    var markerFill = data.marker.fill;

    var numGroups = 0;
    var numFaces = 0;
    var numVertices = 0;
    var beginVertextLength;

    var Xs = data._Xs;
    var Ys = data._Ys;
    var Zs = data._Zs;

    var allXs = [];
    var allYs = [];
    var allZs = [];
    var allQs = []; // store vertex color
    var allGs = []; // store group ids

    function findVertexId(x, y, z) {
        // could be used to find the vertex id of previously generated vertex within the group
        var len = allZs.length;
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
        numGroups++;
    }

    function addVertex(x, y, z, q, withHover) {
        allXs.push(x);
        allYs.push(y);
        allZs.push(z);
        allQs.push(q);
        allGs.push(withHover ? numGroups : -1);
        numVertices++;

        return numVertices - 1;
    }

    function addFace(a, b, c) {
        data._meshI.push(a);
        data._meshJ.push(b);
        data._meshK.push(c);
        numFaces++;

        return numFaces - 1;
    }

    function getCenter(A, B, C, D) {
        var M = [];
        for(var i = 0; i < A.length; i++) {
            M[i] = (A[i] + B[i] + C[i] + D[i]) / 4.0;
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

    function createOpenRect(xyz, abcd) {
        var A = xyz[0];
        var B = xyz[1];
        var C = xyz[2];
        var D = xyz[3];
        var G = getCenter(A, B, C, D);

        var r = Math.sqrt(1 - activeFill);
        var p1 = getBetween(G, A, r);
        var p2 = getBetween(G, B, r);
        var p3 = getBetween(G, C, r);
        var p4 = getBetween(G, D, r);

        var a = abcd[0];
        var b = abcd[1];
        var c = abcd[2];
        var d = abcd[3];

        return {
            xyz: [
                [A, B, p2], [p2, p1, A],
                [B, C, p3], [p3, p2, B],
                [C, D, p4], [p4, p3, C],
                [D, A, p1], [p1, p4, D]
            ],
            abc: [
                [a, b, -1], [-1, -1, a],
                [b, c, -1], [-1, -1, b],
                [c, d, -1], [-1, -1, c],
                [d, a, -1], [-1, -1, d]
            ]
        };
    }

    function drawRect(xyz, abcd) {
        var allXYZs;
        var allABCs;
        if(activeFill < 1) {
            var openRect = createOpenRect(xyz, abcd);
            allXYZs = openRect.xyz;
            allABCs = openRect.abc;
        } else {
            allXYZs = [
                [xyz[0], xyz[1], xyz[2]],
                [xyz[2], xyz[3], xyz[0]],
            ];
            allABCs = [
                [abcd[0], abcd[1], abcd[2]],
                [abcd[2], abcd[3], abcd[0]],
            ];
        }

        for(var f = 0; f < allXYZs.length; f++) {
            xyz = allXYZs[f];
            var abc = allABCs[f];

            var pnts = [];
            for(var i = 0; i < 3; i++) {
                var x = xyz[i][0];
                var y = xyz[i][1];
                var z = xyz[i][2];
                var q = xyz[i][3];

                var id = (abc[i] > -1) ? abc[i] : findVertexId(x, y, z);
                if(id > -1) {
                    pnts[i] = id;
                } else {
                    pnts[i] = addVertex(x, y, z, q, false);
                }
            }

            addFace(pnts[0], pnts[1], pnts[2]);
        }
    }

    function createRect(abcd) {
        var xyz = [];
        for(var i = 0; i < 4; i++) {
            var index = abcd[i];
            xyz.push(
                [
                    allXs[index],
                    allYs[index],
                    allZs[index]
                ]
            );
        }

        drawRect(xyz, abcd);
    }

    function addCube(p000, p001, p010, p011, p100, p101, p110, p111) {
        beginGroup();

        if(data.showbase) {
            createRect([p000, p001, p011, p010]);
        }

        createRect([p111, p101, p100, p110]);

        createRect([p000, p100, p110, p010]);
        createRect([p111, p101, p001, p011]);

        createRect([p000, p100, p101, p001]);
        createRect([p111, p110, p010, p011]);
    }

    function draw3d() {
        var rx = (1 - data.xgap) / 2;
        var ry = (1 - data.ygap) / 2;

        for(var i = 0; i < Zs.length; i++) {
            var x = Xs[i];
            var y = Ys[i];
            var z = Zs[i];
            var value = data._value[i];
            var q = z + value;

            var X = [x - rx, x + rx];
            var Y = [y - ry, y + ry];
            var Z = [z, q];

            var p000 = addVertex(X[0], Y[0], Z[0], q, false);
            var p001 = addVertex(X[1], Y[0], Z[0], q, false);

            var p010 = addVertex(X[0], Y[1], Z[0], q, false);
            var p011 = addVertex(X[1], Y[1], Z[0], q, false);

            var p100 = addVertex(X[0], Y[0], Z[1], q, true);
            var p101 = addVertex(X[1], Y[0], Z[1], q, true);

            var p110 = addVertex(X[0], Y[1], Z[1], q, true);
            var p111 = addVertex(X[1], Y[1], Z[1], q, true);

            addCube(p000, p001, p010, p011, p100, p101, p110, p111);
        }
    }

    function drawAll() {
        // draw markers
        if(markerFill) {
            setFill(markerFill);

            draw3d();
        }

        data._meshG = allGs;
        data._meshX = allXs;
        data._meshY = allYs;
        data._meshZ = allZs;
        data._meshIntensity = data.marker.coloring === 'fill' ? allQs : allZs;

        data._Xs = Xs;
        data._Ys = Ys;
        data._Zs = Zs;
    }

    drawAll();

    return data;
}

module.exports = function createBar3dTrace(scene, data) {
    var gl = scene.glplot.gl;
    var mesh = createMesh({gl: gl});
    var result = new Bar3dTrace(scene, mesh, data.uid);

    mesh._trace = result;
    result.update(data);
    scene.glplot.add(mesh);
    return result;
};
