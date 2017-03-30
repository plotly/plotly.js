// var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
// var Lib = require('@src/lib');

var Carpet = require('@src/traces/carpet');

// var d3 = require('d3');
// var createGraphDiv = require('../assets/create_graph_div');
// var destroyGraphDiv = require('../assets/destroy_graph_div');
// var customMatchers = require('../assets/custom_matchers');


describe('carpet supplyDefaults', function() {
    'use strict';

    var traceIn,
        traceOut;

    var supplyDefaults = Carpet.supplyDefaults;

    var defaultColor = '#444',
        layout = {
            font: Plots.layoutAttributes.font
        };

    beforeEach(function() {
        traceOut = {};
    });

    it('uses a, b, x, and y', function () {
        traceIn = {
            a: [0, 1],
            b: [0, 1, 2],
            x: [[1, 2, 3], [4, 5, 6]],
            y: [[2, 3, 4], [5, 6, 7]]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);

        expect(traceOut.a).toEqual([0, 1])
        expect(traceOut.b).toEqual([0, 1, 2])
        expect(traceOut.x).toEqual([[1, 2, 3], [4, 5, 6]])
        expect(traceOut.y).toEqual([[2, 3, 4], [5, 6, 7]])
    });

    it('fills in unspecified a', function () {
        traceIn = {y: [[2, 3, 4], [5, 6, 7]]};
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.a).toEqual([0, 1])
    });

    return;

    it('supplies defaults when given y', function () {
        traceIn = {y: [[1, 2, 3], [4, 5, 6]]}
        supplyDefaults(traceIn, traceOut, defaultColor, layout);

        console.log('a = ', traceOut.a)
        console.log('b = ', traceOut.b)

        expect(traceOut.visible).toBe(true)
    });

    return;

    it('sets visible = false when x is not valid', function() {
        traceIn = {y: [[1, 2], [3, 4]], x: [4]};
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);
    });

    it('sets visible = false when y is not valid', function() {
        traceIn = {y: [1, 2]};
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);
    });

    it('sets visible = false if dim x !== dim y', function () {
        traceIn = {
            x: [[1, 2], [3, 4]],
            y: [[1, 2, 3], [4, 5, 6]]
        }
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false)
    });

    /* it('sets _cheater = true when x is provided', function() {
        traceIn = {y: [[1, 2], [3, 4]]};
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut._cheater).toBe(true);
    });

    it('sets cheater = false when x is not valid', function() {
        traceIn = {y: [[1, 2], [3, 4]], x: [[3, 4], [1, 2]]};
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut._cheater).toBe(false);
    });*/
});
