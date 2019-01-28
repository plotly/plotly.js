/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var findNearestOnAxis = function(w, arr) {
    for(var q = arr.length - 1; q > 0; q--) {
        var min = Math.min(arr[q], arr[q - 1]);
        var max = Math.max(arr[q], arr[q - 1]);
        if(max > min && min < w && w <= max) {
            return {
                id: q,
                distRatio: (max - w) / (max - min)
            };
        }
    }
    return {
        id: 0,
        distRatio: 0
    };
};

module.exports = findNearestOnAxis;
