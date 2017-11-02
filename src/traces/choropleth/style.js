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
var Colorscale = require('../../components/colorscale');

module.exports = function style(gd, calcTrace) {
    if(calcTrace) styleTrace(gd, calcTrace);
};

function styleTrace(gd, calcTrace) {
    var trace = calcTrace[0].trace;
    var s = calcTrace[0].node3;
    var locs = s.selectAll('.choroplethlocation');
    var marker = trace.marker || {};
    var markerLine = marker.line || {};

    var sclFunc = Colorscale.makeColorScaleFunc(
        Colorscale.extractScale(
            trace.colorscale,
            trace.zmin,
            trace.zmax
        )
    );

    locs.each(function(d) {
        d3.select(this)
            .attr('fill', sclFunc(d.z))
            .call(Color.stroke, d.mlc || markerLine.color)
            .call(Drawing.dashLine, '', d.mlw || markerLine.width || 0)
            .style('opacity', marker.opacity);
    });

    if(trace.selectedpoints) {
        var selectedAttrs = trace.selected || {};
        var unselectedAttrs = trace.unselected || {};

        locs.style('opacity', function(d) {
            return d.selected ?
                selectedAttrs.marker.opacity :
                unselectedAttrs.marker.opacity;
        });
    }
}
