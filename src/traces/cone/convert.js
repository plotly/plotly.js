/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createScatterPlot = require('gl-scatter3d');
var conePlot = require('gl-cone3d');
var createConeMesh = require('gl-cone3d').createConeMesh;

var simpleMap = require('../../lib').simpleMap;
var parseColorScale = require('../../lib/gl_format_color').parseColorScale;

function Cone(scene, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = null;
    this.pts = null;
    this.data = null;
}

var proto = Cone.prototype;

proto.handlePick = function(selection) {
    if(selection.object === this.pts) {
        var selectIndex = selection.index = selection.data.index;
        var xx = this.data.x[selectIndex];
        var yy = this.data.y[selectIndex];
        var zz = this.data.z[selectIndex];
        var uu = this.data.u[selectIndex];
        var vv = this.data.v[selectIndex];
        var ww = this.data.w[selectIndex];

        selection.traceCoordinate = [
            xx, yy, zz,
            uu, vv, ww,
            Math.sqrt(uu * uu + vv * vv + ww * ww)
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

function zip3(x, y, z) {
    var result = new Array(x.length);
    for(var i = 0; i < x.length; i++) {
        result[i] = [x[i], y[i], z[i]];
    }
    return result;
}

var axisName2scaleIndex = {xaxis: 0, yaxis: 1, zaxis: 2};
var sizeMode2sizeKey = {scaled: 'coneSize', absolute: 'absoluteConeSize'};
var anchor2coneOffset = {tip: 1, tail: 0, cm: 0.25, center: 0.5};

function convert(scene, trace) {
    var sceneLayout = scene.fullSceneLayout;
    var dataScale = scene.dataScale;
    var coneOpts = {};

    function toDataCoords(arr, axisName) {
        var ax = sceneLayout[axisName];
        var scale = dataScale[axisName2scaleIndex[axisName]];
        return simpleMap(arr, function(v) { return ax.d2l(v) * scale; });
    }

    coneOpts.vectors = zip3(
        toDataCoords(trace.u, 'xaxis'),
        toDataCoords(trace.v, 'yaxis'),
        toDataCoords(trace.w, 'zaxis')
    );

    coneOpts.positions = zip3(
        toDataCoords(trace.x, 'xaxis'),
        toDataCoords(trace.y, 'yaxis'),
        toDataCoords(trace.z, 'zaxis')
    );

    coneOpts.colormap = parseColorScale(trace.colorscale);
    coneOpts.vertexIntensityBounds = [trace.cmin / trace._normMax, trace.cmax / trace._normMax];

    coneOpts[sizeMode2sizeKey[trace.sizemode]] = trace.sizeref;
    coneOpts.coneOffset = anchor2coneOffset[trace.anchor];

    var meshData = conePlot(coneOpts);

    // stash positions for gl-scatter3d 'hover' trace
    meshData._pts = coneOpts.positions;

    return meshData;
}

proto.update = function(data) {
    this.data = data;

    var meshData = convert(this.scene, data);

    this.mesh.update(meshData);
    this.pts.update({position: meshData._pts});
};

proto.dispose = function() {
    this.scene.glplot.remove(this.pts);
    this.pts.dispose();
    this.scene.glplot.remove(this.mesh);
    this.mesh.dispose();
};

function createConeTrace(scene, data) {
    var gl = scene.glplot.gl;

    var meshData = convert(scene, data);
    var mesh = createConeMesh(gl, meshData);

    var pts = createScatterPlot({
        gl: gl,
        position: meshData._pts,
        project: false,
        opacity: 0
    });

    var cone = new Cone(scene, data.uid);
    cone.mesh = mesh;
    cone.pts = pts;
    cone.data = data;
    mesh._trace = cone;
    pts._trace = cone;

    scene.glplot.add(pts);
    scene.glplot.add(mesh);

    return cone;
}

module.exports = createConeTrace;
