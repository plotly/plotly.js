'use strict';

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var Plots = require('../../../src/plots/plots');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var supplyAllDefaults = require('../assets/supply_defaults');

describe('Color legend', function() {
    'use strict';

    describe('supplyDefaults', function() {
        function _supply(traces, layout) {
            var gd = {
                data: traces,
                layout: layout || {}
            };
            supplyAllDefaults(gd);
            return gd;
        }

        it('should create colorlegend when trace references it', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    color: ['a', 'b', 'a'],
                    colorlegend: 'colorlegend'
                }
            }], {
                colorlegend: { visible: true }
            });

            expect(gd._fullData[0].marker.colorlegend).toBe('colorlegend');
            expect(gd._fullLayout.colorlegend).toBeDefined();
            expect(gd._fullLayout.colorlegend.visible).toBe(true);
        });

        it('should support multiple colorlegends', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    color: ['a', 'b', 'a'],
                    colorlegend: 'colorlegend'
                }
            }, {
                type: 'scatter',
                x: [1, 2, 3],
                y: [2, 3, 4],
                marker: {
                    color: ['x', 'y', 'z'],
                    colorlegend: 'colorlegend2'
                }
            }], {
                colorlegend: { title: { text: 'Legend 1' } },
                colorlegend2: { title: { text: 'Legend 2' } }
            });

            expect(gd._fullLayout.colorlegend).toBeDefined();
            expect(gd._fullLayout.colorlegend2).toBeDefined();
            expect(gd._fullLayout._colorlegends).toContain('colorlegend');
            expect(gd._fullLayout._colorlegends).toContain('colorlegend2');
        });

        it('should apply default values', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    color: ['a', 'b', 'a'],
                    colorlegend: 'colorlegend'
                }
            }]);

            var colorlegend = gd._fullLayout.colorlegend;
            expect(colorlegend.visible).toBe(true);
            expect(colorlegend.x).toBe(1.02);
            expect(colorlegend.y).toBe(1);
            expect(colorlegend.xanchor).toBe('left');
            expect(colorlegend.yanchor).toBe('auto');
            expect(colorlegend.orientation).toBe('v');
            expect(colorlegend.itemwidth).toBe(30);
            expect(colorlegend.itemclick).toBe('toggle');
            expect(colorlegend.itemdoubleclick).toBe('toggleothers');
            expect(colorlegend.binning).toBe('auto');
            expect(colorlegend.nbins).toBe(5);
        });

        it('should not create colorlegend when no traces reference it', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: { color: 'red' }
            }], {
                colorlegend: { visible: true }
            });

            expect(gd._fullLayout._colorlegends).toEqual([]);
        });
    });

    describe('rendering', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should render colorlegend with unique values', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3, 4],
                y: [1, 2, 3, 4],
                marker: {
                    color: ['red', 'blue', 'red', 'green'],
                    colorlegend: 'colorlegend'
                }
            }], {
                colorlegend: { visible: true }
            })
            .then(function() {
                var legendGroup = d3Select('.colorlegend');
                expect(legendGroup.size()).toBe(1);

                var items = d3SelectAll('.colorlegend-item');
                expect(items.size()).toBe(3); // red, blue, green
            })
            .then(done, done.fail);
        });

        it('should render title when specified', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    color: ['a', 'b', 'c'],
                    colorlegend: 'colorlegend'
                }
            }], {
                colorlegend: {
                    visible: true,
                    title: { text: 'My Colors' }
                }
            })
            .then(function() {
                var title = d3Select('.colorlegend .legendtitle');
                expect(title.size()).toBe(1);
                expect(title.text()).toBe('My Colors');
            })
            .then(done, done.fail);
        });

        it('should handle horizontal orientation', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    color: ['a', 'b', 'c'],
                    colorlegend: 'colorlegend'
                }
            }], {
                colorlegend: {
                    visible: true,
                    orientation: 'h'
                }
            })
            .then(function() {
                var items = d3SelectAll('.colorlegend-item');
                expect(items.size()).toBe(3);

                // Check that items are horizontally positioned
                // Items should exist and be laid out - we verify count is correct
                // Horizontal layout is verified by the legend being wider than tall
                var bg = d3Select('.colorlegend .bg');
                var width = parseFloat(bg.attr('width'));
                var height = parseFloat(bg.attr('height'));
                expect(width).toBeGreaterThan(height);
            })
            .then(done, done.fail);
        });

        it('should hide legend when visible is false', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    color: ['a', 'b', 'c'],
                    colorlegend: 'colorlegend'
                }
            }], {
                colorlegend: { visible: false }
            })
            .then(function() {
                var legendGroup = d3Select('.colorlegend');
                expect(legendGroup.size()).toBe(0);
            })
            .then(done, done.fail);
        });

        it('should update on relayout', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    color: ['a', 'b', 'c'],
                    colorlegend: 'colorlegend'
                }
            }], {
                colorlegend: { visible: true }
            })
            .then(function() {
                return Plotly.relayout(gd, 'colorlegend.x', 0.5);
            })
            .then(function() {
                // Legend should still exist after relayout
                var legend = d3Select('.colorlegend');
                expect(legend.size()).toBe(1);
            })
            .then(done, done.fail);
        });

        it('should handle multiple traces referencing same colorlegend', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2],
                y: [1, 2],
                marker: {
                    color: ['a', 'b'],
                    colorlegend: 'colorlegend'
                }
            }, {
                type: 'scatter',
                mode: 'markers',
                x: [3, 4],
                y: [3, 4],
                marker: {
                    color: ['b', 'c'],
                    colorlegend: 'colorlegend'
                }
            }], {
                colorlegend: { visible: true }
            })
            .then(function() {
                var items = d3SelectAll('.colorlegend-item');
                expect(items.size()).toBe(3); // a, b, c (combined from both traces)
            })
            .then(done, done.fail);
        });

        it('should apply border styling', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    color: ['a', 'b', 'c'],
                    colorlegend: 'colorlegend'
                }
            }], {
                colorlegend: {
                    visible: true,
                    borderwidth: 2,
                    bordercolor: 'red'
                }
            })
            .then(function() {
                var bg = d3Select('.colorlegend .bg');
                expect(bg.node().style.strokeWidth).toBe('2px');
            })
            .then(done, done.fail);
        });
    });

});
