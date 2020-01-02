/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

exports.getDimIndex = function getDimIndex(trace, ax) {
    var axId = ax._id;
    var axLetter = axId.charAt(0);
    var ind = {x: 0, y: 1}[axLetter];
    var visibleDims = trace._visibleDims;

    for(var k = 0; k < visibleDims.length; k++) {
        var i = visibleDims[k];
        if(trace._diag[i][ind] === axId) return k;
    }
    return false;
};
