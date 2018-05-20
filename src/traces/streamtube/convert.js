/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

/*
    Usage example:

    var x = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    var y = x, z = x;
    var len = x.length * y.length * z.length;
    var u=[],v=[],w=[]; for (var i=0; i<len; i++) { u.push(1+Math.sin(i)); v.push(Math.cos(i)); w.push(Math.sin(i*0.3)*0.3); }
    var cx=[],cy=[],cz=[]; for (var i=0; i<7; i++) for(var j=0; j<7; j++) { cx.push(-5); cy.push(i-3); cz.push(j-3); }

    Plotly.newPlot(gd, [{
      type: 'streamtube',
      cx, cy, cz,
      u, v, w,
      x, y, z,
      bounds: [[-5, -5, -5], [5, 5, 5]], 
      widthScale: 100, 
      colormap:'portland'
    }], {
      scene: {
        xaxis: {range: [-5, 5]},
        yaxis: {range: [-5, 5]},
        zaxis: {range: [-5, 5]}
      }
    })

*/



'use strict';

var tube2mesh = require('gl-streamtube3d');
var createMesh = tube2mesh.createTubeMesh;

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

    function min(a) {
        var result = a[0];
        for (var i=1; i<a.length; i++) {
            if (a[i] < result) {
                result = a[i];
            }
        }
        return result;
    }

    function max(a) {
        var result = a[0];
        for (var i=1; i<a.length; i++) {
            if (a[i] > result) {
                result = a[i];
            }
        }
        return result;
    }

    var params = {
        startingPositions: zip3(
            toDataCoords(layout.xaxis, trace.cx, scene.dataScale[0]),
            toDataCoords(layout.yaxis, trace.cy, scene.dataScale[1]),
            toDataCoords(layout.zaxis, trace.cz, scene.dataScale[2])
        ),
        meshgrid: [
            toDataCoords(layout.xaxis, trace.x, scene.dataScale[0]),
            toDataCoords(layout.yaxis, trace.y, scene.dataScale[1]),
            toDataCoords(layout.zaxis, trace.z, scene.dataScale[2])
        ],
        vectors: zip3(
            toDataCoords(layout.xaxis, trace.u, scene.dataScale[0]),
            toDataCoords(layout.yaxis, trace.v, scene.dataScale[1]),
            toDataCoords(layout.zaxis, trace.w, scene.dataScale[2])
        ),
        colormap: trace.colormap,
        maxLength: trace.maxLength,
        widthScale: trace.widthScale
    };

    var bounds = trace.bounds || [
        [min(trace.x.concat(trace.cx)), min(trace.y.concat(trace.cy)), min(trace.z.concat(trace.cz))], 
        [max(trace.x.concat(trace.cx)), max(trace.y.concat(trace.cy)), max(trace.z.concat(trace.cz))]
    ];

    bounds = [
        [
            layout.xaxis.d2l(bounds[0][0]) * scene.dataScale[0],
            layout.yaxis.d2l(bounds[0][1]) * scene.dataScale[1],
            layout.zaxis.d2l(bounds[0][2]) * scene.dataScale[2]
        ],
        [
            layout.xaxis.d2l(bounds[1][0]) * scene.dataScale[0],
            layout.yaxis.d2l(bounds[1][1]) * scene.dataScale[1],
            layout.zaxis.d2l(bounds[1][2]) * scene.dataScale[2]
        ],
    ];

    var meshData = tube2mesh(
        params,
        bounds
    );

    return meshData;
};

proto.update = function(trace) {
    var meshData = convert(trace);
    this.mesh.update(meshData);
};

proto.dispose = function() {
    this.scene.glplot.remove(this.mesh);
    this.mesh.dispose();
};

function createMesh3DTrace(scene, trace) {
    var gl = scene.glplot.gl;
    var meshData = convert(scene, trace);
    var mesh = createMesh(gl, meshData);
    var result = new Mesh3DTrace(scene, mesh, trace.uid);
    result.data = {hoverinfo: 'skip'};

    mesh._trace = result;
    scene.glplot.add(mesh);

    return result;
}

module.exports = createMesh3DTrace;
