/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Registry = require('../../registry');

module.exports = function calc(gd) {
    var calcdata = gd.calcdata;

    for(var i = 0; i < calcdata.length; i++) {
        var cd = calcdata[i];
        var trace = cd[0].trace;

        if(!trace.hoverlabel) continue;

        var mergeFn = Registry.traceIs(trace, '2dMap') ? paste : Lib.mergeArray;

        mergeFn(trace.hoverlabel.bgcolor, cd, 'hbg');
        mergeFn(trace.hoverlabel.bordercolor, cd, 'hbc');
        mergeFn(trace.hoverlabel.font.size, cd, 'hts');
        mergeFn(trace.hoverlabel.font.color, cd, 'htc');
        mergeFn(trace.hoverlabel.font.family, cd, 'htf');
    }
};

function paste(traceAttr, cd, cdAttr) {
    if(Array.isArray(traceAttr)) {
        cd[0][cdAttr] = traceAttr;
    }
}
