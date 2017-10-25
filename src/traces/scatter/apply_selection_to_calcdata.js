/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function applySelectionToCalcdata (cd) {
    var i;
    console.log('cd:', cd);

    var trace = cd[0].t;
    console.log('trace:', trace);

    var selectedpoints = trace.selectedpoints;
    var selectedids = trace.selectedids;

    if (!selectedpoints) {
        return;
    }

    var selectedPointIndex = {};
    for (i = 0; i < selectedpoints.length; i++) {
        selectedPointIndex[selectedpoints[i]] = true;
    }

    for (i = 0; i < cd.length; i++) {
        var pt = cd[i];

        if (!selectedpoints) {
            delete pt.selected;
        } else {
            pt.selected = !!selectedPointIndex[i];
        }
    }

}
