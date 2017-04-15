/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var hasColumns = require('./has_columns');
var convertColumnData = require('../heatmap/convert_column_xyz');

module.exports = function handleXYDefaults(traceIn, traceOut, coerce) {
    var cols = [];
    var x = coerce('x');

    var needsXTransform = x && !hasColumns(x);
    if(needsXTransform) cols.push('x');

    traceOut._cheater = !x;

    var y = coerce('y');

    var needsYTransform = y && !hasColumns(y);
    if(needsYTransform) cols.push('y');

    if(!x && !y) return;

    if(cols.length) {
        convertColumnData(traceOut, traceOut.aaxis, traceOut.baxis, 'a', 'b', cols);
    }

    return true;
};
