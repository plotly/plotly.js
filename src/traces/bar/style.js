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
    var s = cd ? cd[0].node3 : d3.select(gd).selectAll('g.trace.bars');
    var barcount = s.size();
    var fullLayout = gd._fullLayout;

    // trace styling
    s.style('opacity', function(d) { return d[0].trace.opacity; })

    // for gapless (either stacked or neighboring grouped) bars use
    // crispEdges to turn off antialiasing so an artificial gap
    // isn't introduced.
    .each(function(d) {
        if((fullLayout.barmode === 'stack' && barcount > 1) ||
                (fullLayout.bargap === 0 &&
                 fullLayout.bargroupgap === 0 &&
                 !d[0].trace.marker.line.width)) {
            d3.select(this).attr('shape-rendering', 'crispEdges');
        }
    });

    s.selectAll('g.points').each(function(d) {
        var sel = d3.select(this);
        var trace = d[0].trace;
        stylePoints(sel, trace, gd);
    });

    Registry.getComponentMethod('errorbars', 'style')(s);
}

function stylePoints(sel, trace, gd) {
    var pts = sel.selectAll('path');
    var txs = sel.selectAll('text');

    Drawing.pointStyle(pts, trace, gd);

    txs.each(function(d) {
        var tx = d3.select(this);
        var textFont;

        if(tx.classed('bartext-inside')) {
            textFont = trace.insidetextfont;
        } else if(tx.classed('bartext-outside')) {
            textFont = trace.outsidetextfont;
        }
        if(!textFont) textFont = trace.textfont;

        function cast(k) {
            var cont = textFont[k];
            return Array.isArray(cont) ? cont[d.i] : cont;
        }

        Drawing.font(tx, cast('family'), cast('size'), cast('color'));
    });
}

function styleOnSelect(gd, cd) {
    var s = cd[0].node3;
    var trace = cd[0].trace;

    if(trace.selectedpoints) {
        Drawing.selectedPointStyle(s.selectAll('path'), trace);
        Drawing.selectedTextStyle(s.selectAll('text'), trace);
    } else {
        stylePoints(s, trace, gd);
    }
}

module.exports = {
    style: style,
    styleOnSelect: styleOnSelect
};
