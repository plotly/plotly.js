'use strict';

var d3 = require('../../lib/d3');
var getTraceFromCd = require('../../lib/trace_from_cd');
var Drawing = require('../../components/drawing');
var Color = require('../../components/color');

var scatterStyle = require('../scatter/style');
var stylePoints = scatterStyle.stylePoints;
var styleText = scatterStyle.styleText;

module.exports = function style(gd, calcTrace) {
    if(calcTrace) styleTrace(gd, calcTrace);
};

function styleTrace(gd, calcTrace) {
    var trace = getTraceFromCd(calcTrace);
    var s = calcTrace[0].node3;

    s.style('opacity', getTraceFromCd(calcTrace).opacity);

    stylePoints(s, trace, gd);
    styleText(s, trace, gd);

    // this part is incompatible with Drawing.lineGroupStyle
    s.selectAll('path.js-line')
        .style('fill', 'none')
        .each(function(d) {
            var path = d3.select(this);
            var trace = d.trace;
            var line = trace.line || {};

            path.call(Color.stroke, line.color)
                .call(Drawing.dashLine, line.dash || '', line.width || 0);

            if(trace.fill !== 'none') {
                path.call(Color.fill, trace.fillcolor);
            }
        });
}
