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
            expect(this.style.fill)
                .toEqual(color[i], 'to have correct pt color');
            var op = this.style.opacity;
            expect(op === undefined ? 1 : +op)
                .toEqual(opacity[i], 'to have correct pt opacity');
        });
    });
};

exports.assertHoverLabelStyle = function(g, expectation, msg, textSelector) {
    if(!msg) msg = '';

    var path = g.select('path').node();
    expect(getComputedStyle(path).fill).toBe(expectation.bgcolor, msg + ': bgcolor');
    expect(getComputedStyle(path).stroke).toBe(expectation.bordercolor, msg + ': bordercolor');

    var text = g.select(textSelector || 'text.nums').node();
    expect(getComputedStyle(text).fontFamily.split(',')[0]).toBe(expectation.fontFamily, msg + ': font.family');
    expect(parseInt(getComputedStyle(text).fontSize)).toBe(expectation.fontSize, msg + ': font.size');
    expect(getComputedStyle(text).fill).toBe(expectation.fontColor, msg + ': font.color');
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

exports.checkTicks = function(axLetter, vals, msg) {
    var selection = d3.selectAll('.' + axLetter + 'tick text');
    expect(selection.size()).toBe(vals.length);
    selection.each(function(d, i) {
        expect(d3.select(this).text()).toBe(vals[i], msg + ': ' + i);
    });
};
