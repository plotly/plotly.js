'use strict';

var d3 = require('@plotly/d3');

var Color = require('../color');


module.exports = function style(traces) {
    traces.each(function(d) {
        var trace = d[0].trace;
        var yObj = trace.error_y || {};
        var xObj = trace.error_x || {};

        var s = d3.select(this);

        s.selectAll('path.yerror')
            .style('stroke-width', yObj.thickness + 'px')
            .call(Color.stroke, yObj.color);

        if(xObj.copy_ystyle) xObj = yObj;

        s.selectAll('path.xerror')
            .style('stroke-width', xObj.thickness + 'px')
            .call(Color.stroke, xObj.color);
    });
};
