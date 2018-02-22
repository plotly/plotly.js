/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');

module.exports = function style(gd, cd) {
    var s = cd ? cd[0].node3 : d3.select(gd).selectAll('g.trace.boxes');

    s.style('opacity', function(d) { return d[0].trace.opacity; });

    s.each(function(d) {
        var el = d3.select(this);
        var trace = d[0].trace;
        var lineWidth = trace.line.width;

        el.selectAll('path.box')
            .style('stroke-width', lineWidth + 'px')
            .call(Color.stroke, trace.line.color)
            .call(Color.fill, trace.fillcolor);

        el.selectAll('path.mean')
            .style({
                'stroke-width': lineWidth,
                'stroke-dasharray': (2 * lineWidth) + 'px,' + lineWidth + 'px'
            })
            .call(Color.stroke, trace.line.color);

        var pts = el.selectAll('path.point');
        Drawing.pointStyle(pts, trace, gd);
        Drawing.selectedPointStyle(pts, trace);
    });
};
