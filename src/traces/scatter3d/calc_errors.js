/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

function calculateAxisErrors(data, params) {
    if(!params || !params.visible) {
        return null;
    }

    function option(name, value) {
        if(name in params) {
            return params[name];
        }
        return value;
    }

    var result      = new Array(data.length);
    var type        = option('type', 'percent');
    var symmetric   = option('symmetric', true);
    var value       = +option('value', 10);
    var minusValue  = +option('valueminus', 10);
    var error       = option('array', null);
    var minusError  = option('arrayminus', null);
    var x, h, l, r, i;

    if(symmetric) {
        minusValue = value;
        minusError = error;
    }

    if(type === 'data' && (!error || !minusError)) {
        return null;
    }

    for(i=0; i<data.length; ++i) {
        x = +data[i];
        switch(type) {
        case 'percent':
            h = Math.abs(x) * value / 100.0;
            l = Math.abs(x) * minusValue / 100.0;
            result[i] = [ -l, h ];
            break;

        case 'constant':
            result[i] = [ -minusValue, value ];
            break;

        case 'sqrt':
            r = Math.sqrt(Math.abs(x));
            result[i] = [ -r, r ];
            break;

        case 'data':
            result[i] = [ (+minusError[i]) - x, (+error[i]) - x ];
            break;
        }
    }

    return result;
}

function dataLength(array) {
    for(var i=0; i<array.length; ++i) {
        if(array[i]) {
            return array[i].length;
        }
    }
    return 0;
}

function calculateErrors(data) {
    var errors = [
        calculateAxisErrors(data.x, data.error_x),
        calculateAxisErrors(data.y, data.error_y),
        calculateAxisErrors(data.z, data.error_z) ],
        errorBounds,
        n = dataLength(errors),
        i, j, k, bound;
    if(n === 0) {
        return null;
    }
    errorBounds = new Array(n);
    for(i=0; i<n; ++i) {
        bound = [[0,0,0],[0,0,0]];
        for(j=0; j<3; ++j) {
            if(errors[j]) {
                for(k=0; k<2; ++k) {
                    bound[k][j] = errors[j][i][k];
                }
            }
        }
        errorBounds[i] = bound;
    }
    return errorBounds;
}

module.exports = calculateErrors;
