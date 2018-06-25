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
      type: 'volume',

      x: xs,
      y: ys,
      z: zs,

      u: data,

      imin: 1600,
      imax: 2000,
      cmin: 1500,
      cmax: 2000,

      opacity: 0.5,

      colorscale: 'Portland'
    }], {
      scene: {
        xaxis: {range: [0, 1]},
        yaxis: {range: [0, 1]},
        zaxis: {range: [0, 1]}
      }
    })

*/
'use strict';

var volumePlot = require('gl-volume3d');

var simpleMap = require('../../lib').simpleMap;
var parseColorScale = require('../../lib/gl_format_color').parseColorScale;

function Volume(scene, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = null;
    this.data = null;
}

var proto = Volume.prototype;

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
        if(Array.isArray(text) && text[selectIndex] !== undefined) {
            selection.textLabel = text[selectIndex];
        } else if(text) {
            selection.textLabel = text;
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

function convert(gl, scene, trace) {
    var sceneLayout = scene.fullSceneLayout;
    var dataScale = scene.dataScale;
    var volumeOpts = {};

    function toDataCoords(arr, axisName) {
        var ax = sceneLayout[axisName];
        var scale = dataScale[axisName2scaleIndex[axisName]];
        return simpleMap(arr, function(v) { return ax.d2l(v) * scale; });
    }

    var xs = getSequence(trace.x);
    var ys = getSequence(trace.y);
    var zs = getSequence(trace.z);

    volumeOpts.dimensions = [xs.length, ys.length, zs.length];
    volumeOpts.meshgrid = [
        toDataCoords(xs, 'xaxis'),
        toDataCoords(ys, 'yaxis'),
        toDataCoords(zs, 'zaxis')
    ];

    // var bounds = [
    //    volumeOpts.boundmin || [xs[0], ys[0], zs[0]],
    //    volumeOpts.boundmax || [xs[xs.length - 1], ys[ys.length - 1], zs[zs.length - 1]]
    // ];


    volumeOpts.values = trace.u;

    volumeOpts.colormap = parseColorScale(trace.colorscale);

    volumeOpts.intensityBounds = [trace.cmin, trace.cmax];
    volumeOpts.isoBounds = [
        trace.imin === undefined ? trace.cmin : trace.imin,
        trace.imax === undefined ? trace.cmax : trace.imax
    ];

    volumeOpts.opacity = trace.opacity === undefined ? 1 : trace.opacity;

    var bounds = [[0, 0, 0], volumeOpts.dimensions];

    var volume = volumePlot(gl, volumeOpts, bounds);

    // pass gl-mesh3d lighting attributes
    var lp = trace.lightposition;
    for(var i = 0; i < volume.meshes.length; i++) {
        var meshData = volume.meshes[i];
        meshData.lightPosition = [lp.x, lp.y, lp.z];
        meshData.ambient = trace.lighting.ambient;
        meshData.diffuse = trace.lighting.diffuse;
        meshData.specular = trace.lighting.specular;
        meshData.roughness = trace.lighting.roughness;
        meshData.fresnel = trace.lighting.fresnel;
        meshData.opacity = trace.opacity;

    }

    return volume;
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

function createvolumeTrace(scene, data) {
    var gl = scene.glplot.gl;

    var mesh = convert(gl, scene, data);

    var volume = new Volume(scene, data.uid);
    volume.mesh = mesh;
    volume.data = data;
    mesh._trace = volume;

    scene.glplot.add(mesh);

    return volume;
}

module.exports = createvolumeTrace;
