'use strict';

var d3 = require('@plotly/d3');
var Drawing = require('../../components/drawing');
var Registry = require('../../registry');

function style(gd) {
    var s = d3.select(gd).selectAll('g.trace.scatter');

    s.style('opacity', function(d) {
        return d[0].trace.opacity;
    });

    var xa = gd._fullLayout.xaxis;
    var ya = gd._fullLayout.yaxis;

    s.selectAll('g.points').each(function(d) {
        var sel = d3.select(this);
        var trace = d.trace || d[0].trace;
        stylePoints(sel, trace, xa, ya, gd);
    });

    s.selectAll('g.text').each(function(d) {
        var sel = d3.select(this);
        var trace = d.trace || d[0].trace;
        styleText(sel, trace, gd);
    });

    s.selectAll('g.trace path.js-line')
        .call(Drawing.lineGroupStyle);

    s.selectAll('g.trace path.js-fill')
        .call(Drawing.fillGroupStyle, gd, false);

    Registry.getComponentMethod('errorbars', 'style')(s);
}

function stylePoints(sel, trace, xa, ya, gd) {
    Drawing.pointStyle(sel.selectAll('path.point'), trace, xa, ya, gd);
}

function styleText(sel, trace, gd) {
    Drawing.textPointStyle(sel.selectAll('text'), trace, gd);
}

function styleOnSelect(gd, cd, sel, xa, ya) {
    var trace = cd[0].trace;

    if(trace.selectedpoints) {
        Drawing.selectedPointStyle(sel.selectAll('path.point'), trace);
        Drawing.selectedTextStyle(sel.selectAll('text'), trace);
    } else {
        stylePoints(sel, trace, xa, ya, gd);
        styleText(sel, trace, gd);
    }
}

module.exports = {
    style: style,
    stylePoints: stylePoints,
    styleText: styleText,
    styleOnSelect: styleOnSelect
};
