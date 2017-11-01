/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Drawing = require('../../components/drawing');
var Color = require('../../components/color');

module.exports = function style(gd) {
    var traces = d3.select(gd).selectAll('g.trace.violins');

    traces.style('opacity', function(d) { return d[0].trace.opacity; })
        .each(function(d) {
            var trace = d[0].trace;
            var sel = d3.select(this);
            var box = trace.box || {};
            var boxLine = box.line || {};
            var meanline = trace.meanline || {};
            var meanLineWidth = meanline.width;

            sel.selectAll('path.violin')
                .style('stroke-width', trace.line.width + 'px')
                .call(Color.stroke, trace.line.color)
                .call(Color.fill, trace.fillcolor);

            sel.selectAll('path.box')
                .style('stroke-width', boxLine.width + 'px')
                .call(Color.stroke, boxLine.color)
                .call(Color.fill, box.fillcolor);

            sel.selectAll('g.points path')
                .call(Drawing.pointStyle, trace, gd);

            sel.selectAll('path.mean')
                .style({
                    'stroke-width': meanLineWidth + 'px',
                    'stroke-dasharray': (2 * meanLineWidth) + 'px,' + meanLineWidth + 'px'
                })
                .call(Color.stroke, meanline.color);
        });
};
