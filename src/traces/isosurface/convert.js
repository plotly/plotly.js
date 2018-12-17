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

    this.data = data;

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


var SURFACE_NETS = 'NETS';
var MARCHING_CUBES = 'CUBES';
var MARCHING_TETRAHEDRA = 'TETRAHEDRA';

function createIsosurfaceTrace(scene, data) {

    var gl = scene.glplot.gl;

    var width = data.x.length;
    var height = data.y.length;
    var depth = data.z.length;

    var dims = [width, height, depth];

    // var method = 'NETS';
    var method = 'CUBES';
    // var method = 'TETRAHEDRA';

    var applyMethod =
        (method === MARCHING_CUBES) ? createIsosurface.marchingCubes :
        (method === MARCHING_TETRAHEDRA) ? createIsosurface.marchingTetrahedra :
        (method === SURFACE_NETS) ? createIsosurface.surfaceNets :
        createIsosurface.surfaceNets; // i.e. default

    var i, j, k;

    var fXYZs = [];

    var n = 0;
    for(k = 0; k <= depth; k++) {
        for(j = 0; j <= height; j++) {
            for(i = 0; i <= width; i++) {

                var index = i + width * j + width * height * k;

                fXYZs[n] = data.volume[index]; // use input data from the mock

                n++;
            }
        }
    }

    var isosurfaceMesh = applyMethod(dims, fXYZs); // pass data array without bounds

    var q, len;

    var cells = isosurfaceMesh.cells;
    len = cells.length;
    data.i = [];
    data.j = [];
    data.k = [];
    for(q = 0; q < len; q++) {
        data.i[q] = cells[q][0];
        data.j[q] = cells[q][1];
        data.k[q] = cells[q][2];
    }

    var allXs = []; for(i = 0; i < width; i++) { allXs[i] = data.x[i]; }
    var allYs = []; for(j = 0; j < height; j++) { allYs[j] = data.y[j]; }
    var allZs = []; for(k = 0; k < depth; k++) { allZs[k] = data.z[k]; }

    var positions = isosurfaceMesh.positions;
    len = positions.length;

    var minX = Math.min.apply(null, data.x);
    var minY = Math.min.apply(null, data.y);
    var minZ = Math.min.apply(null, data.z);

    var maxX = Math.max.apply(null, data.x);
    var maxY = Math.max.apply(null, data.y);
    var maxZ = Math.max.apply(null, data.z);

    console.log("minX=", minX);
    console.log("maxX=", maxX);
    console.log("dims[0]=", dims[0]);

    // map pixel coordinates to real world coordinates
    for(q = 0; q < len; q++) {
        positions[q][0] = minX + (1 + maxX - minX) * positions[q][0] / dims[0];
        positions[q][1] = minY + (1 + maxY - minY) * positions[q][1] / dims[1];
        positions[q][2] = minZ + (1 + maxZ - minZ) * positions[q][2] / dims[2];
    }

    // handle non-uniform 3D space
    for(var axis = 0; axis < 3; axis++) {
        var xyz = (axis === 0) ? data.x : (axis === 1) ? data.y : data.z;

        for(q = 0; q < len; q++) {
            var here = positions[q][axis];
            var prev, next;

            var found = false;
            for(i = 1; i < dims[axis]; i++) {
                prev = xyz[i - 1];
                next = xyz[i];

                if((prev <= here && here <= next) || (prev >= here && here >= next)) {
                    found = true;
                    break;
                }
            }

            if(!found) {
                if(Math.abs(xyz[0] - here) <= Math.abs(xyz[dims[axis] - 1] - here)) {
                    prev = xyz[0];
                    next = xyz[1];
                } else {
                    prev = xyz[dims[axis] - 2];
                    next = xyz[dims[axis] - 1];
                }
            }

            if(here >= prev) {
                positions[q][axis] = prev + (here - prev) * (next - prev);
            } else {
                positions[q][axis] = next + (here - next) * (prev - next);
            }
        }
    }

    // copy positions
    data.x = [];
    data.y = [];
    data.z = [];
    for(q = 0; q < len; q++) {
        data.x[q] = positions[q][0];
        data.y[q] = positions[q][1];
        data.z[q] = positions[q][2];
    }

    var mesh = createMesh({gl: gl});

    var result = new IsosurfaceTrace(scene, mesh, data.uid);

    mesh._trace = result;
    result.update(data);
    scene.glplot.add(mesh);
    return result;
}

module.exports = createIsosurfaceTrace;
