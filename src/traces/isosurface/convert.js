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

    this.data = (data.i && data.i.lenght) ? data :
        generateIsosurfaceMesh(data);

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

function generateIsosurfaceMesh(data) {

    // TODO: check this function is not called when the user update an attribute e.g. opacity

    data.i = [];
    data.j = [];
    data.k = [];

    var allXs = [];
    var allYs = [];
    var allZs = [];

    var width = data.x.length;
    var height = data.y.length;
    var depth = data.z.length;

    var i, j, k;

    var Xs = []; for(i = 0; i < width; i++) { Xs[i] = data.x[i]; }
    var Ys = []; for(j = 0; j < height; j++) { Ys[j] = data.y[j]; }
    var Zs = []; for(k = 0; k < depth; k++) { Zs[k] = data.z[k]; }

    var bounds = [
        [
            Math.min.apply(null, Xs),
            Math.min.apply(null, Ys),
            Math.min.apply(null, Zs)
        ],
        [
            Math.max.apply(null, Xs),
            Math.max.apply(null, Ys),
            Math.max.apply(null, Zs)
        ]
    ];

    var dims = [width, height, depth];

    // var method = 'NETS';
    var method = 'CUBES';
    // var method = 'TETRAHEDRA';

    var applyMethod =
        (method === MARCHING_CUBES) ? createIsosurface.marchingCubes :
        (method === MARCHING_TETRAHEDRA) ? createIsosurface.marchingTetrahedra :
        (method === SURFACE_NETS) ? createIsosurface.surfaceNets :
        createIsosurface.surfaceNets; // i.e. default

    var num_pos = 0;
    for(var iso_id = 0; iso_id < data.isovalue.length; iso_id++) {

        var fXYZs = [];

        var n = 0;
        for(k = 0; k <= depth; k++) {
            for(j = 0; j <= height; j++) {
                for(i = 0; i <= width; i++) {

                    var index = i + width * j + width * height * k;

                    fXYZs[n] = data.volume[index] - data.isovalue[iso_id];

                    n++;
                }
            }
        }

        var isosurfaceMesh = applyMethod(dims, fXYZs); // pass data array without bounds

        var q, len;

        var cells = isosurfaceMesh.cells;
        len = cells.length;
        for(q = 0; q < len; q++) {
            data.i.push(cells[q][0] + num_pos);
            data.j.push(cells[q][1] + num_pos);
            data.k.push(cells[q][2] + num_pos);
        }

        var positions = isosurfaceMesh.positions;
        len = positions.length;

        var axis, min, max;

        // map (integer) pixel coordinates to (real) world coordinates
        for(q = 0; q < len; q++) {
            for(axis = 0; axis < 3; axis++) {
                min = bounds[0][axis];
                max = bounds[1][axis];
                positions[q][axis] = min + (1 + max - min) * positions[q][axis] / dims[axis];
            }
        }

        // handle non-uniform 3D space
        for(axis = 0; axis < 3; axis++) {
            var xyz = (axis === 0) ? data.x : (axis === 1) ? data.y : data.z;

            min = bounds[0][axis];
            max = bounds[1][axis];

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

        // copy positions
        for(q = 0; q < len; q++) {
            allXs.push(positions[q][0]);
            allYs.push(positions[q][1]);
            allZs.push(positions[q][2]);
        }

        num_pos += len;
    }

    data.x = allXs;
    data.y = allYs;
    data.z = allZs;

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
