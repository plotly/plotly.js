/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createScatterPlot = require('gl-scatter3d');
var createConeMesh = require('gl-cone3d').createConeMesh;
var cone2mesh = require('./helpers').cone2mesh;

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
