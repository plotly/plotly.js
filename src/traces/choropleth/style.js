'use strict';

var d3 = require('../../lib/d3');
var getTraceFromCd = require('../../lib/trace_from_cd');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var Colorscale = require('../../components/colorscale');

function style(gd, calcTrace) {
    if(calcTrace) styleTrace(gd, calcTrace);
}

function styleTrace(gd, calcTrace) {
    var trace = getTraceFromCd(calcTrace);
    var s = calcTrace[0].node3;
    var locs = s.selectAll('.choroplethlocation');
    var marker = trace.marker || {};
    var markerLine = marker.line || {};

    var sclFunc = Colorscale.makeColorScaleFuncFromTrace(trace);

    locs.each(function(d) {
        d3.select(this)
            .attr('fill', sclFunc(d.z))
            .call(Color.stroke, d.mlc || markerLine.color)
            .call(Drawing.dashLine, '', d.mlw || markerLine.width || 0)
            .style('opacity', marker.opacity);
    });

    Drawing.selectedPointStyle(locs, trace, gd);
}

function styleOnSelect(gd, calcTrace) {
    var s = calcTrace[0].node3;
    var trace = getTraceFromCd(calcTrace);

    if(trace.selectedpoints) {
        Drawing.selectedPointStyle(s.selectAll('.choroplethlocation'), trace, gd);
    } else {
        styleTrace(gd, calcTrace);
    }
}

module.exports = {
    style: style,
    styleOnSelect: styleOnSelect
};
