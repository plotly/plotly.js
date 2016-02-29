/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Plots = require('../../plots/plots');
var getColorscale = require('../../components/colorscale/get_scale');
var drawColorbar = require('../../components/colorbar/draw');


module.exports = function colorbar(gd, cd) {
    var trace = cd[0].trace,
        marker = trace.marker,
        cbId = 'cb' + trace.uid;

    gd._fullLayout._infolayer.selectAll('.' + cbId).remove();

    // TODO unify Scatter.colorbar and Heatmap.colorbar
    // TODO make Plotly[module].colorbar support multiple colorbar per trace

    if((marker === undefined) || !marker.showscale) {
        Plots.autoMargin(gd, cbId);
        return;
    }

    var scl = getColorscale(marker.colorscale),
        vals = marker.color,
        cmin = marker.cmin,
        cmax = marker.cmax;

    if(!isNumeric(cmin)) cmin = Lib.aggNums(Math.min, null, vals);
    if(!isNumeric(cmax)) cmax = Lib.aggNums(Math.max, null, vals);

    var cb = cd[0].t.cb = drawColorbar(gd, cbId);

    cb.fillcolor(d3.scale.linear()
            .domain(scl.map(function(v) { return cmin + v[0] * (cmax - cmin); }))
            .range(scl.map(function(v) { return v[1]; })))
        .filllevels({start: cmin, end: cmax, size: (cmax - cmin) / 254})
        .options(marker.colorbar)();

    Lib.markTime('done colorbar');
};
