/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

function calculateAxisErrors(data, params, scaleFactor) {
    if(!params || !params.visible) return null;

    function option(name, value) {
        if(name in params) return params[name];
        return value;
    }

    var result = new Array(data.length),
        type = option('type', 'percent'),
        symmetric = option('symmetric', true),
        value = +option('value', 10),
        minusValue = +option('valueminus', 10),
        error = option('array', null),
        minusError = option('arrayminus', null);

    if(symmetric) {
        minusValue = value;
        minusError = error;
    }

    if(type === 'data' && (!error || !minusError)) return null;

    for(var i = 0; i < data.length; i++) {
        var x = +data[i];

        switch(type) {
            case 'percent':
                result[i] = [
                    -Math.abs(x) * (minusValue / 100.0) * scaleFactor,
                    Math.abs(x) * (value / 100.0) * scaleFactor
                ];
                break;

            case 'constant':
                result[i] = [
                    -minusValue * scaleFactor,
                    value * scaleFactor
                ];
                break;

            case 'sqrt':
                var r = Math.sqrt(Math.abs(x)) * scaleFactor;
                result[i] = [-r, r];
                break;

            case 'data':
                result[i] = [
                    -(+minusError[i]) * scaleFactor,
                    (+error[i]) * scaleFactor
                ];
                break;
        }
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
