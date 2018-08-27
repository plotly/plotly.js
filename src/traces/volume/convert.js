/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

/*
    Usage example:

    var width = 128
    var height = 128
    var depth = 128

    var xs = []
    var ys = []
    var zs = []

    var data = []
    for (var z=0; z<depth; z++)
    for (var y=0; y<height; y++)
    for (var x=0; x<width; x++) {
        xs.push(x/width);
        ys.push(y/height);
        zs.push(z/depth);
        var value = Math.pow(Math.abs((10000 + (0.5+Math.random())*500 * (
            Math.sin(2 * 2*Math.PI*(z/depth-0.5)) +
            Math.cos(3 * 2*Math.PI*(x*x/(width*width)-0.5)) +
            Math.sin(4 * 2*Math.PI*(y*z/(height*depth)-0.5))
        )) * Math.pow(z/depth,1/3) * (1-Math.sqrt(x*x / width*width + y*y / height*height)) % 500000)/1e6, 2);
        data[z*height*width + y*width + x] = value
    }

    var opacityscale = []
    for (var i=0; i<256; i++) {
        opacityscale[i] = Math.pow(i/256, 1.2)
    }

    Plotly.newPlot(gd, [{
      type: 'volume',

      x: xs,
      y: ys,
      z: zs,

      value: data,

      cmin: 0.05,
      cmax: 0.22,

      imin: 0.05,
      imax: 0.25,

      opacity: 0.05,

      colorscale: 'Portland', opacityscale: opacityscale
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


    volumeOpts.values = trace.value;

    volumeOpts.colormap = parseColorScale(trace.colorscale);

    if(trace.opacityscale) {
        volumeOpts.alphamap = trace.opacityscale;
    }

    volumeOpts.isoBounds = [trace.cmin, trace.cmax];
    volumeOpts.intensityBounds = [
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

    this.dispose();

    var gl = this.scene.glplot.gl;
    var mesh = convert(gl, this.scene, data);
    this.mesh = mesh;
    this.mesh._trace = this;

    this.scene.glplot.add(mesh);
};

proto.dispose = function() {
    this.scene.glplot.remove(this.mesh);
    this.mesh.dispose();
};

function createVolumeTrace(scene, data) {
    var gl = scene.glplot.gl;

    var mesh = convert(gl, scene, data);

    var volume = new Volume(scene, data.uid);
    volume.mesh = mesh;
    volume.data = data;
    mesh._trace = volume;

    scene.glplot.add(mesh);

    return volume;
}

module.exports = createVolumeTrace;
