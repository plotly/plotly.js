'use strict';

var d3 = require('@plotly/d3');

module.exports = function style(gd) {
    d3.select(gd).selectAll('.im image')
        .style('opacity', function(d) {
            return d[0].trace.opacity;
        });
};
