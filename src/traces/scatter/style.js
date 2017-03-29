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


module.exports = function style(gd) {
    var s = d3.select(gd).selectAll('g.trace.scatter');

    s.style('opacity', function(d) {
        return d[0].trace.opacity;
    });

    s.selectAll('g.points')
        .each(function(d) {
            var el = d3.select(this);
            var pts = el.selectAll('path.point');
            var trace = d.trace || d[0].trace;

            pts.call(Drawing.pointStyle, trace);

            el.selectAll('text')
                .call(Drawing.textPointStyle, trace);
        });

    s.selectAll('g.trace path.js-line')
        .call(Drawing.lineGroupStyle);

    s.selectAll('g.trace path.js-fill')
        .call(Drawing.fillGroupStyle);

    s.call(ErrorBars.style);
};
