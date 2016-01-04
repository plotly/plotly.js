/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var makeComputeError = require('../../components/errorbars/compute_error');


function calculateAxisErrors(data, params, scaleFactor) {
    if(!params || !params.visible) return null;

    var computeError = makeComputeError(params);
    var result = new Array(data.length);

    for(var i = 0; i < data.length; i++) {
        var errors = computeError(+data[i], i);

        result[i] = [
            -errors[0] * scaleFactor,
            errors[1] * scaleFactor
        ];
    }

    return result;
}

function dataLength(array) {
    for(var i = 0; i < array.length; i++) {
        if(array[i]) return array[i].length;
    }
    return 0;
}

function calculateErrors(data, scaleFactor) {
    var errors = [
        calculateAxisErrors(data.x, data.error_x, scaleFactor[0]),
        calculateAxisErrors(data.y, data.error_y, scaleFactor[1]),
        calculateAxisErrors(data.z, data.error_z, scaleFactor[2])
    ];

    var n = dataLength(errors);
    if(n === 0) return null;

    var errorBounds = new Array(n);

    for(var i = 0; i < n; i++) {
        var bound = [[0,0,0], [0,0,0]];

        for(var j = 0; j < 3; j++) {
            if(errors[j]) {
                for(var k = 0; k < 2; k++) {
                    bound[k][j] = errors[j][i][k];
                }
            }
        }

        errorBounds[i] = bound;
    }

    return errorBounds;
}

module.exports = calculateErrors;
