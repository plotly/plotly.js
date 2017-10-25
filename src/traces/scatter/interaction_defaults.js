/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var isNumeric = require('fast-isnumeric');

module.exports = function supplyInteractionDefaults (traceIn, traceOut, coerce) {

    function coerceInteractionDefault(attr, containsNumbers) {
        var i, arr;

        if (!Array.isArray(traceIn[attr])) {
            return;
        }
        coerce(attr);

        arr = traceOut[attr];

        console.log('arr:', arr);

        if (containsNumbers) {
            for (i = arr.length - 1; i >= 0; i--) {
                if (!isNumeric(arr[i])) {
                    arr.splice(i, 1);
                } else {
                    arr[i] = +arr[i];
                }
            }
        } else { // only other implemented is integer:
            for (i = arr.length - 1; i >= 0; i--) {
                if (!arr[i]) {
                    arr.splice(i, 1);
                } else {
                    arr[i] = String(arr[i]);
                }
            }
        }

        if (arr.length === 0) {
            delete traceOut[attr];
        }
    }

    coerceInteractionDefault('selectedpoints', true);
    coerceInteractionDefault('selectedids');
    coerceInteractionDefault('hoverpoints', true);
    coerceInteractionDefault('hoverids');
};
