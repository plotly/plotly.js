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

    it('sets _cheater = true when x is provided', function() {
        traceIn = {y: [[1, 2], [3, 4]]};
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut._cheater).toBe(true);
    });

    it('sets cheater = false when x is not valid', function() {
        traceIn = {y: [[1, 2], [3, 4]], x: [[3, 4], [1, 2]]};
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut._cheater).toBe(false);
    });

    it('defaults to cheaterslope = 1', function() {
        traceIn = {y: [[1, 2], [3, 4]]};
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.cheaterslope).toEqual(1);
    });
});
