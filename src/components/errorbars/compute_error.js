/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


/**
 * Error bar computing function generator
 *
 * N.B. This function does not clean the dataPt entries, non-numeric
 * entries result in undefined *error*
 *
 * @param {object} opts error bar attributes
 *
 * @return {function} :
 *      @param {numeric} dataVal error magnitude in the negative direction
 *      @param {number} index index of dataPt in its corresponding data array
 *      @return {array}
 *        - error[0] : error magnitude in the negative direction
 *        - error[1] : " " " " positive "
 */
module.exports = function makeComputeError(opts) {
    var type = opts.type,
        symmetric = opts.symmetric;

    if(type === 'data') {
        var array = opts.array,
            arrayminus = opts.arrayminus;

        return (symmetric || arrayminus === undefined) ?
            function computeError(dataPt, index) {
                var val = +(array[index]);
                return [val, val];
            } :
            function computeError(dataPt, index) {
                return [+arrayminus[index], +array[index]];
            };
    }
    else {
        var value = opts.value,
            valueminus = opts.valueminus;

        return (symmetric || valueminus === undefined) ?
            function computeError(dataPt) {
                var val = getErrorVal(type, dataPt, value);
                return [val, val];
            } :
            function computeError(dataPt) {
                return [
                    getErrorVal(type, dataPt, valueminus),
                    getErrorVal(type, dataPt, value)
                ];
            };
    }
};

/**
 * Compute error bar magnitude (for all types except data)
 *
 * @param {string} type error bar type
 * @param {numeric} dataPt
 *      data point from where to compute the error magnitude
 * @param {numeric} [value] error bar value
 *
 */
function getErrorVal(type, dataPt, value) {
    if(type === 'percent') return Math.abs(dataPt * value / 100);
    if(type === 'constant') return Math.abs(value);
    if(type === 'sqrt') return Math.sqrt(Math.abs(dataPt));
}
