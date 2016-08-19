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
        cbId = 'cb' + trace.uid,
        scl = getColorscale(trace.colorscale),
        zmin = trace.zmin,
        zmax = trace.zmax;

    if(!isNumeric(zmin)) zmin = Lib.aggNums(Math.min, null, trace.z);
    if(!isNumeric(zmax)) zmax = Lib.aggNums(Math.max, null, trace.z);

    gd._fullLayout._infolayer.selectAll('.' + cbId).remove();

    if(!trace.showscale) {
        Plots.autoMargin(gd, cbId);
        return;
    }

    var cb = cd[0].t.cb = drawColorbar(gd, cbId);
    cb.fillcolor(d3.scale.linear()
            .domain(scl.map(function(v) { return zmin + v[0] * (zmax - zmin); }))
            .range(scl.map(function(v) { return v[1]; })))
        .filllevels({start: zmin, end: zmax, size: (zmax - zmin) / 254})
        .options(trace.colorbar)();
};
