/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Lib = require('../../lib');
var Drawing = require('../../components/drawing');

module.exports = function plot(gd, plotinfo, cdcarpet) {
    for(var i = 0; i < cdcarpet.length; i++) {
        plotOne(gd, plotinfo, cdcarpet[i]);
    }
};

function plotOne(gd, plotinfo, cd) {
    var trace = cd[0].trace,
        uid = trace.uid,
        xa = plotinfo.xaxis,
        ya = plotinfo.yaxis,
        fullLayout = gd._fullLayout,
        id = 'carpet' + uid;

    var x = cd[0].x;
    var y = cd[0].y;
    var a = cd[0].a;
    var b = cd[0].b;
    var xp = xa.c2p;
    var yp = ya.c2p;

    window.x = x;
    window.y = y;
    window.xa = xa;
    window.ya = ya;

    // XXX: Layer choice??
    var gridLayer = plotinfo.plot.selectAll('.maplayer');

    var linesets = [{
        class: 'const-a-line',
        data: b,
        xc: function (i, j) { return xp(x[i][j]); },
        yc: function (i, j) { return yp(y[i][j]); },
        n: a.length
    }, {
        class: 'const-b-line',
        data: a,
        xc: function (i, j) { return xp(x[j][i]); },
        yc: function (i, j) { return yp(y[j][i]); },
        n: b.length
    }];

    for (var i = 0; i < linesets.length; i++) {
        var lineset = linesets[i];
        drawGridLines(gridLayer, lineset);
    }
}

function drawAxisLabels () {
}

function drawGridLines (layer, ls) {
    var gridjoin = layer.selectAll('.' + ls.class).data(ls.data);

    gridjoin.enter().append('path')
        .classed(ls.class, true)
        .style('vector-effect', 'non-scaling-stroke');

    gridjoin.each(function (d, i) {
            var el = d3.select(this);
            el.attr('d', function () {
                var pts = [];
                for(var k = 0; k < ls.n; k++) {
                    pts.push(ls.xc(i, k) + ',' +  ls.yc(i, k));
                }
                return 'M' + pts.join('L');
            })
            el.style('stroke-width', 1)
              .style('stroke', 'gray')
              .style('fill', 'none');
        })
        .exit().remove();
}
