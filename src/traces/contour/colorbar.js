/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plots = require('../../plots/plots');
var drawColorbar = require('../../components/colorbar/draw');

var makeColorMap = require('./make_color_map');
var endPlus = require('./end_plus');


module.exports = function colorbar(gd, cd) {
    var trace = cd[0].trace,
        cbId = 'cb' + trace.uid;

    gd._fullLayout._infolayer.selectAll('.' + cbId).remove();

    if(!trace.showscale) {
        Plots.autoMargin(gd, cbId);
        return;
    }

    var cb = drawColorbar(gd, cbId);
    cd[0].t.cb = cb;

    var contours = trace.contours,
        line = trace.line,
        cs = contours.size || 1,
        coloring = contours.coloring;

    var colorMap = makeColorMap(trace, {isColorbar: true});

    if(coloring === 'heatmap') {
        cb.filllevels({
            start: trace.zmin,
            end: trace.zmax,
            size: (trace.zmax - trace.zmin) / 254
        });
    }

    cb.fillcolor((coloring === 'fill' || coloring === 'heatmap') ? colorMap : '')
        .line({
            color: coloring === 'lines' ? colorMap : line.color,
            width: contours.showlines !== false ? line.width : 0,
            dash: line.dash
        })
        .levels({
            start: contours.start,
            end: endPlus(contours),
            size: cs
        })
        .options(trace.colorbar)();
};
