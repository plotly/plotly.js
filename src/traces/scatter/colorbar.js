/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Plots = require('../../plots/plots');
var Colorscale = require('../../components/colorscale');
var drawColorbar = require('../../components/colorbar/draw');


module.exports = function colorbar(gd, cd) {
    var trace = cd[0].trace,
        marker = trace.marker,
        cbId = 'cb' + trace.uid;

    gd._fullLayout._infolayer.selectAll('.' + cbId).remove();

    // TODO unify scatter and heatmap colorbar
    // TODO make Colorbar.draw support multiple colorbar per trace

    if((marker === undefined) || !marker.showscale) {
        Plots.autoMargin(gd, cbId);
        return;
    }

    var vals = marker.color,
        cmin = marker.cmin,
        cmax = marker.cmax;

    if(!isNumeric(cmin)) cmin = Lib.aggNums(Math.min, null, vals);
    if(!isNumeric(cmax)) cmax = Lib.aggNums(Math.max, null, vals);

    var cb = cd[0].t.cb = drawColorbar(gd, cbId);
    var sclFunc = Colorscale.makeColorScaleFunc(
        Colorscale.extractScale(
            marker.colorscale,
            cmin,
            cmax
        ),
        { noNumericCheck: true }
    );

    cb.fillcolor(sclFunc)
        .filllevels({start: cmin, end: cmax, size: (cmax - cmin) / 254})
        .options(marker.colorbar)();
};
