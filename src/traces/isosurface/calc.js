/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorscaleCalc = require('../../components/colorscale/calc');

module.exports = function calc(gd, trace) {

    function findMin(arr) {
        var min = Infinity;
        var len = arr.length;
        for(var q = 0; q < len; q++) {
            if(min > arr[q]) {
                min = arr[q];
            }
        }
        return min;
    }

    function findMax(arr) {
        var max = -Infinity;
        var len = arr.length;
        for(var q = 0; q < len; q++) {
            if(max < arr[q]) {
                max = arr[q];
            }
        }
        return max;
    }

    var vMin = trace.isomin;
    var vMax = trace.isomax;
    if(vMin === undefined) vMin = findMin(trace.value);
    if(vMax === undefined) vMax = findMax(trace.value);

    colorscaleCalc(gd, trace, {
        vals: [vMin, vMax],
        containerStr: '',
        cLetter: 'c'
    });
};
