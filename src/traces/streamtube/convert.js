/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var tube2mesh = require('gl-streamtube3d');
var createTubeMesh = tube2mesh.createTubeMesh;

var simpleMap = require('../../lib').simpleMap;
var parseColorScale = require('../../lib/gl_format_color').parseColorScale;

function Streamtube(scene, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = null;
    this.data = null;
}

var proto = Streamtube.prototype;

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

function zip3(x, y, z) {
    var result = new Array(x.length);
    for(var i = 0; i < x.length; ++i) {
        result[i] = [x[i], y[i], z[i]];
    }
    return result;
}

var axisName2scaleIndex = {xaxis: 0, yaxis: 1, zaxis: 2};

function convert(scene, trace) {
    var sceneLayout = scene.fullSceneLayout;
    var dataScale = scene.dataScale;
    var tubeOpts = {};

    function toDataCoords(arr, axisName) {
        var ax = sceneLayout[axisName];
        var scale = dataScale[axisName2scaleIndex[axisName]];
        return simpleMap(arr, function(v) { return ax.d2l(v) * scale; });
    }

    tubeOpts.vectors = zip3(
        toDataCoords(trace.u, 'xaxis'),
        toDataCoords(trace.v, 'yaxis'),
        toDataCoords(trace.w, 'zaxis')
    );

    // TODO make this optional?
    // N.B. this is a "meshgrid" but shouldn't this be the position
    // of the vector field ???
    tubeOpts.meshgrid = [
        toDataCoords(trace.x, 'xaxis'),
        toDataCoords(trace.y, 'yaxis'),
        toDataCoords(trace.z, 'zaxis')
    ];

    // TODO make this optional?
    tubeOpts.startingPositions = zip3(
        toDataCoords(trace.startx, 'xaxis'),
        toDataCoords(trace.starty, 'yaxis'),
        toDataCoords(trace.startz, 'zaxis')
    );

    tubeOpts.colormap = parseColorScale(trace.colorscale);

    // TODO
    // tubeOpts.maxLength
    // tubeOpts.widthScale

    // TODO the widhScale default looks BRUTAL
    tubeOpts.widthScale = 100;

    var xbnds = toDataCoords(trace._xbnds, 'xaxis');
    var ybnds = toDataCoords(trace._ybnds, 'yaxis');
    var zbnds = toDataCoords(trace._zbnds, 'zaxis');
    var bounds = [
        [xbnds[0], ybnds[0], zbnds[0]],
        [xbnds[1], ybnds[1], zbnds[1]]
    ];

    var meshData = tube2mesh(tubeOpts, bounds);

    // TODO cmin/cmax correspond to the min/max vector norm
    // in the u/v/w arrays, which in general is NOT equal to max
    // intensity that colors the tubes.
    //
    // Maybe we should use meshData.vertexIntensities instead to
    // determine the auto values for "cmin" and "cmax"?
    meshData.vertexIntensityBounds = [trace.cmin, trace.cmax];

    // pass gl-mesh3d lighting attributes
    meshData.lightPosition = [trace.lightposition.x, trace.lightposition.y, trace.lightposition.z];
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

function createStreamtubeTrace(scene, data) {
    var gl = scene.glplot.gl;

    var meshData = convert(scene, data);
    var mesh = createTubeMesh(gl, meshData);

    var streamtube = new Streamtube(scene, data.uid);
    streamtube.mesh = mesh;
    streamtube.data = data;
    mesh._trace = streamtube;

    scene.glplot.add(mesh);

    return streamtube;
}

module.exports = createStreamtubeTrace;
