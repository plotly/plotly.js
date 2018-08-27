/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// TODO DRY
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

// TODO DRY
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
        i;

    for(i = 0; i < calcData.length; i++) {
        if(polygon.contains(calcData[i].ct)) {
            pointsIn.push(i);
        }
    }

    return pointsIn;
};

exports.toggleSelected = function(searchInfo, selected, pointIds) {
    if(!Array.isArray(pointIds)) {
        // TODO Use arrayRange maybe
        pointIds = [];
        for(var i = 0; i < searchInfo.cd.length; i++) {
            pointIds.push(i);
        }
    }
    return _togglePointSelectedState(searchInfo, pointIds, selected);
};
