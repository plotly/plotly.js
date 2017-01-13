/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Color = require('../../components/color');
var Drawing = require('../../components/drawing');


module.exports = function style(gd) {
    var s = d3.select(gd).selectAll('g.trace.boxes');

    s.style('opacity', function(d) { return d[0].trace.opacity; })
        .each(function(d) {
            var trace = d[0].trace,
                lineWidth = trace.line.width;
            d3.select(this).selectAll('path.box')
                .style('stroke-width', lineWidth + 'px')
                .call(Color.stroke, trace.line.color)
                .call(Color.fill, trace.fillcolor);
            d3.select(this).selectAll('path.mean')
                .style({
                    'stroke-width': lineWidth,
                    'stroke-dasharray': (2 * lineWidth) + 'px,' + lineWidth + 'px'
                })
                .call(Color.stroke, trace.line.color);
            d3.select(this).selectAll('g.points path')
                .call(Drawing.pointStyle, trace);
        });
};
