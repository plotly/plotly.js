'use strict';

var d3 = require('@plotly/d3');
var Lib = require('../../lib');

var Drawing = require('../../components/drawing');
var Color = require('../../components/color');
var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

function style(gd) {
    var s = d3.select(gd).selectAll('g.trace.quiver');

    s.each(function(d) {
        var trace = d[0].trace;
        var marker = trace.marker || {};
        var markerLine = marker.line || {};
        var lineColor = Lib.isArrayOrTypedArray(marker.color) ? undefined : marker.color;

        d3.select(this).selectAll('path.js-line')
            .call(Drawing.lineGroupStyle, markerLine.width, lineColor, markerLine.dash);
    });
}

function styleOnSelect(gd, cd, sel) {
    var trace = cd[0].trace;
    var marker = trace.marker || {};
    var markerLine = marker.line || {};
    var lineColor = Lib.isArrayOrTypedArray(marker.color) ? undefined : marker.color;

    if(!sel) return;

    if(trace.selectedpoints) {
        var selectedAttrs = trace.selected || {};
        var unselectedAttrs = trace.unselected || {};
        var selectedLine = selectedAttrs.line || {};
        var unselectedLine = unselectedAttrs.line || {};

        sel.selectAll('path.js-line').each(function(d) {
            var path = d3.select(this);

            if(d.selected) {
                var sc = selectedLine.color || lineColor;
                var sw = selectedLine.width !== undefined ? selectedLine.width : markerLine.width;
                Drawing.lineGroupStyle(path, sw, sc, markerLine.dash);
            } else {
                var uc = unselectedLine.color;
                var uw = unselectedLine.width;
                if(!uc) {
                    uc = lineColor ? Color.addOpacity(lineColor, DESELECTDIM) : undefined;
                }
                if(uw === undefined) uw = markerLine.width;
                Drawing.lineGroupStyle(path, uw, uc, markerLine.dash);
            }
        });

        Drawing.selectedTextStyle(sel.selectAll('text'), trace);
    } else {
        sel.selectAll('path.js-line')
            .call(Drawing.lineGroupStyle, markerLine.width, lineColor, markerLine.dash);
        Drawing.textPointStyle(sel.selectAll('text'), trace, gd);
    }
}

module.exports = {
    style: style,
    styleOnSelect: styleOnSelect
};
