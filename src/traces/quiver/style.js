'use strict';

var d3 = require('@plotly/d3');

var Drawing = require('../../components/drawing');

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

    // Style the line paths based on selection state
    sel.selectAll('path.js-line')
        .call(Drawing.lineGroupStyle, line.width, line.color, line.dash);
}

module.exports = {
    style: style,
    styleOnSelect: styleOnSelect
};
