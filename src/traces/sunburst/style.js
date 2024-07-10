'use strict';

var d3 = require('@plotly/d3');
var Color = require('../../components/color');
var Lib = require('../../lib');
var resizeText = require('../bar/uniform_text').resizeText;
var fillOne = require('./fill_one');

function style(gd) {
    var s = gd._fullLayout._sunburstlayer.selectAll('.trace');
    resizeText(gd, s, 'sunburst');

    s.each(function(cd) {
        var gTrace = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;

        gTrace.style('opacity', trace.opacity);

        gTrace.selectAll('path.surface').each(function(pt) {
            d3.select(this).call(styleOne, pt, trace, gd);
        });
    });
}

function styleOne(s, pt, trace, gd) {
    var cdi = pt.data.data;
    var isLeaf = !pt.children;
    var ptNumber = cdi.i;
    var lineColor = Lib.castOption(trace, ptNumber, 'marker.line.color') || Color.defaultLine;
    var lineWidth = Lib.castOption(trace, ptNumber, 'marker.line.width') || 0;

    s.call(fillOne, pt, trace, gd)
        .style('stroke-width', lineWidth)
        .call(Color.stroke, lineColor)
        .style('opacity', isLeaf ? trace.leaf.opacity : null);
}

module.exports = {
    style: style,
    styleOne: styleOne
};
