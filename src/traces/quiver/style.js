'use strict';

var d3 = require('@plotly/d3');

var Drawing = require('../../components/drawing');
var Color = require('../../components/color');
var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

function style(gd) {
    var s = d3.select(gd).selectAll('g.trace.quiver');

    s.each(function(d) {
        var trace = d[0].trace;
        var line = trace.line || {};

        d3.select(this).selectAll('path.js-line')
            .call(Drawing.lineGroupStyle, line.width, line.color, line.dash);
    });
}

function styleOnSelect(gd, cd, sel) {
    var trace = cd[0].trace;
    var line = trace.line || {};

    if(!sel) return;

    if(trace.selectedpoints) {
        var selectedAttrs = trace.selected || {};
        var unselectedAttrs = trace.unselected || {};
        var selectedLine = selectedAttrs.line || {};
        var unselectedLine = unselectedAttrs.line || {};

        sel.selectAll('path.js-line').each(function(d) {
            var path = d3.select(this);

            if(d.selected) {
                var sc = selectedLine.color || line.color;
                var sw = selectedLine.width !== undefined ? selectedLine.width : line.width;
                Drawing.lineGroupStyle(path, sw, sc, line.dash);
            } else {
                var uc = unselectedLine.color;
                var uw = unselectedLine.width;
                if(!uc) {
                    uc = line.color ? Color.addOpacity(line.color, DESELECTDIM) : undefined;
                }
                if(uw === undefined) uw = line.width;
                Drawing.lineGroupStyle(path, uw, uc, line.dash);
            }
        });

        Drawing.selectedTextStyle(sel.selectAll('text'), trace);
    } else {
        sel.selectAll('path.js-line')
            .call(Drawing.lineGroupStyle, line.width, line.color, line.dash);
        Drawing.textPointStyle(sel.selectAll('text'), trace, gd);
    }
}

module.exports = {
    style: style,
    styleOnSelect: styleOnSelect
};
