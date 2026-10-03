'use strict';

var d3 = require('@plotly/d3');

var Color = require('../color');
const Drawing = require('../drawing');
const subTypes = require('../../traces/scatter/subtypes');


module.exports = function style(traces) {
    traces.each(function(d) {
        var trace = d[0].trace;
        var yObj = trace.error_y || {};
        var xObj = trace.error_x || {};

        var s = d3.select(this);
        let opacity = 1;
        if (subTypes.hasMarkers(trace)) {
            const marker = trace.marker;
            const selectedOpacity = trace.selectedpoints && Drawing.makeSelectedPointStyleFns(trace).selectedOpacityFn;
            opacity = selectedOpacity || ((point) => (point.mo === undefined ? marker.opacity : point.mo));
        }

        s.selectAll('path.yerror')
            .style('opacity', opacity)
            .style('stroke-width', yObj.thickness + 'px')
            .call(Color.stroke, yObj.color);

        if(xObj.copy_ystyle) xObj = yObj;

        s.selectAll('path.xerror')
            .style('opacity', opacity)
            .style('stroke-width', xObj.thickness + 'px')
            .call(Color.stroke, xObj.color);
    });
};
