'use strict';

var d3 = require('@plotly/d3');

var Drawing = require('../../components/drawing');
var Lib = require('../../lib');

module.exports = function style(gd, calcTrace) {
    if(!calcTrace || !calcTrace.length || !calcTrace[0]) return;
    
    var trace = calcTrace[0].trace;
    var s = d3.select(gd).selectAll('g.trace' + trace.uid);

    s.selectAll('path.js-line')
        .call(Drawing.lineGroupStyle, trace.line || {});
};


