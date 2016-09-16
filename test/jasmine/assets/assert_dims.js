'use strict';

var d3 = require('d3');

module.exports = function assertDims(dims) {
    var traces = d3.selectAll('.trace');

    expect(traces.size())
        .toEqual(dims.length, 'to have correct number of traces');

    traces.each(function(_, i) {
        var trace = d3.select(this);
        var points = trace.selectAll('.point');

        expect(points.size())
            .toEqual(dims[i], 'to have correct number of pts in trace ' + i);
    });
};
