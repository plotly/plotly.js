/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var Drawing = require('../../components/drawing');
var Registry = require('../../registry');

function style(gd, cd) {
    var s = cd ? cd[0].node3 : d3.select(gd).selectAll('g.trace.scatter');

    s.style('opacity', function(d) {
        return d[0].trace.opacity;
    });

    s.selectAll('g.points').each(function(d) {
        var sel = d3.select(this);
        var trace = d.trace || d[0].trace;
        stylePoints(sel, trace, gd);
    });

    s.selectAll('g.trace path.js-line')
        .call(Drawing.lineGroupStyle);

    s.selectAll('g.trace path.js-fill')
        .call(Drawing.fillGroupStyle);

    Registry.getComponentMethod('errorbars', 'style')(s);
}

function stylePoints(sel, trace, gd) {
    var pts = sel.selectAll('path.point');
    var txs = sel.selectAll('text');

    Drawing.pointStyle(pts, trace, gd);
    Drawing.textPointStyle(txs, trace, gd);
    Drawing.selectedPointStyle(pts, trace);
    Drawing.selectedTextStyle(txs, trace);
}

function styleOnSelect(gd, cd) {
    var s = cd[0].node3;
    var trace = cd[0].trace;

    if(trace.selectedpoints) {
        Drawing.selectedPointStyle(s.selectAll('path.point'), trace, gd);
        Drawing.selectedPointStyle(s.selectAll('text'), trace, gd);
    } else {
        stylePoints(s, trace, gd);
    }
}

module.exports = {
    style: style,
    stylePoints: stylePoints,
    styleOnSelect: styleOnSelect
};
