/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


/**
 * Compute the positive and negative error bar magnitudes.
 *
 * N.B. This function does not clean the dataPt entries, non-numeric
 * entries result in undefined *error*
 *
 * @param {numeric} dataPt data point from where to compute the error magnitue
 * @param {number} index index of dataPt in its corresponding data array
 * @param {object} opts error bar attributes
 *
 * @return {array of two numbers}
 *      - error[0] : error magnitude in the negative direction
 *      - error[1] : " " " " positive "
 */
module.exports = function computeError(dataPt, index, opts) {
    var type = opts.type,
        error = new Array(2);

    if(type === 'data') {
        error[1] = +(opts.array[index]);
        error[0] = (opts.symmetric || opts.arrayminus === undefined) ?
            error[1] :
            +(opts.arrayminus[index]);
    }
    else {
        error[1] = getErrorVal(type, dataPt, opts.value);
        error[0] = (opts.symmetric || opts.valueminus === undefined) ?
            error[1] :
            getErrorVal(type, dataPt, opts.valueminus);
    }


    return error;
};

// size the error bar itself (for all types except data)
function getErrorVal(type, dataPt, value) {
    if(type === 'percent') return Math.abs(dataPt * value / 100);
    if(type === 'constant') return Math.abs(value);
    if(type === 'sqrt') return Math.sqrt(Math.abs(dataPt));
}
