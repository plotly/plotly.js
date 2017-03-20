var PlotlyInternal = require('@src/plotly');

var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Color = require('@src/components/color');
var tinycolor = require('tinycolor2');

var handleTickValueDefaults = require('@src/plots/cartesian/tick_value_defaults');
var Axes = PlotlyInternal.Axes;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test axes', function() {
    'use strict';

    describe('swap', function() {
        it('should swap most attributes and fix placeholder titles', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {
                    xaxis: {
                        title: 'A Title!!!',
                        type: 'log',
                        autorange: 'reversed',
                        rangemode: 'tozero',
                        tickmode: 'auto',
                        nticks: 23,
                        ticks: 'outside',
                        mirror: 'ticks',
                        ticklen: 12,
                        tickwidth: 4,
                        tickcolor: '#f00'
                    },
                    yaxis: {
                        title: 'Click to enter Y axis title',
                        type: 'date'
                    }
                }
            };
            var expectedYaxis = Lib.extendDeep({}, gd.layout.xaxis),
                expectedXaxis = {
                    title: 'Click to enter X axis title',
                    type: 'date'
                };

            Plots.supplyDefaults(gd);

            Axes.swap(gd, [0]);

            expect(gd.layout.xaxis).toEqual(expectedXaxis);
            expect(gd.layout.yaxis).toEqual(expectedYaxis);
        });

        it('should not swap noSwapAttrs', function() {
            // for reference:
            // noSwapAttrs = ['anchor', 'domain', 'overlaying', 'position', 'side', 'tickangle'];
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {
                    xaxis: {
                        anchor: 'free',
                        domain: [0, 1],
                        overlaying: false,
                        position: 0.2,
                        tickangle: 60
                    },
                    yaxis: {
                        anchor: 'x',
                        domain: [0.1, 0.9]
                    }
                }
            };
            var expectedLayoutAfter = Lib.extendDeep({}, gd.layout);
            expectedLayoutAfter.xaxis.type = 'linear';
            expectedLayoutAfter.yaxis.type = 'linear';

            Plots.supplyDefaults(gd);

            Axes.swap(gd, [0]);

            expect(gd.layout.xaxis).toEqual(expectedLayoutAfter.xaxis);
            expect(gd.layout.yaxis).toEqual(expectedLayoutAfter.yaxis);
        });

        it('should swap shared attributes, combine linear/log, and move annotations', function() {
            var gd = {
                data: [
                    {x: [1, 2, 3], y: [1, 2, 3]},
                    {x: [1, 2, 3], y: [1, 2, 3], xaxis: 'x2'}
                ],
                layout: {
                    xaxis: {
                        type: 'linear', // combine linear/log
                        ticks: 'outside', // same as x2
                        ticklen: 5, // default value
                        tickwidth: 2, // different
                        side: 'top', // noSwap
                        domain: [0, 0.45] // noSwap
                    },
                    xaxis2: {
                        type: 'log',
                        ticks: 'outside',
                        tickcolor: '#444', // default value in 2nd axis
                        tickwidth: 3,
                        side: 'top',
                        domain: [0.55, 1]
                    },
                    yaxis: {
                        type: 'category',
                        ticks: 'inside',
                        ticklen: 10,
                        tickcolor: '#f00',
                        tickwidth: 4,
                        showline: true, // not present in either x
                        side: 'right'
                    },
                    annotations: [
                        {x: 2, y: 3}, // xy referenced by default
                        {x: 3, y: 4, xref: 'x2', yref: 'y'},
                        {x: 5, y: 0.5, xref: 'x', yref: 'paper'} // any paper ref -> don't swap
                    ]
                }
            };
            var expectedXaxis = {
                    type: 'category',
                    ticks: 'inside',
                    ticklen: 10,
                    tickcolor: '#f00',
                    tickwidth: 2,
                    showline: true,
                    side: 'top',
                    domain: [0, 0.45]
                },
                expectedXaxis2 = {
                    type: 'category',
                    ticks: 'inside',
                    ticklen: 10,
                    tickcolor: '#f00',
                    tickwidth: 3,
                    showline: true,
                    side: 'top',
                    domain: [0.55, 1]
                },
                expectedYaxis = {
                    type: 'linear',
                    ticks: 'outside',
                    ticklen: 5,
                    tickwidth: 4,
                    side: 'right'
                },
                expectedAnnotations = [
                    {x: 3, y: 2},
                    {x: 4, y: 3, xref: 'x2', yref: 'y'},
                    {x: 5, y: 0.5, xref: 'x', yref: 'paper'}
                ];

            Plots.supplyDefaults(gd);

            Axes.swap(gd, [0, 1]);

            expect(gd.layout.xaxis).toEqual(expectedXaxis);
            expect(gd.layout.xaxis2).toEqual(expectedXaxis2);
            expect(gd.layout.yaxis).toEqual(expectedYaxis);
            expect(gd.layout.annotations).toEqual(expectedAnnotations);
        });
    });

    describe('supplyLayoutDefaults', function() {
        var layoutIn, layoutOut, fullData;

        beforeEach(function() {
            layoutOut = {
                _has: Plots._hasPlotType,
                _basePlotModules: []
            };
            fullData = [];
        });

        var supplyLayoutDefaults = Axes.supplyLayoutDefaults;

        it('should set undefined linewidth/linecolor if linewidth, linecolor or showline is not supplied', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {}
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.linewidth).toBe(undefined);
            expect(layoutOut.xaxis.linecolor).toBe(undefined);
            expect(layoutOut.yaxis.linewidth).toBe(undefined);
            expect(layoutOut.yaxis.linecolor).toBe(undefined);
        });

        it('should set default linewidth and linecolor if showline is true', function() {
            layoutIn = {
                xaxis: {showline: true}
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.linewidth).toBe(1);
            expect(layoutOut.xaxis.linecolor).toBe(Color.defaultLine);
        });

        it('should set linewidth to default if linecolor is supplied and valid', function() {
            layoutIn = {
                xaxis: { linecolor: 'black' }
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.linecolor).toBe('black');
            expect(layoutOut.xaxis.linewidth).toBe(1);
        });

        it('should set linecolor to default if linewidth is supplied and valid', function() {
            layoutIn = {
                yaxis: { linewidth: 2 }
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.yaxis.linewidth).toBe(2);
            expect(layoutOut.yaxis.linecolor).toBe(Color.defaultLine);
        });

        it('should set default gridwidth and gridcolor', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {}
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            var lightLine = tinycolor(Color.lightLine).toRgbString();
            expect(layoutOut.xaxis.gridwidth).toBe(1);
            expect(tinycolor(layoutOut.xaxis.gridcolor).toRgbString()).toBe(lightLine);
            expect(layoutOut.yaxis.gridwidth).toBe(1);
            expect(tinycolor(layoutOut.yaxis.gridcolor).toRgbString()).toBe(lightLine);
        });

        it('should set gridcolor/gridwidth to undefined if showgrid is false', function() {
            layoutIn = {
                yaxis: {showgrid: false}
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.yaxis.gridwidth).toBe(undefined);
            expect(layoutOut.yaxis.gridcolor).toBe(undefined);
        });

        it('should set default zerolinecolor/zerolinewidth', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {}
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.zerolinewidth).toBe(1);
            expect(layoutOut.xaxis.zerolinecolor).toBe(Color.defaultLine);
            expect(layoutOut.yaxis.zerolinewidth).toBe(1);
            expect(layoutOut.yaxis.zerolinecolor).toBe(Color.defaultLine);
        });

        it('should set zerolinecolor/zerolinewidth to undefined if zeroline is false', function() {
            layoutIn = {
                xaxis: {zeroline: false}
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.zerolinewidth).toBe(undefined);
            expect(layoutOut.xaxis.zerolinecolor).toBe(undefined);
        });

        it('should detect orphan axes (lone axes case)', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {}
            };
            fullData = [];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut._basePlotModules[0].name).toEqual('cartesian');
        });

        it('should detect orphan axes (gl2d trace conflict case)', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {}
            };
            fullData = [{
                type: 'scattergl',
                xaxis: 'x',
                yaxis: 'y'
            }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut._basePlotModules).toEqual([]);
        });

        it('should detect orphan axes (gl2d + cartesian case)', function() {
            layoutIn = {
                xaxis2: {},
                yaxis2: {}
            };
            fullData = [{
                type: 'scattergl',
                xaxis: 'x',
                yaxis: 'y'
            }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut._basePlotModules[0].name).toEqual('cartesian');
        });

        it('should detect orphan axes (gl3d present case)', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {}
            };
            layoutOut._basePlotModules = [ { name: 'gl3d' }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut._basePlotModules).toEqual([ { name: 'gl3d' }]);
        });

        it('should detect orphan axes (geo present case)', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {}
            };
            layoutOut._basePlotModules = [ { name: 'geo' }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut._basePlotModules).toEqual([ { name: 'geo' }]);
        });

        it('should use \'axis.color\' as default for \'axis.titlefont.color\'', function() {
            layoutIn = {
                xaxis: { color: 'red' },
                yaxis: {},
                yaxis2: { titlefont: { color: 'yellow' } }
            };

            layoutOut.font = { color: 'blue' },

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.titlefont.color).toEqual('red');
            expect(layoutOut.yaxis.titlefont.color).toEqual('blue');
            expect(layoutOut.yaxis2.titlefont.color).toEqual('yellow');
        });

        it('should use \'axis.color\' as default for \'axis.linecolor\'', function() {
            layoutIn = {
                xaxis: { showline: true, color: 'red' },
                yaxis: { linecolor: 'blue' },
                yaxis2: { showline: true }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.linecolor).toEqual('red');
            expect(layoutOut.yaxis.linecolor).toEqual('blue');
            expect(layoutOut.yaxis2.linecolor).toEqual('#444');
        });

        it('should use \'axis.color\' as default for \'axis.zerolinecolor\'', function() {
            layoutIn = {
                xaxis: { showzeroline: true, color: 'red' },
                yaxis: { zerolinecolor: 'blue' },
                yaxis2: { showzeroline: true }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.zerolinecolor).toEqual('red');
            expect(layoutOut.yaxis.zerolinecolor).toEqual('blue');
            expect(layoutOut.yaxis2.zerolinecolor).toEqual('#444');
        });

        it('should use combo of \'axis.color\', bgcolor and lightFraction as default for \'axis.gridcolor\'', function() {
            layoutIn = {
                paper_bgcolor: 'green',
                plot_bgcolor: 'yellow',
                xaxis: { showgrid: true, color: 'red' },
                yaxis: { gridcolor: 'blue' },
                yaxis2: { showgrid: true }
            };

            var bgColor = Color.combine('yellow', 'green'),
                frac = 100 * (0xe - 0x4) / (0xf - 0x4);

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.gridcolor)
                .toEqual(tinycolor.mix('red', bgColor, frac).toRgbString());
            expect(layoutOut.yaxis.gridcolor).toEqual('blue');
            expect(layoutOut.yaxis2.gridcolor)
                .toEqual(tinycolor.mix('#444', bgColor, frac).toRgbString());
        });

        it('should inherit calendar from the layout', function() {
            layoutOut.calendar = 'nepali';
            layoutIn = {
                calendar: 'nepali',
                xaxis: {type: 'date'},
                yaxis: {type: 'date'}
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.calendar).toBe('nepali');
            expect(layoutOut.yaxis.calendar).toBe('nepali');
        });

        it('should allow its own calendar', function() {
            layoutOut.calendar = 'nepali';
            layoutIn = {
                calendar: 'nepali',
                xaxis: {type: 'date', calendar: 'coptic'},
                yaxis: {type: 'date', calendar: 'thai'}
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.calendar).toBe('coptic');
            expect(layoutOut.yaxis.calendar).toBe('thai');
        });

        it('should set autorange to true when input range is invalid', function() {
            layoutIn = {
                xaxis: { range: 'not-gonna-work' },
                xaxis2: { range: [1, 2, 3] },
                yaxis: { range: ['a', 2] },
                yaxis2: { range: [1, 'b'] },
                yaxis3: { range: [null, {}] }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            Axes.list({ _fullLayout: layoutOut }).forEach(function(ax) {
                expect(ax.autorange).toBe(true, ax._name);
            });
        });

        it('should set autorange to false when input range is valid', function() {
            layoutIn = {
                xaxis: { range: [1, 2] },
                xaxis2: { range: [-2, 1] },
                yaxis: { range: ['1', 2] },
                yaxis2: { range: [1, '2'] }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            Axes.list({ _fullLayout: layoutOut }).forEach(function(ax) {
                expect(ax.autorange).toBe(false, ax._name);
            });
        });
    });

    describe('categoryorder', function() {

        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        describe('setting, or not setting categoryorder if it is not explicitly declared', function() {

            it('should set categoryorder to default if categoryorder and categoryarray are not supplied', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {xaxis: {type: 'category'}});
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
            });

            it('should set categoryorder to default even if type is not set to category explicitly', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}]);
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
            });

            it('should NOT set categoryorder to default if type is not category', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}]);
                expect(gd._fullLayout.yaxis.categoryorder).toBe(undefined);
                expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
            });

            it('should set categoryorder to default if type is overridden to be category', function() {
                PlotlyInternal.plot(gd, [{x: [1, 2, 3, 4, 5], y: [15, 11, 12, 13, 14]}], {yaxis: {type: 'category'}});
                expect(gd._fullLayout.xaxis.categoryorder).toBe(undefined);
                expect(gd._fullLayout.yaxis.categorarray).toBe(undefined);
                expect(gd._fullLayout.yaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.yaxis.categorarray).toBe(undefined);
            });

        });

        describe('setting categoryorder to "array"', function() {

            it('should leave categoryorder on "array" if it is supplied', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'array', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('array');
                expect(gd._fullLayout.xaxis.categoryarray).toEqual(['b', 'a', 'd', 'e', 'c']);
            });

            it('should switch categoryorder on "array" if it is not supplied but categoryarray is supplied', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('array');
                expect(gd._fullLayout.xaxis.categoryarray).toEqual(['b', 'a', 'd', 'e', 'c']);
            });

            it('should revert categoryorder to "trace" if "array" is supplied but there is no list', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'array'}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
            });

        });

        describe('do not set categoryorder to "array" if list exists but empty', function() {

            it('should switch categoryorder to default if list is not supplied', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'array', categoryarray: []}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categoryarray).toEqual([]);
            });

            it('should not switch categoryorder on "array" if categoryarray is supplied but empty', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryarray: []}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categoryarray).toEqual(undefined);
            });
        });

        describe('do NOT set categoryorder to "array" if it has some other proper value', function() {

            it('should use specified categoryorder if it is supplied even if categoryarray exists', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'trace', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
            });

            it('should use specified categoryorder if it is supplied even if categoryarray exists', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'category ascending', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('category ascending');
                expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
            });

            it('should use specified categoryorder if it is supplied even if categoryarray exists', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'category descending', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('category descending');
                expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
            });

        });

        describe('setting categoryorder to the default if the value is unexpected', function() {

            it('should switch categoryorder to "trace" if mode is supplied but invalid', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'invalid value'}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
            });

            it('should switch categoryorder to "array" if mode is supplied but invalid and list is supplied', function() {
                PlotlyInternal.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'invalid value', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('array');
                expect(gd._fullLayout.xaxis.categoryarray).toEqual(['b', 'a', 'd', 'e', 'c']);
            });

        });

    });

    describe('handleTickDefaults', function() {
        var data = [{ x: [1, 2, 3], y: [3, 4, 5] }],
            gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should set defaults on bad inputs', function() {
            var layout = {
                yaxis: {
                    ticklen: 'invalid',
                    tickwidth: 'invalid',
                    tickcolor: 'invalid',
                    showticklabels: 'invalid',
                    tickfont: 'invalid',
                    tickangle: 'invalid'
                }
            };

            PlotlyInternal.plot(gd, data, layout);

            var yaxis = gd._fullLayout.yaxis;
            expect(yaxis.ticklen).toBe(5);
            expect(yaxis.tickwidth).toBe(1);
            expect(yaxis.tickcolor).toBe('#444');
            expect(yaxis.ticks).toBe('outside');
            expect(yaxis.showticklabels).toBe(true);
            expect(yaxis.tickfont).toEqual({ family: '"Open Sans", verdana, arial, sans-serif', size: 12, color: '#444' });
            expect(yaxis.tickangle).toBe('auto');
        });

        it('should use valid inputs', function() {
            var layout = {
                yaxis: {
                    ticklen: 10,
                    tickwidth: 5,
                    tickcolor: '#F00',
                    showticklabels: true,
                    tickfont: { family: 'Garamond', size: 72, color: '#0FF' },
                    tickangle: -20
                }
            };

            PlotlyInternal.plot(gd, data, layout);

            var yaxis = gd._fullLayout.yaxis;
            expect(yaxis.ticklen).toBe(10);
            expect(yaxis.tickwidth).toBe(5);
            expect(yaxis.tickcolor).toBe('#F00');
            expect(yaxis.ticks).toBe('outside');
            expect(yaxis.showticklabels).toBe(true);
            expect(yaxis.tickfont).toEqual({ family: 'Garamond', size: 72, color: '#0FF' });
            expect(yaxis.tickangle).toBe(-20);
        });

        it('should conditionally coerce based on showticklabels', function() {
            var layout = {
                yaxis: {
                    showticklabels: false,
                    tickangle: -90
                }
            };

            PlotlyInternal.plot(gd, data, layout);

            var yaxis = gd._fullLayout.yaxis;
            expect(yaxis.tickangle).toBeUndefined();
        });
    });

    describe('handleTickValueDefaults', function() {
        function mockSupplyDefaults(axIn, axOut, axType) {
            function coerce(attr, dflt) {
                return Lib.coerce(axIn, axOut, Axes.layoutAttributes, attr, dflt);
            }

            handleTickValueDefaults(axIn, axOut, coerce, axType);
        }

        it('should set default tickmode correctly', function() {
            var axIn = {},
                axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('auto');

            axIn = {tickmode: 'array', tickvals: 'stuff'};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('auto');

            axIn = {tickmode: 'array', tickvals: [1, 2, 3]};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'date');
            expect(axOut.tickmode).toBe('auto');

            axIn = {tickvals: [1, 2, 3]};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('array');

            axIn = {dtick: 1};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('linear');
        });

        it('should set nticks iff tickmode=auto', function() {
            var axIn = {},
                axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.nticks).toBe(0);

            axIn = {tickmode: 'auto', nticks: 5};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.nticks).toBe(5);

            axIn = {tickmode: 'linear', nticks: 15};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.nticks).toBe(undefined);
        });

        it('should set tick0 and dtick iff tickmode=linear', function() {
            var axIn = {tickmode: 'auto', tick0: 1, dtick: 1},
                axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tick0).toBe(undefined);
            expect(axOut.dtick).toBe(undefined);

            axIn = {tickvals: [1, 2, 3], tick0: 1, dtick: 1};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tick0).toBe(undefined);
            expect(axOut.dtick).toBe(undefined);

            axIn = {tick0: 2.71, dtick: 0.00828};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tick0).toBe(2.71);
            expect(axOut.dtick).toBe(0.00828);

            axIn = {tickmode: 'linear', tick0: 3.14, dtick: 0.00159};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tick0).toBe(3.14);
            expect(axOut.dtick).toBe(0.00159);
        });

        it('should handle tick0 and dtick for date axes', function() {
            var someMs = 123456789,
                someMsDate = Lib.ms2DateTimeLocal(someMs),
                oneDay = 24 * 3600 * 1000,
                axIn = {tick0: someMs, dtick: String(3 * oneDay)},
                axOut = {};
            mockSupplyDefaults(axIn, axOut, 'date');
            expect(axOut.tick0).toBe(someMsDate);
            expect(axOut.dtick).toBe(3 * oneDay);

            var someDate = '2011-12-15 13:45:56';
            axIn = {tick0: someDate, dtick: 'M15'};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'date');
            expect(axOut.tick0).toBe(someDate);
            expect(axOut.dtick).toBe('M15');

            // dtick without tick0: get the right default
            axIn = {dtick: 'M12'};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'date');
            expect(axOut.tick0).toBe('2000-01-01');
            expect(axOut.dtick).toBe('M12');

            // now some stuff that shouldn't work, should give defaults
            [
                ['next thursday', -1],
                ['123-45', 'L1'],
                ['', 'M0.5'],
                ['', 'M-1'],
                ['', '2000-01-01']
            ].forEach(function(v) {
                axIn = {tick0: v[0], dtick: v[1]};
                axOut = {};
                mockSupplyDefaults(axIn, axOut, 'date');
                expect(axOut.tick0).toBe('2000-01-01');
                expect(axOut.dtick).toBe(oneDay);
            });
        });

        it('should handle tick0 and dtick for log axes', function() {
            var axIn = {tick0: '0.2', dtick: 0.3},
                axOut = {};
            mockSupplyDefaults(axIn, axOut, 'log');
            expect(axOut.tick0).toBe(0.2);
            expect(axOut.dtick).toBe(0.3);

            ['D1', 'D2'].forEach(function(v) {
                axIn = {tick0: -1, dtick: v};
                axOut = {};
                mockSupplyDefaults(axIn, axOut, 'log');
                // tick0 gets ignored for D<n>
                expect(axOut.tick0).toBe(0);
                expect(axOut.dtick).toBe(v);
            });

            [
                [-1, 'L3'],
                ['0.2', 'L0.3'],
                [-1, 3],
                ['0.1234', '0.69238473']
            ].forEach(function(v) {
                axIn = {tick0: v[0], dtick: v[1]};
                axOut = {};
                mockSupplyDefaults(axIn, axOut, 'log');
                expect(axOut.tick0).toBe(Number(v[0]));
                expect(axOut.dtick).toBe((+v[1]) ? Number(v[1]) : v[1]);
            });

            // now some stuff that should not work, should give defaults
            [
                ['', -1],
                ['D1', 'D3'],
                ['', 'D0'],
                ['2011-01-01', 'L0'],
                ['', 'L-1']
            ].forEach(function(v) {
                axIn = {tick0: v[0], dtick: v[1]};
                axOut = {};
                mockSupplyDefaults(axIn, axOut, 'log');
                expect(axOut.tick0).toBe(0);
                expect(axOut.dtick).toBe(1);
            });

        });

        it('should set tickvals and ticktext iff tickmode=array', function() {
            var axIn = {tickmode: 'auto', tickvals: [1, 2, 3], ticktext: ['4', '5', '6']},
                axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickvals).toBe(undefined);
            expect(axOut.ticktext).toBe(undefined);

            axIn = {tickvals: [2, 4, 6, 8], ticktext: ['who', 'do', 'we', 'appreciate']};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickvals).toEqual([2, 4, 6, 8]);
            expect(axOut.ticktext).toEqual(['who', 'do', 'we', 'appreciate']);
        });
    });

    describe('saveRangeInitial', function() {
        var saveRangeInitial = Axes.saveRangeInitial;
        var gd, hasOneAxisChanged;

        beforeEach(function() {
            gd = {
                _fullLayout: {
                    xaxis: { range: [0, 0.5] },
                    yaxis: { range: [0, 0.5] },
                    xaxis2: { range: [0.5, 1] },
                    yaxis2: { range: [0.5, 1] }
                }
            };
        });

        it('should save range when autosize turned off and rangeInitial isn\'t defined', function() {
            ['xaxis', 'yaxis', 'xaxis2', 'yaxis2'].forEach(function(ax) {
                gd._fullLayout[ax].autorange = false;
            });

            hasOneAxisChanged = saveRangeInitial(gd);

            expect(hasOneAxisChanged).toBe(true);
            expect(gd._fullLayout.xaxis._rangeInitial).toEqual([0, 0.5]);
            expect(gd._fullLayout.yaxis._rangeInitial).toEqual([0, 0.5]);
            expect(gd._fullLayout.xaxis2._rangeInitial).toEqual([0.5, 1]);
            expect(gd._fullLayout.yaxis2._rangeInitial).toEqual([0.5, 1]);
        });

        it('should not overwrite saved range if rangeInitial is defined', function() {
            ['xaxis', 'yaxis', 'xaxis2', 'yaxis2'].forEach(function(ax) {
                gd._fullLayout[ax]._rangeInitial = gd._fullLayout[ax].range.slice();
                gd._fullLayout[ax].range = [0, 1];
            });

            hasOneAxisChanged = saveRangeInitial(gd);

            expect(hasOneAxisChanged).toBe(false);
            expect(gd._fullLayout.xaxis._rangeInitial).toEqual([0, 0.5]);
            expect(gd._fullLayout.yaxis._rangeInitial).toEqual([0, 0.5]);
            expect(gd._fullLayout.xaxis2._rangeInitial).toEqual([0.5, 1]);
            expect(gd._fullLayout.yaxis2._rangeInitial).toEqual([0.5, 1]);
        });

        it('should save range when overwrite option is on and range has changed', function() {
            ['xaxis', 'yaxis', 'xaxis2', 'yaxis2'].forEach(function(ax) {
                gd._fullLayout[ax]._rangeInitial = gd._fullLayout[ax].range.slice();
            });
            gd._fullLayout.xaxis2.range = [0.2, 0.4];

            hasOneAxisChanged = saveRangeInitial(gd, true);
            expect(hasOneAxisChanged).toBe(true);
            expect(gd._fullLayout.xaxis._rangeInitial).toEqual([0, 0.5]);
            expect(gd._fullLayout.yaxis._rangeInitial).toEqual([0, 0.5]);
            expect(gd._fullLayout.xaxis2._rangeInitial).toEqual([0.2, 0.4]);
            expect(gd._fullLayout.yaxis2._rangeInitial).toEqual([0.5, 1]);
        });
    });

    describe('list', function() {
        var listFunc = Axes.list;
        var gd;

        it('returns empty array when no fullLayout is present', function() {
            gd = {};

            expect(listFunc(gd)).toEqual([]);
        });

        it('returns array of axes in fullLayout', function() {
            gd = {
                _fullLayout: {
                    xaxis: { _id: 'x' },
                    yaxis: { _id: 'y' },
                    yaxis2: { _id: 'y2' }
                }
            };

            expect(listFunc(gd))
                .toEqual([{ _id: 'x' }, { _id: 'y' }, { _id: 'y2' }]);
        });

        it('returns array of axes, including the ones in scenes', function() {
            gd = {
                _fullLayout: {
                    scene: {
                        xaxis: { _id: 'x' },
                        yaxis: { _id: 'y' },
                        zaxis: { _id: 'z' }
                    },
                    scene2: {
                        xaxis: { _id: 'x' },
                        yaxis: { _id: 'y' },
                        zaxis: { _id: 'z' }
                    }
                }
            };

            expect(listFunc(gd))
                .toEqual([
                    { _id: 'x' }, { _id: 'y' }, { _id: 'z' },
                    { _id: 'x' }, { _id: 'y' }, { _id: 'z' }
                ]);
        });

        it('returns array of axes, excluding the ones in scenes with only2d option', function() {
            gd = {
                _fullLayout: {
                    scene: {
                        xaxis: { _id: 'x' },
                        yaxis: { _id: 'y' },
                        zaxis: { _id: 'z' }
                    },
                    xaxis2: { _id: 'x2' },
                    yaxis2: { _id: 'y2' }
                }
            };

            expect(listFunc(gd, '', true))
                .toEqual([{ _id: 'x2' }, { _id: 'y2' }]);
        });

        it('returns array of axes, of particular ax letter with axLetter option', function() {
            gd = {
                _fullLayout: {
                    scene: {
                        xaxis: { _id: 'x' },
                        yaxis: { _id: 'y' },
                        zaxis: { _id: 'z'
                        }
                    },
                    xaxis2: { _id: 'x2' },
                    yaxis2: { _id: 'y2' }
                }
            };

            expect(listFunc(gd, 'x'))
                .toEqual([{ _id: 'x2' }, { _id: 'x' }]);
        });

    });

    describe('getSubplots', function() {
        var getSubplots = Axes.getSubplots;
        var gd;

        it('returns list of subplots ids (from data only)', function() {
            gd = {
                data: [
                    { type: 'scatter' },
                    { type: 'scattergl', xaxis: 'x2', yaxis: 'y2' }
                ]
            };

            expect(getSubplots(gd))
                .toEqual(['xy', 'x2y2']);
        });

        it('returns list of subplots ids (from fullLayout only)', function() {
            gd = {
                _fullLayout: {
                    xaxis: { _id: 'x', anchor: 'y' },
                    yaxis: { _id: 'y', anchor: 'x' },
                    xaxis2: { _id: 'x2', anchor: 'y2' },
                    yaxis2: { _id: 'y2', anchor: 'x2' }
                }
            };

            expect(getSubplots(gd))
                .toEqual(['xy', 'x2y2']);
        });

        it('returns list of subplots ids of particular axis with ax option', function() {
            gd = {
                data: [
                    { type: 'scatter' },
                    { type: 'scattergl', xaxis: 'x3', yaxis: 'y3' }
                ],
                _fullLayout: {
                    xaxis2: { _id: 'x2', anchor: 'y2' },
                    yaxis2: { _id: 'y2', anchor: 'x2' },
                    yaxis3: { _id: 'y3', anchor: 'free' }
                }
            };

            expect(getSubplots(gd, { _id: 'x' }))
                .toEqual(['xy']);
        });
    });

    describe('getAutoRange', function() {
        var getAutoRange = Axes.getAutoRange;
        var ax;

        it('returns reasonable range without explicit rangemode or autorange', function() {
            ax = {
                _min: [
                    {val: 1, pad: 20},
                    {val: 3, pad: 0},
                    {val: 2, pad: 10}
                ],
                _max: [
                    {val: 6, pad: 10},
                    {val: 7, pad: 0},
                    {val: 5, pad: 20},
                ],
                type: 'linear',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([-0.5, 7]);
        });

        it('reverses axes', function() {
            ax = {
                _min: [
                    {val: 1, pad: 20},
                    {val: 3, pad: 0},
                    {val: 2, pad: 10}
                ],
                _max: [
                    {val: 6, pad: 10},
                    {val: 7, pad: 0},
                    {val: 5, pad: 20},
                ],
                type: 'linear',
                autorange: 'reversed',
                rangemode: 'normal',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([7, -0.5]);
        });

        it('expands empty range', function() {
            ax = {
                _min: [
                    {val: 2, pad: 0}
                ],
                _max: [
                    {val: 2, pad: 0}
                ],
                type: 'linear',
                rangemode: 'normal',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([1, 3]);
        });

        it('returns a lower bound of 0 on rangemode tozero with positive points', function() {
            ax = {
                _min: [
                    {val: 1, pad: 20},
                    {val: 3, pad: 0},
                    {val: 2, pad: 10}
                ],
                _max: [
                    {val: 6, pad: 10},
                    {val: 7, pad: 0},
                    {val: 5, pad: 20},
                ],
                type: 'linear',
                rangemode: 'tozero',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([0, 7]);
        });

        it('returns an upper bound of 0 on rangemode tozero with negative points', function() {
            ax = {
                _min: [
                    {val: -10, pad: 20},
                    {val: -8, pad: 0},
                    {val: -9, pad: 10}
                ],
                _max: [
                    {val: -5, pad: 20},
                    {val: -4, pad: 0},
                    {val: -6, pad: 10},
                ],
                type: 'linear',
                rangemode: 'tozero',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([-12.5, 0]);
        });

        it('returns a positive and negative range on rangemode tozero with positive and negative points', function() {
            ax = {
                _min: [
                    {val: -10, pad: 20},
                    {val: -8, pad: 0},
                    {val: -9, pad: 10}
                ],
                _max: [
                    {val: 6, pad: 10},
                    {val: 7, pad: 0},
                    {val: 5, pad: 20},
                ],
                type: 'linear',
                rangemode: 'tozero',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([-15, 10]);
        });

        it('reverses range after applying rangemode tozero', function() {
            ax = {
                _min: [
                    {val: 1, pad: 20},
                    {val: 3, pad: 0},
                    {val: 2, pad: 10}
                ],
                _max: [
                    {val: 6, pad: 20},
                    {val: 7, pad: 0},
                    {val: 5, pad: 10},
                ],
                type: 'linear',
                autorange: 'reversed',
                rangemode: 'tozero',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([7.5, 0]);
        });

        it('expands empty positive range to something including 0 with rangemode tozero', function() {
            ax = {
                _min: [
                    {val: 5, pad: 0}
                ],
                _max: [
                    {val: 5, pad: 0}
                ],
                type: 'linear',
                rangemode: 'tozero',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([0, 6]);
        });

        it('expands empty negative range to something including 0 with rangemode tozero', function() {
            ax = {
                _min: [
                    {val: -5, pad: 0}
                ],
                _max: [
                    {val: -5, pad: 0}
                ],
                type: 'linear',
                rangemode: 'tozero',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([-6, 0]);
        });

        it('never returns a negative range when rangemode nonnegative is set with positive and negative points', function() {
            ax = {
                _min: [
                    {val: -10, pad: 20},
                    {val: -8, pad: 0},
                    {val: -9, pad: 10}
                ],
                _max: [
                    {val: 6, pad: 20},
                    {val: 7, pad: 0},
                    {val: 5, pad: 10},
                ],
                type: 'linear',
                rangemode: 'nonnegative',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([0, 7.5]);
        });

        it('never returns a negative range when rangemode nonnegative is set with only negative points', function() {
            ax = {
                _min: [
                    {val: -10, pad: 20},
                    {val: -8, pad: 0},
                    {val: -9, pad: 10}
                ],
                _max: [
                    {val: -5, pad: 20},
                    {val: -4, pad: 0},
                    {val: -6, pad: 10},
                ],
                type: 'linear',
                rangemode: 'nonnegative',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([0, 1]);
        });

        it('expands empty range to something nonnegative with rangemode nonnegative', function() {
            ax = {
                _min: [
                    {val: -5, pad: 0}
                ],
                _max: [
                    {val: -5, pad: 0}
                ],
                type: 'linear',
                rangemode: 'nonnegative',
                _length: 100
            };

            expect(getAutoRange(ax)).toEqual([0, 1]);
        });
    });

    describe('expand', function() {
        var expand = Axes.expand;
        var ax, data, options;

        // Axes.expand modifies ax, so this provides a simple
        // way of getting a new clean copy each time.
        function getDefaultAx() {
            return {
                autorange: true,
                c2l: Number,
                type: 'linear',
                _length: 100,
                _m: 1
            };
        }

        it('constructs simple ax._min and ._max correctly', function() {
            ax = getDefaultAx();
            data = [1, 4, 7, 2];

            expand(ax, data);

            expect(ax._min).toEqual([{val: 1, pad: 0}]);
            expect(ax._max).toEqual([{val: 7, pad: 0}]);
        });

        it('calls ax.setScale if necessary', function() {
            ax = {
                autorange: true,
                c2l: Number,
                type: 'linear',
                setScale: function() {}
            };
            spyOn(ax, 'setScale');

            expand(ax, [1]);

            expect(ax.setScale).toHaveBeenCalled();
        });

        it('handles symmetric pads as numbers', function() {
            ax = getDefaultAx();
            data = [1, 4, 2, 7];
            options = {
                vpad: 2,
                ppad: 10
            };

            expand(ax, data, options);

            expect(ax._min).toEqual([{val: -1, pad: 10}]);
            expect(ax._max).toEqual([{val: 9, pad: 10}]);
        });

        it('handles symmetric pads as number arrays', function() {
            ax = getDefaultAx();
            data = [1, 4, 2, 7];
            options = {
                vpad: [1, 10, 6, 3],
                ppad: [0, 15, 20, 10]
            };

            expand(ax, data, options);

            expect(ax._min).toEqual([{val: -6, pad: 15}, {val: -4, pad: 20}]);
            expect(ax._max).toEqual([{val: 14, pad: 15}, {val: 8, pad: 20}]);
        });

        it('handles separate pads as numbers', function() {
            ax = getDefaultAx();
            data = [1, 4, 2, 7];
            options = {
                vpadminus: 5,
                vpadplus: 4,
                ppadminus: 10,
                ppadplus: 20
            };

            expand(ax, data, options);

            expect(ax._min).toEqual([{val: -4, pad: 10}]);
            expect(ax._max).toEqual([{val: 11, pad: 20}]);
        });

        it('handles separate pads as number arrays', function() {
            ax = getDefaultAx();
            data = [1, 4, 2, 7];
            options = {
                vpadminus: [0, 3, 5, 1],
                vpadplus: [8, 2, 1, 1],
                ppadminus: [0, 30, 10, 20],
                ppadplus: [0, 0, 40, 20]
            };

            expand(ax, data, options);

            expect(ax._min).toEqual([{val: 1, pad: 30}, {val: -3, pad: 10}]);
            expect(ax._max).toEqual([{val: 9, pad: 0}, {val: 3, pad: 40}, {val: 8, pad: 20}]);
        });

        it('overrides symmetric pads with separate pads', function() {
            ax = getDefaultAx();
            data = [1, 5];
            options = {
                vpad: 1,
                ppad: 10,
                vpadminus: 2,
                vpadplus: 4,
                ppadminus: 20,
                ppadplus: 40
            };

            expand(ax, data, options);

            expect(ax._min).toEqual([{val: -1, pad: 20}]);
            expect(ax._max).toEqual([{val: 9, pad: 40}]);
        });

        it('adds 5% padding if specified by flag', function() {
            ax = getDefaultAx();
            data = [1, 5];
            options = {
                vpad: 1,
                ppad: 10,
                padded: true
            };

            expand(ax, data, options);

            expect(ax._min).toEqual([{val: 0, pad: 15}]);
            expect(ax._max).toEqual([{val: 6, pad: 15}]);
        });

        it('has lower bound zero with all positive data if tozero is sset', function() {
            ax = getDefaultAx();
            data = [2, 5];
            options = {
                vpad: 1,
                ppad: 10,
                tozero: true
            };

            expand(ax, data, options);

            expect(ax._min).toEqual([{val: 0, pad: 0}]);
            expect(ax._max).toEqual([{val: 6, pad: 10}]);
        });

        it('has upper bound zero with all negative data if tozero is set', function() {
            ax = getDefaultAx();
            data = [-7, -4];
            options = {
                vpad: 1,
                ppad: 10,
                tozero: true
            };

            expand(ax, data, options);

            expect(ax._min).toEqual([{val: -8, pad: 10}]);
            expect(ax._max).toEqual([{val: 0, pad: 0}]);
        });

        it('sets neither bound to zero with positive and negative data if tozero is set', function() {
            ax = getDefaultAx();
            data = [-7, 4];
            options = {
                vpad: 1,
                ppad: 10,
                tozero: true
            };

            expand(ax, data, options);

            expect(ax._min).toEqual([{val: -8, pad: 10}]);
            expect(ax._max).toEqual([{val: 5, pad: 10}]);
        });

        it('overrides padded with tozero', function() {
            ax = getDefaultAx();
            data = [2, 5];
            options = {
                vpad: 1,
                ppad: 10,
                tozero: true,
                padded: true
            };

            expand(ax, data, options);

            expect(ax._min).toEqual([{val: 0, pad: 0}]);
            expect(ax._max).toEqual([{val: 6, pad: 15}]);
        });

        it('should return early if no data is given', function() {
            ax = getDefaultAx();

            expand(ax);
            expect(ax._min).toBeUndefined();
            expect(ax._max).toBeUndefined();
        });

        it('should return early if `autorange` is falsy', function() {
            ax = getDefaultAx();
            data = [2, 5];

            ax.autorange = false;
            ax.rangeslider = { autorange: false };

            expand(ax, data, {});
            expect(ax._min).toBeUndefined();
            expect(ax._max).toBeUndefined();
        });

        it('should consider range slider `autorange`', function() {
            ax = getDefaultAx();
            data = [2, 5];

            ax.autorange = false;
            ax.rangeslider = { autorange: true };

            expand(ax, data, {});
            expect(ax._min).toEqual([{val: 2, pad: 0}]);
            expect(ax._max).toEqual([{val: 5, pad: 0}]);
        });
    });

    describe('calcTicks and tickText', function() {
        function mockCalc(ax) {
            ax.tickfont = {};
            Axes.setConvert(ax, {separators: '.,'});
            return Axes.calcTicks(ax).map(function(v) { return v.text; });
        }

        function mockHoverText(ax, x) {
            var xCalc = (ax.d2l_noadd || ax.d2l)(x);
            var tickTextObj = Axes.tickText(ax, xCalc, true);
            return tickTextObj.text;
        }

        function checkHovers(ax, specArray) {
            specArray.forEach(function(v) {
                expect(mockHoverText(ax, v[0]))
                    .toBe(v[1], ax.dtick + ' - ' + v[0]);
            });
        }

        it('provides a new date suffix whenever the suffix changes', function() {
            var ax = {
                type: 'date',
                tickmode: 'linear',
                tick0: '2000-01-01',
                dtick: 14 * 24 * 3600 * 1000, // 14 days
                range: ['1999-12-01', '2000-02-15']
            };
            var textOut = mockCalc(ax);

            var expectedText = [
                'Dec 4<br>1999',
                'Dec 18',
                'Jan 1<br>2000',
                'Jan 15',
                'Jan 29',
                'Feb 12'
            ];
            expect(textOut).toEqual(expectedText);
            expect(mockHoverText(ax, '1999-12-18 15:34:33.3'))
                .toBe('Dec 18, 1999, 15:34');

            ax = {
                type: 'date',
                tickmode: 'linear',
                tick0: '2000-01-01',
                dtick: 12 * 3600 * 1000, // 12 hours
                range: ['2000-01-03 11:00', '2000-01-06']
            };
            textOut = mockCalc(ax);

            expectedText = [
                '12:00<br>Jan 3, 2000',
                '00:00<br>Jan 4, 2000',
                '12:00',
                '00:00<br>Jan 5, 2000',
                '12:00',
                '00:00<br>Jan 6, 2000'
            ];
            expect(textOut).toEqual(expectedText);
            expect(mockHoverText(ax, '2000-01-04 15:34:33.3'))
                .toBe('Jan 4, 2000, 15:34:33');

            ax = {
                type: 'date',
                tickmode: 'linear',
                tick0: '2000-01-01',
                dtick: 1000, // 1 sec
                range: ['2000-02-03 23:59:57', '2000-02-04 00:00:02']
            };
            textOut = mockCalc(ax);

            expectedText = [
                '23:59:57<br>Feb 3, 2000',
                '23:59:58',
                '23:59:59',
                '00:00:00<br>Feb 4, 2000',
                '00:00:01',
                '00:00:02'
            ];
            expect(textOut).toEqual(expectedText);
            expect(mockHoverText(ax, '2000-02-04 00:00:00.123456'))
                .toBe('Feb 4, 2000, 00:00:00.1235');
            expect(mockHoverText(ax, '2000-02-04 00:00:00'))
                .toBe('Feb 4, 2000');
        });

        it('should give dates extra precision if tick0 is weird', function() {
            var ax = {
                type: 'date',
                tickmode: 'linear',
                tick0: '2000-01-01 00:05',
                dtick: 14 * 24 * 3600 * 1000, // 14 days
                range: ['1999-12-01', '2000-02-15']
            };
            var textOut = mockCalc(ax);

            var expectedText = [
                '00:05<br>Dec 4, 1999',
                '00:05<br>Dec 18, 1999',
                '00:05<br>Jan 1, 2000',
                '00:05<br>Jan 15, 2000',
                '00:05<br>Jan 29, 2000',
                '00:05<br>Feb 12, 2000'
            ];
            expect(textOut).toEqual(expectedText);
            expect(mockHoverText(ax, '2000-02-04 00:00:00.123456'))
                .toBe('Feb 4, 2000');
            expect(mockHoverText(ax, '2000-02-04 00:00:05.123456'))
                .toBe('Feb 4, 2000, 00:00:05');
        });

        it('should never give dates more than 100 microsecond precision', function() {
            var ax = {
                type: 'date',
                tickmode: 'linear',
                tick0: '2000-01-01',
                dtick: 1.1333,
                range: ['2000-01-01', '2000-01-01 00:00:00.01']
            };
            var textOut = mockCalc(ax);

            var expectedText = [
                '00:00:00<br>Jan 1, 2000',
                '00:00:00.0011',
                '00:00:00.0023',
                '00:00:00.0034',
                '00:00:00.0045',
                '00:00:00.0057',
                '00:00:00.0068',
                '00:00:00.0079',
                '00:00:00.0091'
            ];
            expect(textOut).toEqual(expectedText);
        });

        it('should handle edge cases with dates and tickvals', function() {
            var ax = {
                type: 'date',
                tickmode: 'array',
                tickvals: [
                    '2012-01-01',
                    new Date(2012, 2, 1).getTime(),
                    '2012-08-01 00:00:00',
                    '2012-10-01 12:00:00',
                    new Date(2013, 0, 1, 0, 0, 1).getTime(),
                    '2010-01-01', '2014-01-01' // off the axis
                ],
                // only the first two have text
                ticktext: ['New year', 'February'],

                // required to get calcTicks to run
                range: ['2011-12-10', '2013-01-23'],
                nticks: 10
            };
            var textOut = mockCalc(ax);

            var expectedText = [
                'New year',
                'February',
                'Aug 1, 2012',
                '12:00<br>Oct 1, 2012',
                '00:00:01<br>Jan 1, 2013'
            ];
            expect(textOut).toEqual(expectedText);
            expect(mockHoverText(ax, '2012-01-01'))
                .toBe('New year');
            expect(mockHoverText(ax, '2012-01-01 12:34:56.1234'))
                .toBe('Jan 1, 2012, 12:34:56');
        });

        it('should handle tickvals edge cases with linear and log axes', function() {
            ['linear', 'log'].forEach(function(axType) {
                var ax = {
                    type: axType,
                    tickmode: 'array',
                    tickvals: [1, 1.5, 2.6999999, 30, 39.999, 100, 0.1],
                    ticktext: ['One', '...and a half'],
                    // I'll be so happy when I can finally get rid of this switch!
                    range: axType === 'log' ? [-0.2, 1.8] : [0.5, 50],
                    nticks: 10
                };
                var textOut = mockCalc(ax);

                var expectedText = [
                    'One',
                    '...and a half', // the first two get explicit labels
                    '2.7', // 2.6999999 gets rounded to 2.7
                    '30',
                    '39.999' // 39.999 does not get rounded
                    // 10 and 0.1 are off scale
                ];
                expect(textOut).toEqual(expectedText, axType);
                expect(mockHoverText(ax, 1)).toBe('One');
                expect(mockHoverText(ax, 19.999)).toBe('19.999');
            });
        });

        it('should handle tickvals edge cases with category axes', function() {
            var ax = {
                type: 'category',
                _categories: ['a', 'b', 'c', 'd'],
                tickmode: 'array',
                tickvals: ['a', 1, 1.5, 'c', 2.7, 3, 'e', 4, 5, -2],
                ticktext: ['A!', 'B?', 'B->C'],
                range: [-0.5, 4.5],
                nticks: 10
            };
            var textOut = mockCalc(ax);

            var expectedText = [
                'A!', // category position, explicit text
                'B?', // integer position, explicit text
                'B->C', // non-integer position, explicit text
                'c', // category position, no text: use category
                'd', // non-integer position, no text: use closest category
                'd', // integer position, no text: use category
                '' // 4: number with no close category: leave blank
                   //    but still include it so we get a tick mark & grid
                // 'e', 5, -2: bad category and numbers out of range: omitted
            ];
            expect(textOut).toEqual(expectedText);
            expect(mockHoverText(ax, 0)).toBe('A!');
            expect(mockHoverText(ax, 2)).toBe('c');
            expect(mockHoverText(ax, 4)).toBe('');

            // make sure we didn't add any more categories accidentally
            expect(ax._categories).toEqual(['a', 'b', 'c', 'd']);
        });

        it('should always start at year for date axis hover', function() {
            var ax = {
                type: 'date',
                tickmode: 'linear',
                tick0: '2000-01-01',
                dtick: 'M1200',
                range: ['1000-01-01', '3000-01-01'],
                nticks: 10
            };
            mockCalc(ax);

            checkHovers(ax, [
                ['2000-01-01', 'Jan 2000'],
                ['2000-01-01 11:00', 'Jan 2000'],
                ['2000-01-01 11:14', 'Jan 2000'],
                ['2000-01-01 11:00:15', 'Jan 2000'],
                ['2000-01-01 11:00:00.1', 'Jan 2000'],
                ['2000-01-01 11:00:00.0001', 'Jan 2000']
            ]);

            ax.dtick = 'M1';
            ax.range = ['1999-06-01', '2000-06-01'];
            mockCalc(ax);

            checkHovers(ax, [
                ['2000-01-01', 'Jan 1, 2000'],
                ['2000-01-01 11:00', 'Jan 1, 2000'],
                ['2000-01-01 11:14', 'Jan 1, 2000'],
                ['2000-01-01 11:00:15', 'Jan 1, 2000'],
                ['2000-01-01 11:00:00.1', 'Jan 1, 2000'],
                ['2000-01-01 11:00:00.0001', 'Jan 1, 2000']
            ]);

            ax.dtick = 24 * 3600000; // one day
            ax.range = ['1999-12-15', '2000-01-15'];
            mockCalc(ax);

            checkHovers(ax, [
                ['2000-01-01', 'Jan 1, 2000'],
                ['2000-01-01 11:00', 'Jan 1, 2000, 11:00'],
                ['2000-01-01 11:14', 'Jan 1, 2000, 11:14'],
                ['2000-01-01 11:00:15', 'Jan 1, 2000, 11:00'],
                ['2000-01-01 11:00:00.1', 'Jan 1, 2000, 11:00'],
                ['2000-01-01 11:00:00.0001', 'Jan 1, 2000, 11:00']
            ]);

            ax.dtick = 3600000; // one hour
            ax.range = ['1999-12-31', '2000-01-02'];
            mockCalc(ax);

            checkHovers(ax, [
                ['2000-01-01', 'Jan 1, 2000'],
                ['2000-01-01 11:00', 'Jan 1, 2000, 11:00'],
                ['2000-01-01 11:14', 'Jan 1, 2000, 11:14'],
                ['2000-01-01 11:00:15', 'Jan 1, 2000, 11:00:15'],
                ['2000-01-01 11:00:00.1', 'Jan 1, 2000, 11:00'],
                ['2000-01-01 11:00:00.0001', 'Jan 1, 2000, 11:00']
            ]);

            ax.dtick = 60000; // one minute
            ax.range = ['1999-12-31 23:00', '2000-01-01 01:00'];
            mockCalc(ax);

            checkHovers(ax, [
                ['2000-01-01', 'Jan 1, 2000'],
                ['2000-01-01 11:00', 'Jan 1, 2000, 11:00'],
                ['2000-01-01 11:14', 'Jan 1, 2000, 11:14'],
                ['2000-01-01 11:00:15', 'Jan 1, 2000, 11:00:15'],
                ['2000-01-01 11:00:00.1', 'Jan 1, 2000, 11:00'],
                ['2000-01-01 11:00:00.0001', 'Jan 1, 2000, 11:00']
            ]);

            ax.dtick = 1000; // one second
            ax.range = ['1999-12-31 23:59', '2000-01-01 00:01'];
            mockCalc(ax);

            checkHovers(ax, [
                ['2000-01-01', 'Jan 1, 2000'],
                ['2000-01-01 11:00', 'Jan 1, 2000, 11:00'],
                ['2000-01-01 11:14', 'Jan 1, 2000, 11:14'],
                ['2000-01-01 11:00:15', 'Jan 1, 2000, 11:00:15'],
                ['2000-01-01 11:00:00.1', 'Jan 1, 2000, 11:00:00.1'],
                ['2000-01-01 11:00:00.0001', 'Jan 1, 2000, 11:00:00.0001']
            ]);
        });
    });

    describe('autoBin', function() {

        function _autoBin(x, ax, nbins) {
            ax._categories = [];
            Axes.setConvert(ax);

            var d = ax.makeCalcdata({ x: x }, 'x');

            return Axes.autoBin(d, ax, nbins, false, 'gregorian');
        }

        it('should auto bin categories', function() {
            var out = _autoBin(
                ['apples', 'oranges', 'bananas'],
                { type: 'category' }
            );

            expect(out).toEqual({
                start: -0.5,
                end: 2.5,
                size: 1
            });
        });

        it('should not error out for categories on linear axis', function() {
            var out = _autoBin(
                ['apples', 'oranges', 'bananas'],
                { type: 'linear' }
            );

            expect(out).toEqual({
                start: undefined,
                end: undefined,
                size: 2
            });
        });

        it('should not error out for categories on log axis', function() {
            var out = _autoBin(
                ['apples', 'oranges', 'bananas'],
                { type: 'log' }
            );

            expect(out).toEqual({
                start: undefined,
                end: undefined,
                size: 2
            });
        });

        it('should not error out for categories on date axis', function() {
            var out = _autoBin(
                ['apples', 'oranges', 'bananas'],
                { type: 'date' }
            );

            expect(out).toEqual({
                start: undefined,
                end: undefined,
                size: 2
            });
        });

        it('should auto bin linear data', function() {
            var out = _autoBin(
                [1, 1, 2, 2, 3, 3, 4, 4],
                { type: 'linear' }
            );

            expect(out).toEqual({
                start: 0.5,
                end: 4.5,
                size: 1
            });
        });

        it('should auto bin linear data with nbins constraint', function() {
            var out = _autoBin(
                [1, 1, 2, 2, 3, 3, 4, 4],
                { type: 'linear' },
                2
            );

            // when size > 1 with all integers, we want the starting point to be
            // a half integer below the round number a tick would be at (in this case 0)
            // to approximate the half-open interval [) that's commonly used.
            expect(out).toEqual({
                start: -0.5,
                end: 5.5,
                size: 2
            });
        });
    });
});
