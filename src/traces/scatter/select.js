/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var subtypes = require('./subtypes');

function _togglePointSelectedState(searchInfo, pointIds, selected) {
    var selection = [];

    var calcData = searchInfo.cd,
        xAxis = searchInfo.xaxis,
        yAxis = searchInfo.yaxis;

    // TODO use foreach?!
    // Mutate state
    for(var j = 0; j < pointIds.length; j++) {
        var pointId = pointIds[j];
        calcData[pointId].selected = selected ? 1 : 0;
    }

    // Compute selection array from internal state
    for(var i = 0; i < calcData.length; i++) {
        if(calcData[i].selected === 1) {
            selection.push(_newSelectionItem(
              i,
              xAxis.c2d(calcData[i].x),
              yAxis.c2d(calcData[i].y)));
        }
    }

    return selection;
}

// TODO May be needed in other trace types as well, so may centralize somewhere
function _newSelectionItem(pointNumber, xInData, yInData) {
    return {
        pointNumber: pointNumber,
        x: xInData,
        y: yInData
    };
}

exports.getPointsIn = function(searchInfo, polygon) {
    var pointsIn = [];

    var calcData = searchInfo.cd,
        trace = calcData[0].trace,
        xAxis = searchInfo.xaxis,
        yAxis = searchInfo.yaxis,
        i,
        x, y;

    var hasOnlyLines = !subtypes.hasMarkers(trace) && !subtypes.hasText(trace);
    if(hasOnlyLines) return [];

    for(i = 0; i < calcData.length; i++) {
        x = xAxis.c2p(calcData[i].x);
        y = yAxis.c2p(calcData[i].y);

        if(polygon.contains([x, y])) {
            pointsIn.push(i);
        }
    }

    return pointsIn;
};

/**
 * Update the selected flag of the given points. Omitting which points
 * to modify will update all points of the passed trace.
 *
 * @param {object} searchInfo - info about trace to modify
 * @param {boolean} selected - are these points to be selected (true) or deselected (false)
 * @param {integer[]} pointIds - the points to modify - omit to modify all points
 *        in the trace. i.e. clearSelection is toggleSelection(searchInfo, false).
 *
 * @return {object[]} an array of all points selected after modification
 */
exports.toggleSelected = function(searchInfo, selected, pointIds) {
    if(!Array.isArray(pointIds)) {
        pointIds = [];
        for(var i = 0; i < searchInfo.cd.length; i++) {
            pointIds.push(i);
        }
    }
    return _togglePointSelectedState(searchInfo, pointIds, selected);
};
