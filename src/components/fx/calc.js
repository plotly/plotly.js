/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

module.exports = function calc(gd) {
    var calcdata = gd.calcdata;

    for(var i = 0; i < calcdata.length; i++) {
        var cd = calcdata[i];
        var trace = cd[0].trace;

        if(trace.hoverlabel) {
            Lib.mergeArray(trace.hoverlabel.bgcolor, cd, 'hbg');
            Lib.mergeArray(trace.hoverlabel.bordercolor, cd, 'hbc');
            Lib.mergeArray(trace.hoverlabel.font.size, cd, 'hts');
            Lib.mergeArray(trace.hoverlabel.font.color, cd, 'htc');
            Lib.mergeArray(trace.hoverlabel.font.family, cd, 'htf');
        }
    }
};
