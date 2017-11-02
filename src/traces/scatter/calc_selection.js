/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

module.exports = function calcSelection(cd, trace) {
    var selectedpoints = trace.selectedpoints;

    // TODO ids vs points??

    if(Array.isArray(selectedpoints)) {
        for(var i = 0; i < selectedpoints.length; i++) {
            var ptNumber = selectedpoints[i];

            if(isNumeric(ptNumber)) {
                cd[+ptNumber].selected = 1;
            }
        }
    }
};
