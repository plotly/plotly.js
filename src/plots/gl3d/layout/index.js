/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../../plotly');
var attributes = require('./attributes');

var axesNames = ['xaxis', 'yaxis', 'zaxis'];
var noop = function () {};

Plotly.Plots.registerSubplot('gl3d', 'scene', 'scene', attributes);

exports.layoutAttributes = require('./layout_attributes');

exports.supplyLayoutDefaults = require('./defaults');

// clean scene ids, 'scene1' -> 'scene'
exports.cleanId = function cleanId(id) {
    if (!id.match(/^scene[0-9]*$/)) return;

    var sceneNum = id.substr(5);
    if (sceneNum === '1') sceneNum = '';

    return 'scene' + sceneNum;
};

exports.setConvert = function(containerOut) {
    Plotly.Axes.setConvert(containerOut);
    containerOut.setScale = noop;
};

exports.initAxes = function (td) {
    var fullLayout = td._fullLayout;

    // until they play better together
    delete fullLayout.xaxis;
    delete fullLayout.yaxis;

    var sceneIds = Plotly.Plots.getSubplotIds(fullLayout, 'gl3d');

    for (var i = 0; i < sceneIds.length; ++i) {
        var sceneId = sceneIds[i];
        var sceneLayout = fullLayout[sceneId];
        for (var j = 0; j < 3; ++j) {
            var axisName = axesNames[j];
            var ax = sceneLayout[axisName];
            ax._td = td;
        }
    }
};
