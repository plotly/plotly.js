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
        xs.push(2*x/width);
        ys.push(3*y/height);
        zs.push(z/depth);
        var value = Math.pow(Math.abs((10000 + (0.5+Math.random())*500 * (
            Math.sin(2 * 2*Math.PI*(z/depth-0.5)) +
            Math.cos(3 * 2*Math.PI*(x*x/(width*width)-0.5)) +
            Math.sin(4 * 2*Math.PI*(y*z/(height*depth)-0.5))
        )) * Math.pow(z/depth,1/3) * (1-Math.sqrt(x*x / width*width + y*y / height*height)) % 500000)/1e6, 2);
        data[z*height*width + y*width + x] = value
    }

    var opacityscale = []
    for (var i=0; i<16; i++) {
        opacityscale[i] = [i/15, Math.pow(i/15, 1.2)]
    }

    Plotly.newPlot(gd, [{
      type: 'volume',

      x: xs,
      y: ys,
      z: zs,

      values: data,

      vmin: 0.05,
      vmax: 0.22,

      cmin: 0.05,
      cmax: 0.25,

      opacity: 0.05,

      colorscale: 'Portland',
      opacityscale: opacityscale
    }])
*/
'use strict';

var volumePlot = require('gl-volume3d');

var simpleMap = require('../../lib').simpleMap;
var parseColorScale = require('../../lib/gl_format_color').parseColorScale;

var distinctVals = require('../../lib').distinctVals;

function Volume(scene, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = null;
    this.data = null;
}

var proto = Volume.prototype;

proto.handlePick = function(selection) {
    return false;
};

function parseOpacityScale(opacityScale) {
    var alphaMapLength = 256;
    var alphaMap = new Float32Array(alphaMapLength);
    var alphaMapIndex = 0;
    var previousEntry = [0, 1];
    for(var i = 0; i < opacityScale.length; i++) {
        var entry = opacityScale[i];
        var startIndex = alphaMapIndex;
        var startValue = previousEntry[1];
        var endIndex = Math.max(0, Math.min(Math.floor(entry[0] * alphaMapLength), alphaMapLength - 1));
        var endValue = entry[1];
        var indexDelta = endIndex - startIndex;
        while(alphaMapIndex < endIndex) {
            var t = (alphaMapIndex - startIndex) / indexDelta;
            alphaMap[alphaMapIndex] = (1 - t) * startValue + t * endValue;
            alphaMapIndex++;
        }
        alphaMap[alphaMapIndex] = endValue;
        previousEntry = entry;
    }
    var lastAlpha = alphaMap[alphaMapIndex];
    while(alphaMapIndex < alphaMapLength) {
        alphaMap[alphaMapIndex++] = lastAlpha;
    }
    return alphaMap;
}

var axisName2scaleIndex = {xaxis: 0, yaxis: 1, zaxis: 2};

/*
    Finds the first ascending sequence of unique coordinates in src.
    Steps through src in stride-length steps.

    Useful for creating meshgrids out of 3D volume coordinates.

    E.g.
        getSequence([1,2,3,1,2,3], 1) -> [1,2,3] // steps through the first half of the array, bails on the second 1
        getSequence([1,1,2,2,3,3,1,1,2,2,3,3], 1) -> [1,2,3] // steps through every element in the first half of the array
        getSequence([1,1,2,2,3,3,1,1,2,2,3,3], 2) -> [1,2,3] // skips every other element

        getSequence([1,1,1, 1,1,1, 1,1,1, 2,2,2, 2,2,2, 2,2,2], 9) -> [1,2] // skips from seq[0] to seq[9] to end of array
*/
function getSequence(src, stride) {
    var xs = [src[0]];
    for(var i = 0, last = xs[0]; i < src.length; i += stride) {
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

    var xs = getSequence(trace.x, 1);
    var ys = getSequence(trace.y, xs.length);
    var zs = getSequence(trace.z, xs.length * ys.length);

    volumeOpts.dimensions = [xs.length, ys.length, zs.length];
    volumeOpts.meshgrid = [
        toDataCoords(xs, 'xaxis'),
        toDataCoords(ys, 'yaxis'),
        toDataCoords(zs, 'zaxis')
    ];

    volumeOpts.values = trace.values;

    volumeOpts.colormap = parseColorScale(trace.colorscale);

    volumeOpts.opacity = trace.opacity;

    if(trace.opacityscale) {
        volumeOpts.alphamap = parseOpacityScale(trace.opacityscale);
    }

    var vmin = trace.vmin;
    var vmax = trace.vmax;

    if(vmin === undefined || vmax === undefined) {
        var minV = trace.values[0], maxV = trace.values[0];
        for(var i = 1; i < trace.values.length; i++) {
            var v = trace.values[v];
            if(v > maxV) {
                maxV = v;
            } else if(v < minV) {
                minV = v;
            }
        }
        if(vmin === undefined) {
            vmin = minV;
        }
        if(vmax === undefined) {
            vmax = maxV;
        }
    }

    volumeOpts.isoBounds = [vmin, vmax];
    volumeOpts.intensityBounds = [trace.cmin, trace.cmax];

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
