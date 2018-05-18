/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var subtypes = require('./subtypes');

function selectPoints(searchInfo, polygon) {
    var cd = searchInfo.cd,
        xa = searchInfo.xaxis,
        ya = searchInfo.yaxis,
        selection = [],
        trace = cd[0].trace,
        i,
        di,
        x,
        y;

    var hasOnlyLines = (!subtypes.hasMarkers(trace) && !subtypes.hasText(trace));
    if(hasOnlyLines) return [];

    if(polygon === false) { // clear selection
        _clearSelection(cd);
    }
    else {
        for(i = 0; i < cd.length; i++) {
            di = cd[i];
            x = xa.c2p(di.x);
            y = ya.c2p(di.y);

            if(polygon.contains([x, y])) {
                selection.push(_newSelectionItem(i, xa.c2d(di.x), ya.c2d(di.y)));
                di.selected = 1;
            } else {
                di.selected = 0;
            }
        }
    }

    return selection;
}

function selectPoint(calcData, hoverDataItem) {
    var selection = [];
    var selectedPointNumber = hoverDataItem.pointNumber;
    var cdItem = calcData[selectedPointNumber];

    _clearSelection(calcData);

    cdItem.selected = 1;
    selection.push(_newSelectionItem(
      selectedPointNumber,
      hoverDataItem.xaxis.c2d(cdItem.x),
      hoverDataItem.yaxis.c2d(cdItem.y)));

    return selection;
}

function _clearSelection(calcData) {
    for(var i = 0; i < calcData.length; i++) {
        calcData[i].selected = 0;
    }
}

// TODO May be needed in other trace types as well, so may centralize somewhere
function _newSelectionItem(pointNumber, xInData, yInData) {
    return {
        pointNumber: pointNumber,
        x: xInData,
        y: yInData
    };
}

module.exports = {
    selectPoints: selectPoints,
    selectPoint: selectPoint
};
