/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// var Lib = require('../../lib');

// var isNumeric = require('fast-isnumeric');

var hasColumns = require('./has_columns');


module.exports = function handleABDefaults(traceIn, traceOut, coerce) {
    var a = coerce('a');

    if (!a) {
        coerce('da');
        coerce('a0');
    }

    var b = coerce('b');

    if (!b) {
        coerce('db');
        coerce('b0');
    }

    return;
};
