/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var conePlot = require('gl-cone3d');
var simpleMap = require('../../lib').simpleMap;
var parseColorScale = require('../../lib/gl_format_color').parseColorScale;

function zip3(x, y, z) {
    var result = new Array(x.length);
    for(var i = 0; i < x.length; i++) {
        result[i] = [x[i], y[i], z[i]];
    }
    return result;
}

var axisName2scaleIndex = {xaxis: 0, yaxis: 1, zaxis: 2};
var sizeMode2sizeKey = {scaled: 'coneSize', absolute: 'absoluteConeSize'};

exports.cone2mesh = function cone2mesh(trace, sceneLayout, dataScale) {
    var coneOpts = {};
    var toDataCoords;

    if(Array.isArray(dataScale)) {
        toDataCoords = function(arr, axisName) {
            var ax = sceneLayout[axisName];
            var scale = dataScale[axisName2scaleIndex[axisName]];
            return simpleMap(arr, function(v) { return ax.d2l(v) * scale; });
        };
    } else {
        toDataCoords = function(arr, axisName) {
            return simpleMap(arr, sceneLayout[axisName].d2l);
        };
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

    if(trace.vx && trace.vy && trace.vz) {
        coneOpts.meshgrid = [
            toDataCoords(trace.vx, 'xaxis'),
            toDataCoords(trace.vy, 'yaxis'),
            toDataCoords(trace.vz, 'zaxis')
        ];
    }

    coneOpts.colormap = parseColorScale(trace.colorscale);
    coneOpts.vertexIntensityBounds = [trace.cmin, trace.cmax];

    coneOpts[sizeMode2sizeKey[trace.sizemode]] = trace.sizeref;

    return conePlot(coneOpts);
};
