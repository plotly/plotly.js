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
var ErrorBars = require('../../components/errorbars');

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

    s.call(ErrorBars.style);
}

function stylePoints(sel, trace, gd) {
    var pts = sel.selectAll('path.point');
    var txs = sel.selectAll('text');

    Drawing.pointStyle(pts, trace, gd);
    Drawing.textPointStyle(txs, trace, gd);
    Drawing.selectedPointStyle(pts, trace);
    Drawing.selectedTextStyle(txs, trace);
}

module.exports = {
    style: style,
    stylePoints: stylePoints
};
