/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var ONEAVGMONTH = require('../../constants/numerical').ONEAVGMONTH;

var M = {};
for(var n = 1; n <= 12; n++) {
    M['M' + n] = n * ONEAVGMONTH;
}

module.exports = function alignPeriod(trace, axLetter, vals) {
    var alignment = trace[axLetter + 'periodalignment'];
    if(!alignment || alignment === 'start') return vals;

    var period = trace[axLetter + 'period'];
    if(isNumeric(period)) {
        period = +period;
    } else if(typeof period === 'string') {
        period = M[period];
    }

    if(period > 0) {
        var delta = (alignment === 'end' ? 1 : 0.5) * period;
        var len = vals.length;
        for(var i = 0; i < len; i++) {
            vals[i] += delta;
        }
    }
    return vals;
};
