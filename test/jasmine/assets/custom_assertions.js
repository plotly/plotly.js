'use strict';

var d3 = require('d3');

exports.assertDims = function(dims) {
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

exports.assertStyle = function(dims, color, opacity) {
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

exports.assertClip = function(sel, isClipped, size, msg) {
    expect(sel.size()).toBe(size, msg + ' clip path (selection size)');

    sel.each(function(d, i) {
        var clipPath = d3.select(this).attr('clip-path');

        if(isClipped) {
            expect(String(clipPath).substr(0, 4))
                .toBe('url(', msg + ' clip path ' + '(item ' + i + ')');
        } else {
            expect(clipPath)
                .toBe(null, msg + ' clip path ' + '(item ' + i + ')');
        }
    });

};

exports.assertNodeDisplay = function(sel, expectation, msg) {
    expect(sel.size())
        .toBe(expectation.length, msg + ' display (selection size)');

    sel.each(function(d, i) {
        expect(d3.select(this).attr('display'))
            .toBe(expectation[i], msg + ' display ' + '(item ' + i + ')');
    });
};
