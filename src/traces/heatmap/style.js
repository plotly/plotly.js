'use strict';

var d3 = require('@plotly/d3');

module.exports = function style(gd) {
    d3.select(gd).selectAll('.hm image')
        .style('opacity', function(d) {
            return d.trace.opacity;
        });
};
