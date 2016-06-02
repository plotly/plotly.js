/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plots = require('../plots');
var Lib = require('../../lib');

var constants = require('./constants');


// convert between axis names (xaxis, xaxis2, etc, elements of gd.layout)
// and axis id's (x, x2, etc). Would probably have ditched 'xaxis'
// completely in favor of just 'x' if it weren't ingrained in the API etc.
exports.id2name = function id2name(id) {
    if(typeof id !== 'string' || !id.match(constants.AX_ID_PATTERN)) return;
    var axNum = id.substr(1);
    if(axNum === '1') axNum = '';
    return id.charAt(0) + 'axis' + axNum;
};

exports.name2id = function name2id(name) {
    if(!name.match(constants.AX_NAME_PATTERN)) return;
    var axNum = name.substr(5);
    if(axNum === '1') axNum = '';
    return name.charAt(0) + axNum;
};

exports.cleanId = function cleanId(id, axLetter) {
    if(!id.match(constants.AX_ID_PATTERN)) return;
    if(axLetter && id.charAt(0) !== axLetter) return;

    var axNum = id.substr(1).replace(/^0+/, '');
    if(axNum === '1') axNum = '';
    return id.charAt(0) + axNum;
};

// get all axis object names
// optionally restricted to only x or y or z by string axLetter
// and optionally 2D axes only, not those inside 3D scenes
function listNames(gd, axLetter, only2d) {
    var fullLayout = gd._fullLayout;
    if(!fullLayout) return [];

    function filterAxis(obj, extra) {
        var keys = Object.keys(obj),
            axMatch = /^[xyz]axis[0-9]*/,
            out = [];

        for(var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if(axLetter && k.charAt(0) !== axLetter) continue;
            if(axMatch.test(k)) out.push(extra + k);
        }

        return out.sort();
    }

    var names = filterAxis(fullLayout, '');
    if(only2d) return names;

    var sceneIds3D = Plots.getSubplotIds(fullLayout, 'gl3d') || [];
    for(var i = 0; i < sceneIds3D.length; i++) {
        var sceneId = sceneIds3D[i];
        names = names.concat(
            filterAxis(fullLayout[sceneId], sceneId + '.')
        );
    }

    return names;
}

// get all axis objects, as restricted in listNames
exports.list = function(gd, axletter, only2d) {
    return listNames(gd, axletter, only2d)
        .map(function(axName) {
            return Lib.nestedProperty(gd._fullLayout, axName).get();
        });
};

// get all axis ids, optionally restricted by letter
// this only makes sense for 2d axes
exports.listIds = function(gd, axletter) {
    return listNames(gd, axletter, true).map(exports.name2id);
};

// get an axis object from its id 'x','x2' etc
// optionally, id can be a subplot (ie 'x2y3') and type gets x or y from it
exports.getFromId = function(gd, id, type) {
    var fullLayout = gd._fullLayout;

    if(type === 'x') id = id.replace(/y[0-9]*/, '');
    else if(type === 'y') id = id.replace(/x[0-9]*/, '');

    return fullLayout[exports.id2name(id)];
};

// get an axis object of specified type from the containing trace
exports.getFromTrace = function(gd, fullTrace, type) {
    var fullLayout = gd._fullLayout;
    var ax = null;

    if(Plots.traceIs(fullTrace, 'gl3d')) {
        var scene = fullTrace.scene;
        if(scene.substr(0, 5) === 'scene') {
            ax = fullLayout[scene][type + 'axis'];
        }
    }
    else {
        ax = exports.getFromId(gd, fullTrace[type + 'axis'] || type);
    }

    return ax;
};
