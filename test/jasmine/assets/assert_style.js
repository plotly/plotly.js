'use strict';

var d3 = require('d3');

module.exports = function assertStyle(dims, color, opacity) {
    var N = dims.reduce(function(a, b) {
        return a + b;
    });

    var traces = d3.selectAll('.trace');
    expect(traces.size())
        .toEqual(dims.length, 'to have correct number of traces');

    expect(d3.selectAll('.point').size())
        .toEqual(N, 'to have correct total number of points');

    traces.each(function(_, i) {
        var trace = d3.select(this);
        var points = trace.selectAll('.point');

        expect(points.size())
            .toEqual(dims[i], 'to have correct number of pts in trace ' + i);

        points.each(function() {
            var point = d3.select(this);

            expect(point.style('fill'))
                .toEqual(color[i], 'to have correct pt color');
            expect(+point.style('opacity'))
                .toEqual(opacity[i], 'to have correct pt opacity');
        });
    });
};
