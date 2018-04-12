/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// always plot splom before cartesian (i.e. scattergl traces)
function sortModules(a, b) {
    if(a === 'splom') return -1;
    if(b === 'splom') return 1;
    return 0;
}

function sortBasePlotModules(a, b) {
    return sortModules(a.name, b.name);
}

module.exports = {
    sortBasePlotModules: sortBasePlotModules,
    sortModules: sortModules
};
