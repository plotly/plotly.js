/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createMesh = require('gl-cone3d').createConeMesh;
var cone2mesh = require('./helpers').cone2mesh;

function Mesh3DTrace(scene, mesh, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = mesh;
    this.data = null;
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

function convert(scene, trace) {
    return cone2mesh(trace, scene.fullSceneLayout, scene.dataScale);
}

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
