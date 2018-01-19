/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');
var COMPARISON_OPS2 = require('../../constants/filter_ops').COMPARISON_OPS2;

module.exports = function(coerce, contours) {
    var zvalue;

    if(COMPARISON_OPS2.indexOf(contours.operation) === -1) {
        // Requires an array of two numbers:
        coerce('contours.value', [0, 1]);

        if(!Array.isArray(contours.value)) {
            if(isNumeric(contours.value)) {
                zvalue = parseFloat(contours.value);
                contours.value = [zvalue, zvalue + 1];
            }
        } else if(contours.value.length > 2) {
            contours.value = contours.value.slice(2);
        } else if(contours.length === 0) {
            contours.value = [0, 1];
        } else if(contours.length < 2) {
            zvalue = parseFloat(contours.value[0]);
            contours.value = [zvalue, zvalue + 1];
        } else {
            contours.value = [
                parseFloat(contours.value[0]),
                parseFloat(contours.value[1])
            ];
        }
    } else {
        // Requires a single scalar:
        coerce('contours.value', 0);

        if(!isNumeric(contours.value)) {
            if(Array.isArray(contours.value)) {
                contours.value = parseFloat(contours.value[0]);
            } else {
                contours.value = 0;
            }
        }
    }
};
