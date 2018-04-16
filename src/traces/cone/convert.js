/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var cone2mesh = require('gl-cone3d');
var createMesh = cone2mesh.createConeMesh;

function Mesh3DTrace(scene, mesh, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = mesh;
    this.name = '';
    this.color = '#fff';
    this.data = null;
    this.showContour = false;
}

var proto = Mesh3DTrace.prototype;

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

function convert(scene, trace) {
    var layout = scene.fullSceneLayout;

    // Unpack position data
    function toDataCoords(axis, coord, scale) {
        return coord.map(function(x) {
            return axis.d2l(x) * scale;
        });
    }

    var meshData = cone2mesh({
        positions: zip3(
            toDataCoords(layout.xaxis, trace.cx, scene.dataScale[0]),
            toDataCoords(layout.yaxis, trace.cy, scene.dataScale[1]),
            toDataCoords(layout.zaxis, trace.cz, scene.dataScale[2])
        ),
        vectors: zip3(
            toDataCoords(layout.xaxis, trace.u, scene.dataScale[0]),
            toDataCoords(layout.yaxis, trace.v, scene.dataScale[1]),
            toDataCoords(layout.zaxis, trace.w, scene.dataScale[2])
        ),
        colormap: 'portland'
    });

    return meshData;
};

proto.update = function(data) {
    this.data = data;
    this.mesh.update(convert(this.scene, data));
};

proto.dispose = function() {
    this.scene.glplot.remove(this.mesh);
    this.mesh.dispose();
};

function createMesh3DTrace(scene, data) {
    var gl = scene.glplot.gl;
    var meshData = convert(scene, data);
    var mesh = createMesh(gl, meshData);
    var result = new Mesh3DTrace(scene, mesh, data.uid);

    result.data = data;
    mesh._trace = result;
    scene.glplot.add(mesh);

    return result;
}

module.exports = createMesh3DTrace;
