/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var drawColorbar = require('../../components/colorbar/draw');

var makeColorMap = require('./make_color_map');
var endPlus = require('./end_plus');


module.exports = function colorbar(gd, cd) {
    var trace = cd[0].trace;
    var cbId = 'cb' + trace.uid;

    gd._fullLayout._infolayer.selectAll('.' + cbId).remove();

    if(!trace.showscale) return;

    var cb = cd[0].t.cb = drawColorbar(gd, cbId);

    var contours = trace.contours;
    var line = trace.line;
    var cs = contours.size || 1;
    var coloring = contours.coloring;

    var colorMap = makeColorMap(trace, {isColorbar: true});

    cb.fillgradient(coloring === 'heatmap' ? trace.colorscale : '')
        .zrange(coloring === 'heatmap' ? [trace.zmin, trace.zmax] : '')
        .fillcolor((coloring === 'fill') ? colorMap : '')
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
