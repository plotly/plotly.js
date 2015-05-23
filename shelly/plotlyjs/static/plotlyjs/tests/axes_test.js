var Plotly = require('../src/plotly');

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
            var expectedYaxis = $.extend(true, {}, gd.layout.xaxis),
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
            var expectedLayoutAfter = $.extend(true, {}, gd.layout);
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
        function makeCoerce(objIn, objOut) {
            return function(attr, dflt) {
                return Plotly.Lib.coerce(objIn, objOut,
                                         Plotly.Axes.layoutAttributes,
                                         attr, dflt);
            };
        }

        it('should set default tickmode correctly', function() {
            var axIn = {},
                axOut = {};
            Plotly.Axes.handleTickValueDefaults(axIn, axOut,
                makeCoerce(axIn, axOut), 'linear');
            expect(axOut.tickmode).toBe('auto');

            axIn = {tickmode: 'enumerated'};
            axOut = {};
            Plotly.Axes.handleTickValueDefaults(axIn, axOut,
                makeCoerce(axIn, axOut), 'linear');
            expect(axOut.tickmode).toBe('auto');

            axIn = {tickmode: 'enumerated', tickvals: [1, 2, 3]};
            axOut = {};
            Plotly.Axes.handleTickValueDefaults(axIn, axOut,
                makeCoerce(axIn, axOut), 'date');
            expect(axOut.tickmode).toBe('auto');

            axIn = {tickvals: [1, 2, 3]};
            axOut = {};
            Plotly.Axes.handleTickValueDefaults(axIn, axOut,
                makeCoerce(axIn, axOut), 'linear');
            expect(axOut.tickmode).toBe('enumerated');

            axIn = {dtick: 1};
            axOut = {};
            Plotly.Axes.handleTickValueDefaults(axIn, axOut,
                makeCoerce(axIn, axOut), 'linear');
            expect(axOut.tickmode).toBe('regular');
        });

        it('should set nticks iff tickmode=auto', function() {
            var axIn = {},
                axOut = {};
            Plotly.Axes.handleTickValueDefaults(axIn, axOut,
                makeCoerce(axIn, axOut), 'linear');
            expect(axOut.nticks).toBe(0);

            axIn = {tickmode: 'auto', nticks: 5};
            axOut = {};
            Plotly.Axes.handleTickValueDefaults(axIn, axOut,
                makeCoerce(axIn, axOut), 'linear');
            expect(axOut.tickmode).toBe(5);

            axIn = {tickmode: 'regular', nticks: 15};
            axOut = {};
            Plotly.Axes.handleTickValueDefaults(axIn, axOut,
                makeCoerce(axIn, axOut), 'linear');
            expect(axOut.tickmode).toBe(undefined);
        });

        it('should set tick0 and dtick iff tickmode=regular', function() {
            var axin = {},
                axOut = {};
            // TODO
        });
    });
});
