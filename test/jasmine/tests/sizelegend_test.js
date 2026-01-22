'use strict';

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var Plots = require('../../../src/plots/plots');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var supplyAllDefaults = require('../assets/supply_defaults');

describe('Size legend', function() {
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

        it('should create sizelegend when trace references it', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    size: [10, 20, 30],
                    sizelegend: 'sizelegend'
                }
            }], {
                sizelegend: { visible: true }
            });

            expect(gd._fullData[0].marker.sizelegend).toBe('sizelegend');
            expect(gd._fullLayout.sizelegend).toBeDefined();
            expect(gd._fullLayout.sizelegend.visible).toBe(true);
        });

        it('should support multiple sizelegends', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    size: [10, 20, 30],
                    sizelegend: 'sizelegend'
                }
            }, {
                type: 'scatter',
                x: [1, 2, 3],
                y: [2, 3, 4],
                marker: {
                    size: [5, 15, 25],
                    sizelegend: 'sizelegend2'
                }
            }], {
                sizelegend: { title: { text: 'Legend 1' } },
                sizelegend2: { title: { text: 'Legend 2' } }
            });

            expect(gd._fullLayout.sizelegend).toBeDefined();
            expect(gd._fullLayout.sizelegend2).toBeDefined();
            expect(gd._fullLayout._sizelegends).toContain('sizelegend');
            expect(gd._fullLayout._sizelegends).toContain('sizelegend2');
        });

        it('should apply default values', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    size: [10, 20, 30],
                    sizelegend: 'sizelegend'
                }
            }]);

            var sizelegend = gd._fullLayout.sizelegend;
            expect(sizelegend.visible).toBe(true);
            expect(sizelegend.x).toBe(1.02);
            expect(sizelegend.y).toBe(0.5);
            expect(sizelegend.xanchor).toBe('left');
            expect(sizelegend.yanchor).toBe('middle');
            expect(sizelegend.orientation).toBe('v');
            expect(sizelegend.nsamples).toBe(4);
            expect(sizelegend.symbolcolor).toBe('#444');
            expect(sizelegend.symboloutlinecolor).toBe('#444');
            expect(sizelegend.symboloutlinewidth).toBe(1);
            expect(sizelegend.itemclick).toBe('toggle');
            expect(sizelegend.itemdoubleclick).toBe('toggleothers');
        });

        it('should not create sizelegend when no traces reference it', function() {
            var gd = _supply([{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: { size: 10 }
            }], {
                sizelegend: { visible: true }
            });

            expect(gd._fullLayout._sizelegends).toEqual([]);
        });
    });

    describe('rendering', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should render sizelegend with size samples', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3, 4, 5],
                y: [1, 2, 3, 4, 5],
                marker: {
                    size: [10, 20, 30, 40, 50],
                    sizelegend: 'sizelegend'
                }
            }], {
                sizelegend: { visible: true }
            })
            .then(function() {
                var legendGroup = d3Select('.sizelegend');
                expect(legendGroup.size()).toBe(1);

                var items = d3SelectAll('.sizelegend-item');
                expect(items.size()).toBe(4); // default nsamples
            })
            .then(done, done.fail);
        });

        it('should render circles for size symbols', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    size: [10, 20, 30],
                    sizelegend: 'sizelegend'
                }
            }], {
                sizelegend: { visible: true }
            })
            .then(function() {
                var circles = d3SelectAll('.sizelegend-item circle.symbol');
                expect(circles.size()).toBeGreaterThan(0);
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
                    size: [10, 20, 30],
                    sizelegend: 'sizelegend'
                }
            }], {
                sizelegend: {
                    visible: true,
                    title: { text: 'Size Values' }
                }
            })
            .then(function() {
                var title = d3Select('.sizelegend .legendtitle');
                expect(title.size()).toBe(1);
                expect(title.text()).toBe('Size Values');
            })
            .then(done, done.fail);
        });

        it('should respect nsamples setting', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                y: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                marker: {
                    size: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
                    sizelegend: 'sizelegend'
                }
            }], {
                sizelegend: {
                    visible: true,
                    nsamples: 6
                }
            })
            .then(function() {
                var items = d3SelectAll('.sizelegend-item');
                expect(items.size()).toBe(6);
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
                    size: [10, 20, 30],
                    sizelegend: 'sizelegend'
                }
            }], {
                sizelegend: { visible: false }
            })
            .then(function() {
                var legendGroup = d3Select('.sizelegend');
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
                    size: [10, 20, 30],
                    sizelegend: 'sizelegend'
                }
            }], {
                sizelegend: { visible: true }
            })
            .then(function() {
                return Plotly.relayout(gd, 'sizelegend.x', 0.5);
            })
            .then(function() {
                // Legend should still exist after relayout
                var legend = d3Select('.sizelegend');
                expect(legend.size()).toBe(1);
            })
            .then(done, done.fail);
        });

        it('should apply symbol colors', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2, 3],
                y: [1, 2, 3],
                marker: {
                    size: [10, 20, 30],
                    sizelegend: 'sizelegend'
                }
            }], {
                sizelegend: {
                    visible: true,
                    symbolcolor: 'blue',
                    symboloutlinecolor: 'red',
                    symboloutlinewidth: 2
                }
            })
            .then(function() {
                var circles = d3SelectAll('.sizelegend-item circle.symbol');
                expect(circles.size()).toBeGreaterThan(0);
            })
            .then(done, done.fail);
        });

        it('should handle multiple traces referencing same sizelegend', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatter',
                mode: 'markers',
                x: [1, 2],
                y: [1, 2],
                marker: {
                    size: [10, 20],
                    sizelegend: 'sizelegend'
                }
            }, {
                type: 'scatter',
                mode: 'markers',
                x: [3, 4],
                y: [3, 4],
                marker: {
                    size: [30, 40],
                    sizelegend: 'sizelegend'
                }
            }], {
                sizelegend: { visible: true }
            })
            .then(function() {
                var items = d3SelectAll('.sizelegend-item');
                expect(items.size()).toBe(4); // combined range sampled
            })
            .then(done, done.fail);
        });
    });
});
