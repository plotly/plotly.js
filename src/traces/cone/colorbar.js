/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Colorscale = require('../../components/colorscale');
var drawColorbar = require('../../components/colorbar/draw');

module.exports = function colorbar(gd, cd) {
    var trace = cd[0].trace;
    var cbId = 'cb' + trace.uid;
    var cmin = trace.cmin;
    var cmax = trace.cmax;

    gd._fullLayout._infolayer.selectAll('.' + cbId).remove();

    if(!trace.showscale) return;

    var cb = cd[0].t.cb = drawColorbar(gd, cbId);
    var sclFunc = Colorscale.makeColorScaleFunc(
        Colorscale.extractScale(trace.colorscale, cmin, cmax),
        {noNumericCheck: true}
    );

    cb.fillcolor(sclFunc)
        .filllevels({start: cmin, end: cmax, size: (cmax - cmin) / 254})
        .options(trace.colorbar)();
};
