/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var subTypes = require('../scatter/subtypes');
var helpers = require('./helpers');

module.exports = function select(searchInfo, selectionTester) {
    var cd = searchInfo.cd;
    var trace = cd[0].trace;
    var stash = cd[0].t;
    var scene = searchInfo.scene;
    var cdata = scene.matrixOptions.cdata;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var selection = [];

    if(!scene) return selection;

    var hasOnlyLines = (!subTypes.hasMarkers(trace) && !subTypes.hasText(trace));
    if(trace.visible !== true || hasOnlyLines) return selection;

    var xi = helpers.getDimIndex(trace, xa);
    var yi = helpers.getDimIndex(trace, ya);
    if(xi === false || yi === false) return selection;

    var xpx = stash.xpx[xi];
    var ypx = stash.ypx[yi];
    var x = cdata[xi];
    var y = cdata[yi];
    var els = [];
    var unels = [];

    // degenerate polygon does not enable selection
    // filter out points by visible scatter ones
    if(selectionTester !== false && !selectionTester.degenerate) {
        for(var i = 0; i < x.length; i++) {
            if(selectionTester.contains([xpx[i], ypx[i]], null, i, searchInfo)) {
                els.push(i);
                selection.push({
                    pointNumber: i,
                    x: x[i],
                    y: y[i]
                });
            } else {
                unels.push(i);
            }
        }
    }

    var matrixOpts = scene.matrixOptions;

    if(!els.length && !unels.length) {
        scene.matrix.update(matrixOpts, null);
    } else if(!scene.selectBatch.length && !scene.unselectBatch.length) {
        scene.matrix.update(
            scene.unselectedOptions,
            Lib.extendFlat({}, matrixOpts, scene.selectedOptions, scene.viewOpts)
        );
    }

    scene.selectBatch = els;
    scene.unselectBatch = unels;

    return selection;
};
