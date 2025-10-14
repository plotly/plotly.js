var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var ScatterQuiver = require('../../../src/traces/scatterquiver');
var Lib = require('../../../src/lib');

var Plotly = require('../../../lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customAssertions = require('../assets/custom_assertions');
var supplyAllDefaults = require('../assets/supply_defaults');

var assertClip = customAssertions.assertClip;
var assertNodeDisplay = customAssertions.assertNodeDisplay;

describe('Test scatterquiver', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn;
        var traceOut;
        var layout = {};

        var supplyDefaults = ScatterQuiver.supplyDefaults;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set default values', function() {
            traceIn = {
                type: 'scatterquiver',
                x: [1, 2, 3],
                y: [1, 2, 3],
                u: [0.5, 0.5, 0.5],
                v: [0.5, 0.5, 0.5]
            };

            supplyDefaults(traceIn, traceOut, '#444', layout);

            expect(traceOut.type).toBe('scatterquiver');
            expect(traceOut.visible).toBe(true);
            expect(traceOut.scale).toBe(0.1);
            expect(traceOut.arrow_scale).toBe(0.3);
            expect(traceOut.angle).toBe(Math.PI / 9);
            expect(traceOut.line.color).toBe('#444');
            expect(traceOut.line.width).toBe(1);
        });

        it('should handle custom values', function() {
            traceIn = {
                type: 'scatterquiver',
                x: [1, 2, 3],
                y: [1, 2, 3],
                u: [0.5, 0.5, 0.5],
                v: [0.5, 0.5, 0.5],
                scale: 2,
                arrow_scale: 0.5,
                angle: Math.PI / 4,
                line: {
                    color: 'red',
                    width: 2
                }
            };

            supplyDefaults(traceIn, traceOut, '#444', layout);

            expect(traceOut.scale).toBe(2);
            expect(traceOut.arrow_scale).toBe(0.5);
            expect(traceOut.angle).toBe(Math.PI / 4);
            expect(traceOut.line.color).toBe('red');
            expect(traceOut.line.width).toBe(2);
        });
    });

    describe('calc', function() {
        var traceIn;
        var traceOut;
        var layout = {};
        var gd;

        var calc = ScatterQuiver.calc;

        beforeEach(function() {
            gd = createGraphDiv();
            traceOut = {};
        });

        afterEach(function() {
            destroyGraphDiv();
        });

        it('should calculate vector magnitudes and angles', function() {
            var mockData = [{
                type: 'scatterquiver',
                x: [0, 1, 0],
                y: [0, 0, 1],
                u: [1, 0, 0],
                v: [0, 1, 0]
            }];

            gd.data = mockData;
            gd.layout = {};
            supplyAllDefaults(gd);
            
            var trace = gd._fullData[0];
            var calcdata = calc(gd, trace);

            expect(calcdata).toBeDefined();
            expect(Array.isArray(calcdata)).toBe(true);
            expect(calcdata.length).toBe(3); // One complete arrow per entry
        });
    });

    describe('end-to-end scatterquiver tests', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should create a basic quiver plot', function(done) {
            var data = [{
                type: 'scatterquiver',
                x: [0, 1, 2],
                y: [0, 1, 2],
                u: [1, 0, -1],
                v: [0, 1, 0],
                scale: 0.5,
                arrow_scale: 0.3,
                line: {
                    color: 'blue',
                    width: 2
                }
            }];

            var layout = {
                title: 'Basic Quiver Plot',
                xaxis: { title: 'X' },
                yaxis: { title: 'Y' }
            };

            Plotly.newPlot(gd, data, layout).then(function() {
                // Check that the plot was created
                expect(d3SelectAll('g.trace.scatterquiver').size()).toBe(1);
                expect(d3SelectAll('g.trace.scatterquiver path.js-line').size()).toBeGreaterThan(0);
            }).then(done, done.fail);
        });

        it('should handle gradient field data', function(done) {
            // Create a simple gradient field
            var x = [], y = [], u = [], v = [];
            for (var i = -2; i <= 2; i += 0.5) {
                for (var j = -2; j <= 2; j += 0.5) {
                    x.push(i);
                    y.push(j);
                    // Simple gradient: u = -x, v = -y (pointing toward origin)
                    u.push(-i);
                    v.push(-j);
                }
            }

            var data = [{
                type: 'scatterquiver',
                x: x,
                y: y,
                u: u,
                v: v,
                scale: 0.3,
                arrow_scale: 0.4,
                line: {
                    color: 'red',
                    width: 1
                }
            }];

            var layout = {
                title: 'Gradient Field',
                xaxis: { title: 'X', range: [-2.5, 2.5] },
                yaxis: { title: 'Y', range: [-2.5, 2.5] }
            };

            Plotly.newPlot(gd, data, layout).then(function() {
                expect(d3SelectAll('g.trace.scatterquiver').size()).toBe(1);
                expect(d3SelectAll('g.trace.scatterquiver path.js-line').size()).toBeGreaterThan(0);
            }).then(done, done.fail);
        });

        it('should handle meshgrid data', function(done) {
            // Create meshgrid data
            var x = [], y = [], u = [], v = [];
            for (var i = 0; i <= 2; i += 0.2) {
                for (var j = 0; j <= 2; j += 0.2) {
                    x.push(i);
                    y.push(j);
                    u.push(Math.cos(i) * j);
                    v.push(Math.sin(i) * j);
                }
            }

            var data = [{
                type: 'scatterquiver',
                x: x,
                y: y,
                u: u,
                v: v,
                scale: 0.3,
                arrow_scale: 0.4,
                line: {
                    color: 'green',
                    width: 2
                }
            }];

            var layout = {
                title: 'Meshgrid Vector Field',
                xaxis: { title: 'X', range: [-0.2, 2.2] },
                yaxis: { title: 'Y', range: [-0.2, 2.2] }
            };

            Plotly.newPlot(gd, data, layout).then(function() {
                expect(d3SelectAll('g.trace.scatterquiver').size()).toBe(1);
                expect(d3SelectAll('g.trace.scatterquiver path.js-line').size()).toBeGreaterThan(0);
            }).then(done, done.fail);
        });
    });
});

