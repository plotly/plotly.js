/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var AxisIDs = require('../../plots/cartesian/axis_ids');

var calcMarkerSize = require('../scatter/calc').calcMarkerSize;
var calcAxisExpansion = require('../scatter/calc').calcAxisExpansion;
var calcColorscale = require('../scatter/colorscale_calc');
var convertMarkerSelection = require('../scattergl/convert').markerSelection;
var convertMarkerStyle = require('../scattergl/convert').markerStyle;
var sceneUpdate = require('./scene_update');

var BADNUM = require('../../constants/numerical').BADNUM;
var TOO_MANY_POINTS = require('../scattergl/constants').TOO_MANY_POINTS;

module.exports = function calc(gd, trace) {
    var dimensions = trace.dimensions;
    var commonLength = trace._length;
    var opts = {};
    // 'c' for calculated, 'l' for linear,
    // only differ here for log axes, pass ldata to createMatrix as 'data'
    var cdata = opts.cdata = [];
    var ldata = opts.data = [];
    // keep track of visible dimensions
    var visibleDims = trace._visibleDims = [];
    var i, k, dim, xa, ya;

    function makeCalcdata(ax, dim) {
        // call makeCalcdata with fake input
        var ccol = ax.makeCalcdata({
            v: dim.values,
            vcalendar: trace.calendar
        }, 'v');

        for(var j = 0; j < ccol.length; j++) {
            ccol[j] = ccol[j] === BADNUM ? NaN : ccol[j];
        }
        cdata.push(ccol);
        ldata.push(ax.type === 'log' ? Lib.simpleMap(ccol, ax.c2l) : ccol);
    }

    for(i = 0; i < dimensions.length; i++) {
        dim = dimensions[i];

        if(dim.visible) {
            xa = AxisIDs.getFromId(gd, trace._diag[i][0]);
            ya = AxisIDs.getFromId(gd, trace._diag[i][1]);

            // if corresponding x & y axes don't have matching types, skip dim
            if(xa && ya && xa.type !== ya.type) {
                Lib.log('Skipping splom dimension ' + i + ' with conflicting axis types');
                continue;
            }

            if(xa) {
                makeCalcdata(xa, dim);
                if(ya && ya.type === 'category') {
                    ya._categories = xa._categories.slice();
                }
            } else {
                // should not make it here, if both xa and ya undefined
                makeCalcdata(ya, dim);
            }

            visibleDims.push(i);
        }
    }

    calcColorscale(gd, trace);
    Lib.extendFlat(opts, convertMarkerStyle(trace));

    var visibleLength = cdata.length;
    var hasTooManyPoints = (visibleLength * commonLength) > TOO_MANY_POINTS;

    // Reuse SVG scatter axis expansion routine.
    // For graphs with very large number of points and array marker.size,
    // use average marker size instead to speed things up.
    var ppad;
    if(hasTooManyPoints) {
        ppad = 2 * (opts.sizeAvg || Math.max(opts.size, 3));
    } else {
        ppad = calcMarkerSize(trace, commonLength);
    }

    for(k = 0; k < visibleDims.length; k++) {
        i = visibleDims[k];
        dim = dimensions[i];
        xa = AxisIDs.getFromId(gd, trace._diag[i][0]) || {};
        ya = AxisIDs.getFromId(gd, trace._diag[i][1]) || {};
        calcAxisExpansion(gd, trace, xa, ya, cdata[k], cdata[k], ppad);
    }

    var scene = sceneUpdate(gd, trace);
    if(!scene.matrix) scene.matrix = true;
    scene.matrixOptions = opts;

    scene.selectedOptions = convertMarkerSelection(trace, trace.selected);
    scene.unselectedOptions = convertMarkerSelection(trace, trace.unselected);

    return [{x: false, y: false, t: {}, trace: trace}];
};
