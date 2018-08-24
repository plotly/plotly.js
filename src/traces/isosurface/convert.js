/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

/*
    Usage example:

    var width = 64
    var height = 64
    var depth = 64

    var xs = []
    var ys = []
    var zs = []

    var data = new Uint16Array(width*height*depth)
    for (var z=0; z<depth; z++)
    for (var y=0; y<height; y++)
    for (var x=0; x<width; x++) {
        xs.push(x/width);
        ys.push(y/height);
        zs.push(z/depth);
        var value = 1500 + 500 * (
            Math.sin(2 * 2*Math.PI*(z/depth-0.5)) +
            Math.cos(3 * 2*Math.PI*(x/width-0.5)) +
            Math.sin(4 * 2*Math.PI*(y/height-0.5))
        );
        data[z*height*width + y*width + x] = value
    }

    Plotly.newPlot(gd, [{
      type: 'isosurface',

      x: xs,
      y: ys,
      z: zs,

      value: data,

      isomin: 1600,
      isomax: 2000,
      cmin: 1500,
      cmax: 2000,

      smoothnormals:  true,
      isocaps: true,

      singlemesh: true,

      colorscale: 'Portland',
      capscolorscale: 'Jet'
    }], {
      scene: {
        xaxis: {range: [0, 1]},
        yaxis: {range: [0, 1]},
        zaxis: {range: [0, 1]}
      }
    })

*/
'use strict';

var isosurfacePlot = require('gl-isosurface3d');

var simpleMap = require('../../lib').simpleMap;
var parseColorScale = require('../../lib/gl_format_color').parseColorScale;

function Isosurface(scene, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = null;
    this.data = null;
}

var proto = Isosurface.prototype;

proto.handlePick = function(selection) {
    if(selection.object === this.mesh) {
        var selectIndex = selection.index = selection.data.index;

        selection.traceCoordinate = [
            selection.data.position[0],
            selection.data.position[1],
            selection.data.position[2],
            selection.data.intensity
        ];

        var text = this.data.text;
        selection.textLabel = "value: " + selection.data.intensity.toPrecision(3);

        if(Array.isArray(text) && text[selectIndex] !== undefined) {
            selection.textLabel = "<br>" + text[selectIndex];
        } else if(text) {
            selection.textLabel = "<br>" + text;
        }

        return true;
    }
};

var axisName2scaleIndex = {xaxis: 0, yaxis: 1, zaxis: 2};

function getSequence(src) {
    var xs = [src[0]];
    for(var i = 1, last = xs[0]; i < src.length; i++) {
        var p = src[i];
        if(p >= last) {
            if(p > last) {
                xs.push(p);
            }
            last = p;
        } else {
            break;
        }
    }
    return xs;
}

// This should find the bounding box min
// edge index so that `value` lies at the edge or outside
// the range starting from xs[edge index].
// That is, xs[edge index] >= value.
function findMinIndex(xs, value) {
    for(var i = 0; i < xs.length; i++) {
        if(xs[i] >= value) {
            return i;
        }
    }
    return xs.length;
}

// This should find the bounding box max
// edge index so that `value` lies at the edge or outside
// the range ending at xs[edge index].
// That is, xs[edge index] <= value.
function findMaxIndex(xs, value) {
    for(var i = xs.length-1; i >= 0; i--) {
        if(xs[i] <= value) {
            return i;
        }
    }
    return -1;
}

function convert(scene, trace) {
    var sceneLayout = scene.fullSceneLayout;
    var dataScale = scene.dataScale;
    var isosurfaceOpts = {};

    function toDataCoords(arr, axisName) {
        var ax = sceneLayout[axisName];
        var scale = dataScale[axisName2scaleIndex[axisName]];
        return simpleMap(arr, function(v) { return ax.d2l(v) * scale; });
    }

    var xs = getSequence(trace.x);
    var ys = getSequence(trace.y);
    var zs = getSequence(trace.z);

    isosurfaceOpts.dimensions = [xs.length, ys.length, zs.length];
    isosurfaceOpts.meshgrid = [
        toDataCoords(xs, 'xaxis'),
        toDataCoords(ys, 'yaxis'),
        toDataCoords(zs, 'zaxis')
    ];


    isosurfaceOpts.values = trace.value;

    isosurfaceOpts.colormap = parseColorScale(trace.colorscale);
    // isosurfaceOpts.capsColormap = parseColorScale(trace.capscolorscale);
    isosurfaceOpts.vertexIntensityBounds = [trace.cmin, trace.cmax];
    isosurfaceOpts.isoBounds = [trace.isomin, trace.isomax];

    isosurfaceOpts.isoCaps = trace.isocaps;
    isosurfaceOpts.singleMesh = trace.singlemesh === undefined ? true : trace.singlemesh;

    var bounds = [[0, 0, 0], isosurfaceOpts.dimensions.slice()];

    if(trace.xmin !== undefined) {
        bounds[0][0] = findMinIndex(xs, trace.xmin);
    }
    if(trace.ymin !== undefined) {
        bounds[0][1] = findMinIndex(ys, trace.ymin);
    }
    if(trace.zmin !== undefined) {
        bounds[0][2] = findMinIndex(zs, trace.zmin);
    }
    if(trace.xmax !== undefined) {
        bounds[1][0] = findMaxIndex(xs, trace.xmax);
    }
    if(trace.ymax !== undefined) {
        bounds[1][1] = findMaxIndex(ys, trace.ymax);
    }
    if(trace.zmax !== undefined) {
        bounds[1][2] = findMaxIndex(zs, trace.zmax);
    }

    var meshData = isosurfacePlot(isosurfaceOpts, bounds);

    // pass gl-mesh3d lighting attributes
    var lp = trace.lightposition;
    meshData.lightPosition = [lp.x, lp.y, lp.z];
    meshData.ambient = trace.lighting.ambient;
    meshData.diffuse = trace.lighting.diffuse;
    meshData.specular = trace.lighting.specular;
    meshData.roughness = trace.lighting.roughness;
    meshData.fresnel = trace.lighting.fresnel;
    meshData.opacity = trace.opacity;

    return meshData;
}

proto.update = function(data) {
    this.data = data;

    var meshData = convert(this.scene, data);
    this.mesh.update(meshData);
};

proto.dispose = function() {
    this.scene.glplot.remove(this.mesh);
    this.mesh.dispose();
};

function createIsosurfaceTrace(scene, data) {
    var gl = scene.glplot.gl;

    var meshData = convert(scene, data);
    var mesh = isosurfacePlot.createTriMesh(gl, meshData);

    var isosurface = new Isosurface(scene, data.uid);
    isosurface.mesh = mesh;
    isosurface.data = data;
    isosurface.meshData = meshData;
    mesh._trace = isosurface;

    scene.glplot.add(mesh);

    return isosurface;
}

module.exports = createIsosurfaceTrace;
