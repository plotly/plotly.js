/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var alignPeriod = require('./align_period');

module.exports = function instanceOrPeriod(d, trace, axLetter) {
    var ins = [
        d[axLetter + 'LabelVal']
    ];
    if(trace[axLetter + 'period']) {
        var ax = d[axLetter + 'a'];
        var mockTrace = {};
        mockTrace[axLetter + 'period'] = trace[axLetter + 'period'];
        mockTrace[axLetter + 'period0'] = trace[axLetter + 'period0'];
        var alignment = axLetter + 'periodalignment';

        mockTrace[alignment] = 'start';
        var startTime = alignPeriod(mockTrace, ax, axLetter, ins)[0];

        mockTrace[alignment] = 'end';
        var endTime = alignPeriod(mockTrace, ax, axLetter, ins)[0];

        return [startTime, endTime]; // period: two items
    }
    return ins; // instance: one item
};
