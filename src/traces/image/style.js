'use strict';

var d3 = require('../../lib/d3');
var getTraceFromCd = require('../../lib/trace_from_cd');

module.exports = function style(gd) {
    d3.select(gd).selectAll('.im image')
        .style('opacity', function(d) {
            return getTraceFromCd(d).opacity;
        });
};
