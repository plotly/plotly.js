/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

function getAxId(ax) {
    return ax._id;
}

// in v2 (once log ranges are fixed),
// we'll be able to p2r here for all axis types
function p2r(ax, v) {
    switch(ax.type) {
        case 'log':
            return ax.p2d(v);
        case 'date':
            return ax.p2r(v, 0, ax.calendar);
        default:
            return ax.p2r(v);
    }
}

function axValue(ax) {
    var index = (ax._id.charAt(0) === 'y') ? 1 : 0;
    return function(v) { return p2r(ax, v[index]); };
}

function getTransform(plotinfo) {
    return 'translate(' +
        plotinfo.xaxis._offset + ',' +
        plotinfo.yaxis._offset + ')';
}

module.exports = {
    getAxId: getAxId,
    p2r: p2r,
    axValue: axValue,
    getTransform: getTransform
};
