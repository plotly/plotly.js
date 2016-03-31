/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');


module.exports = function getUpdateObject(axisLayout, buttonLayout) {
    var update;

    if(buttonLayout.step === 'all') {
        update = {
            'xaxis.autorange': true
        };
    }
    else {
        var xrange = getXRange(axisLayout, buttonLayout);

        update = {
            'xaxis.range[0]': xrange[0],
            'xaxis.range[1]': xrange[1]
        };
    }

    return update;
};

function getXRange(axisLayout, buttonLayout) {
    var currentRange = axisLayout.range;
    var base = new Date(currentRange[1]);

    var range0, range1;

    switch(buttonLayout.stepmode) {
        case 'backward':
            range1 = currentRange[1];
            range0 = d3.time[buttonLayout.step]
                .offset(base, -buttonLayout.count).getTime();
            break;

        case 'to date':
            range1 = currentRange[1];
            range0 = d3.time[buttonLayout.step]
                .floor(base).getTime();
            break;
    }

    return [range0, range1];
}
