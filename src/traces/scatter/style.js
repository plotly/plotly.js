'use strict';

var d3 = require('../../lib/d3');
var getTraceFromCd = require('../../lib/trace_from_cd');
var Drawing = require('../../components/drawing');
var Registry = require('../../registry');

function style(gd) {
    var s = d3.select(gd).selectAll('g.trace.scatter');

    s.style('opacity', function(d) {
        var trace = getTraceFromCd(d);
        return trace.opacity;
    });

    s.selectAll('g.points').each(function(d) {
        var sel = d3.select(this);
        var trace = getTraceFromCd(d);
        stylePoints(sel, trace, gd);
    });

    s.selectAll('g.text').each(function(d) {
        var sel = d3.select(this);
        var trace = getTraceFromCd(d);
        styleText(sel, trace, gd);
    });

    s.selectAll('g.trace path.js-line')
        .call(Drawing.lineGroupStyle);

    s.selectAll('g.trace path.js-fill')
        .call(Drawing.fillGroupStyle);

    Registry.getComponentMethod('errorbars', 'style')(s);
}

function stylePoints(sel, trace, gd) {
    Drawing.pointStyle(sel.selectAll('path.point'), trace, gd);
}

function styleText(sel, trace, gd) {
    Drawing.textPointStyle(sel.selectAll('text'), trace, gd);
}

function styleOnSelect(gd, cd, sel) {
    var trace = getTraceFromCd(cd);

    if(trace.selectedpoints) {
        Drawing.selectedPointStyle(sel.selectAll('path.point'), trace);
        Drawing.selectedTextStyle(sel.selectAll('text'), trace);
    } else {
        stylePoints(sel, trace, gd);
        styleText(sel, trace, gd);
    }
}

module.exports = {
    style: style,
    stylePoints: stylePoints,
    styleText: styleText,
    styleOnSelect: styleOnSelect
};
