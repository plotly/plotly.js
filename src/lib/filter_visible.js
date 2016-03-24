/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function filterVisible(dataIn) {
    var dataOut = [];

    for(var i = 0; i < dataIn.length; i++) {
        var trace = dataIn[i];

        if(trace.visible === true) dataOut.push(trace);
    }

    return dataOut;
};
