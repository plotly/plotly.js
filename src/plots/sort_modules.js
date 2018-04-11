/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

function sortBasePlotModules(a, b) {
    var nameA = a.name;
    var nameB = b.name;

    // always plot splom before cartesian (i.e. scattergl traces)
    if(nameB === 'splom' && nameA === 'cartesian') {
        return 1;
    }
    return 0;
}

function sortModules(a, b) {
    // always plot splom before scattergl traces
    if(b === 'splom' && a === 'scattergl') {
        return 1;
    }
    return 0;
}

module.exports = {
    sortBasePlotModules: sortBasePlotModules,
    sortModules: sortModules
};
