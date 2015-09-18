var Plotly = require('../src/plotly');
var clone = require('clone');

describe('Test axes', function () {
    'use strict';

    describe('swap', function() {
        it('should swap most attributes and fix placeholder titles', function() {
            var gd = {
                data: [{x: [1,2,3], y: [1,2,3]}],
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
            var expectedYaxis = clone(gd.layout.xaxis),
                expectedXaxis = {
                    title: 'Click to enter X axis title',
                    type: 'date'
                };

            Plotly.Plots.supplyDefaults(gd);

            Plotly.Axes.swap(gd, [0]);

            expect(gd.layout.xaxis).toEqual(expectedXaxis);
            expect(gd.layout.yaxis).toEqual(expectedYaxis);
        });

        it('should not swap noSwapAttrs', function() {
            // for reference:
            // noSwapAttrs = ['anchor', 'domain', 'overlaying', 'position', 'side', 'tickangle'];
            var gd = {
                data: [{x: [1,2,3], y: [1,2,3]}],
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
            var expectedLayoutAfter = clone(gd.layout);
            expectedLayoutAfter.xaxis.type = 'linear';
            expectedLayoutAfter.yaxis.type = 'linear';

            Plotly.Plots.supplyDefaults(gd);

            Plotly.Axes.swap(gd, [0]);

            expect(gd.layout.xaxis).toEqual(expectedLayoutAfter.xaxis);
            expect(gd.layout.yaxis).toEqual(expectedLayoutAfter.yaxis);
        });

        it('should swap shared attributes, combine linear/log, and move annotations', function() {
            var gd = {
                data: [
                    {x: [1,2,3], y: [1,2,3]},
                    {x: [1,2,3], y: [1,2,3], xaxis: 'x2'}
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

            Plotly.Plots.supplyDefaults(gd);

            Plotly.Axes.swap(gd, [0, 1]);

            expect(gd.layout.xaxis).toEqual(expectedXaxis);
            expect(gd.layout.xaxis2).toEqual(expectedXaxis2);
            expect(gd.layout.yaxis).toEqual(expectedYaxis);
            expect(gd.layout.annotations).toEqual(expectedAnnotations);
        });
    });

    describe('handleTickValueDefaults', function() {
        function handleTickValueDefaults(axIn, axOut, axType) {
            function coerce(attr, dflt) {
                return Plotly.Lib.coerce(axIn, axOut,
                                         Plotly.Axes.layoutAttributes,
                                         attr, dflt);
            }

            Plotly.Axes.handleTickValueDefaults(axIn, axOut, coerce, axType);
        }

        it('should set default tickmode correctly', function() {
            var axIn = {},
                axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('auto');

            axIn = {tickmode: 'array', tickvals: 'stuff'};
            axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('auto');

            axIn = {tickmode: 'array', tickvals: [1, 2, 3]};
            axOut = {};
            handleTickValueDefaults(axIn, axOut, 'date');
            expect(axOut.tickmode).toBe('auto');

            axIn = {tickvals: [1, 2, 3]};
            axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('array');

            axIn = {dtick: 1};
            axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('linear');
        });

        it('should set nticks iff tickmode=auto', function() {
            var axIn = {},
                axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.nticks).toBe(0);

            axIn = {tickmode: 'auto', nticks: 5};
            axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.nticks).toBe(5);

            axIn = {tickmode: 'linear', nticks: 15};
            axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.nticks).toBe(undefined);
        });

        it('should set tick0 and dtick iff tickmode=linear', function() {
            var axIn = {tickmode: 'auto', tick0: 1, dtick: 1},
                axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.tick0).toBe(undefined);
            expect(axOut.dtick).toBe(undefined);

            axIn = {tickvals: [1,2,3], tick0: 1, dtick: 1};
            axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.tick0).toBe(undefined);
            expect(axOut.dtick).toBe(undefined);

            axIn = {tick0: 2.71, dtick: 0.00828};
            axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.tick0).toBe(2.71);
            expect(axOut.dtick).toBe(0.00828);

            axIn = {tickmode: 'linear', tick0: 3.14, dtick: 0.00159};
            axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.tick0).toBe(3.14);
            expect(axOut.dtick).toBe(0.00159);
        });

        it('should set tickvals and ticktext iff tickmode=array', function() {
            var axIn = {tickmode: 'auto', tickvals: [1,2,3], ticktext: ['4','5','6']},
                axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.tickvals).toBe(undefined);
            expect(axOut.ticktext).toBe(undefined);

            axIn = {tickvals: [2,4,6,8], ticktext: ['who','do','we','appreciate']};
            axOut = {};
            handleTickValueDefaults(axIn, axOut, 'linear');
            expect(axOut.tickvals).toEqual([2,4,6,8]);
            expect(axOut.ticktext).toEqual(['who','do','we','appreciate']);
        });
    });

    describe('saveRangeInitial', function() {
        var saveRangeInitial = Plotly.Axes.saveRangeInitial;
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
});
