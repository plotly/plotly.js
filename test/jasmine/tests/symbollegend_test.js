'use strict';

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var Plots = require('../../../src/plots/plots');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var supplyAllDefaults = require('../assets/supply_defaults');

describe('Symbol legend', function() {
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

        it('should create symbollegend when trace references it', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    symbol: ['circle', 'square', 'diamond'],
                    symbollegend: 'symbollegend'
                }
            }], {
                symbollegend: { visible: true }
            });

            expect(gd._fullData[0].marker.symbollegend).toBe('symbollegend');
            expect(gd._fullLayout.symbollegend).toBeDefined();
            expect(gd._fullLayout.symbollegend.visible).toBe(true);
        });

        it('should support multiple symbollegends', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    symbol: ['circle', 'square', 'diamond'],
                    symbollegend: 'symbollegend'
                }
            }, {
                type: 'scatter',
                x: [1, 2, 3],
                y: [2, 3, 4],
                marker: {
                    symbol: ['star', 'cross', 'x'],
                    symbollegend: 'symbollegend2'
                }
            }], {
                symbollegend: { title: { text: 'Legend 1' } },
                symbollegend2: { title: { text: 'Legend 2' } }
            });

            expect(gd._fullLayout.symbollegend).toBeDefined();
            expect(gd._fullLayout.symbollegend2).toBeDefined();
            expect(gd._fullLayout._symbollegends).toContain('symbollegend');
            expect(gd._fullLayout._symbollegends).toContain('symbollegend2');
        });

        it('should apply default values', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    symbol: ['circle', 'square', 'diamond'],
                    symbollegend: 'symbollegend'
                }
            }]);

            var symbollegend = gd._fullLayout.symbollegend;
            expect(symbollegend.visible).toBe(true);
            expect(symbollegend.x).toBe(1.02);
            expect(symbollegend.y).toBe(0);
            expect(symbollegend.xanchor).toBe('left');
            expect(symbollegend.yanchor).toBe('bottom');
            expect(symbollegend.orientation).toBe('v');
            expect(symbollegend.symbolsize).toBe(12);
            expect(symbollegend.symbolcolor).toBe('#444');
            expect(symbollegend.itemclick).toBe('toggle');
            expect(symbollegend.itemdoubleclick).toBe('toggleothers');
        });

        it('should not create symbollegend when no traces reference it', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: { symbol: 'circle' }
            }], {
                symbollegend: { visible: true }
            });

            expect(gd._fullLayout._symbollegends).toEqual([]);
        });
    });

    describe('rendering', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should render symbollegend with unique symbols', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3, 4],
                y: [1, 2, 3, 4],
                marker: {
                    symbol: ['circle', 'square', 'circle', 'diamond'],
                    symbollegend: 'symbollegend'
                }
            }], {
                symbollegend: { visible: true }
            })
            .then(function() {
                var legendGroup = d3Select('.symbollegend');
                expect(legendGroup.size()).toBe(1);

                var items = d3SelectAll('.symbollegend-item');
                expect(items.size()).toBe(3); // circle, square, diamond
            })
            .then(done, done.fail);
        });

        it('should render symbol paths', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    symbol: ['circle', 'square', 'diamond'],
                    symbollegend: 'symbollegend'
                }
            }], {
                symbollegend: { visible: true }
            })
            .then(function() {
                var paths = d3SelectAll('.symbollegend-item path.symbol');
                expect(paths.size()).toBe(3);
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
                    symbol: ['circle', 'square', 'diamond'],
                    symbollegend: 'symbollegend'
                }
            }], {
                symbollegend: {
                    visible: true,
                    title: { text: 'Marker Shapes' }
                }
            })
            .then(function() {
                var title = d3Select('.symbollegend .legendtitle');
                expect(title.size()).toBe(1);
                expect(title.text()).toBe('Marker Shapes');
            })
            .then(done, done.fail);
        });

        it('should handle numeric symbol values', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    symbol: [0, 1, 2], // circle, square, diamond
                    symbollegend: 'symbollegend'
                }
            }], {
                symbollegend: { visible: true }
            })
            .then(function() {
                var items = d3SelectAll('.symbollegend-item');
                expect(items.size()).toBe(3);
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
                    symbol: ['circle', 'square', 'diamond'],
                    symbollegend: 'symbollegend'
                }
            }], {
                symbollegend: { visible: false }
            })
            .then(function() {
                var legendGroup = d3Select('.symbollegend');
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
                    symbol: ['circle', 'square', 'diamond'],
                    symbollegend: 'symbollegend'
                }
            }], {
                symbollegend: { visible: true }
            })
            .then(function() {
                return Plotly.relayout(gd, 'symbollegend.x', 0.5);
            })
            .then(function() {
                // Legend should still exist after relayout
                var legend = d3Select('.symbollegend');
                expect(legend.size()).toBe(1);
            })
            .then(done, done.fail);
        });

        it('should apply symbol size setting', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    symbol: ['circle', 'square', 'diamond'],
                    symbollegend: 'symbollegend'
                }
            }], {
                symbollegend: {
                    visible: true,
                    symbolsize: 20
                }
            })
            .then(function() {
                var paths = d3SelectAll('.symbollegend-item path.symbol');
                expect(paths.size()).toBe(3);
            })
            .then(done, done.fail);
        });

        it('should handle multiple traces referencing same symbollegend', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2],
                y: [1, 2],
                marker: {
                    symbol: ['circle', 'square'],
                    symbollegend: 'symbollegend'
                }
            }, {
                type: 'scatter',
                mode: 'markers',
                x: [3, 4],
                y: [3, 4],
                marker: {
                    symbol: ['square', 'diamond'],
                    symbollegend: 'symbollegend'
                }
            }], {
                symbollegend: { visible: true }
            })
            .then(function() {
                var items = d3SelectAll('.symbollegend-item');
                expect(items.size()).toBe(3); // circle, square, diamond (combined from both traces)
            })
            .then(done, done.fail);
        });

        it('should handle open symbols', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    symbol: ['circle', 'circle-open', 'circle-dot'],
                    symbollegend: 'symbollegend'
                }
            }], {
                symbollegend: { visible: true }
            })
            .then(function() {
                var items = d3SelectAll('.symbollegend-item');
                expect(items.size()).toBe(3);
            })
            .then(done, done.fail);
        });
    });
});
