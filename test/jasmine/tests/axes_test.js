var Plotly = require('@lib/index');
var d3 = require('d3');

var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Loggers = require('@src/lib/loggers');
var Color = require('@src/components/color');
var tinycolor = require('tinycolor2');

var handleTickValueDefaults = require('@src/plots/cartesian/tick_value_defaults');
var Cartesian = require('@src/plots/cartesian');
var Axes = require('@src/plots/cartesian/axes');
var Fx = require('@src/components/fx');
var supplyLayoutDefaults = require('@src/plots/cartesian/layout_defaults');
var BADNUM = require('@src/constants/numerical').BADNUM;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var selectButton = require('../assets/modebar_button');
var supplyDefaults = require('../assets/supply_defaults');

describe('Test axes', function() {
    'use strict';

    describe('swap', function() {
        it('should swap most attributes and fix placeholder titles', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {
                    xaxis: {
                        title: {
                            text: 'A Title!!!'
                        },
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
                        title: {
                            text: 'Click to enter Y axis title'
                        },
                        type: 'date'
                    }
                }
            };
            var expectedYaxis = Lib.extendDeep({}, gd.layout.xaxis);
            var expectedXaxis = {
                title: {
                    text: 'Click to enter X axis title'
                },
                type: 'date'
            };

            supplyDefaults(gd);

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

            supplyDefaults(gd);

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
            };
            var expectedXaxis2 = {
                type: 'category',
                ticks: 'inside',
                ticklen: 10,
                tickcolor: '#f00',
                tickwidth: 3,
                showline: true,
                side: 'top',
                domain: [0.55, 1]
            };
            var expectedYaxis = {
                type: 'linear',
                ticks: 'outside',
                ticklen: 5,
                tickwidth: 4,
                side: 'right'
            };
            var expectedAnnotations = [
                {x: 3, y: 2},
                {x: 4, y: 3, xref: 'x2', yref: 'y'},
                {x: 5, y: 0.5, xref: 'x', yref: 'paper'}
            ];

            supplyDefaults(gd);

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
                _basePlotModules: [],
                _dfltTitle: {x: 'x', y: 'y'},
                _subplots: {cartesian: ['xy'], xaxis: ['x'], yaxis: ['y']},
                _requestRangeslider: {}
            };
            fullData = [];
        });

        describe('autotype', function() {
            function supplyWithTrace(trace) {
                var fullTrace = Lib.extendDeep(
                    {type: 'scatter', xaxis: 'x', yaxis: 'y'},
                    trace
                );
                layoutIn = {xaxis: {}, yaxis: {}};
                supplyLayoutDefaults(layoutIn, layoutOut, [fullTrace]);
            }

            function checkTypes(xType, yType, msg) {
                expect(layoutOut.xaxis.type).toBe(xType, msg);
                expect(layoutOut.yaxis.type).toBe(yType, msg);
            }

            it('treats booleans as categories', function() {
                supplyWithTrace({x: [0, 1, 2], y: [true, false, true]});
                checkTypes('linear', 'category');
            });

            it('sees a single "None" or "" as a category', function() {
                supplyWithTrace({x: ['None'], y: ['']});
                checkTypes('category', 'category');
            });

            it('lets a single number beat up to two distinct categories', function() {
                supplyWithTrace({
                    x: ['2.1', 'N/A', '', 'N/A', '', 'N/A', 'N/A', '', '', ''],
                    y: [0, 'None', true, 'None', 'None', 'None', 'None', 'None']
                });
                checkTypes('linear', 'linear');
            });

            it('turns back to category with >2 per distinct number', function() {
                supplyWithTrace({
                    x: [4, 4, 4, 4, 4, 4, 4, 4, 'Yes', 'No', 'Maybe'],
                    y: [1, 2, 1, 2, 1, 2, true, false, '', 'None', 'nan']
                });
                checkTypes('category', 'category');
            });

            it('works with world calendars', function() {
                // these are only valid dates in chinese
                var intercalary = ['1995-08i-01', '1995-08i-29', '1984-10i-15'];
                supplyWithTrace({
                    x: intercalary, xcalendar: 'chinese',
                    y: intercalary, ycalendar: 'gregorian'
                });
                checkTypes('date', 'category');
            });

            it('requires >twice as many distinct dates as numbers', function() {
                supplyWithTrace({
                    x: ['2000-01-01', '2000-01-02', '2000-01-03', 1, 1.2],
                    y: ['2000-01', '2000-02', '2000-03', '2000-04', 1.1]
                });
                checkTypes('linear', 'date');

                supplyWithTrace({
                    x: ['2000-01-01', '2000-01-02', '2000-01-03', 1, 1],
                    y: ['2000-01', '2000-01', '2000-01', '2000-01', 1.1]
                });
                checkTypes('date', 'linear');
            });

            it('counts ambiguous dates as both dates and numbers', function() {
                supplyWithTrace({
                    x: ['2000', '2000-01', '2000-02'], // 3 dates, 1 number
                    y: ['2000', '2001', '2000-01'] // 3 dates, 2 numbers
                });
                checkTypes('date', 'linear');
            });

            it('2d coordinate array are considered *multicategory*', function() {
                supplyWithTrace({
                    x: [
                        [2018, 2018, 2017, 2017],
                        ['a', 'b', 'a', 'b']
                    ],
                    y: [
                        ['a', 'b', 'c'],
                        ['d', 'e', 'f']
                    ]
                });
                checkTypes('multicategory', 'multicategory');

                supplyWithTrace({
                    x: [
                        [2018, 2018, 2017, 2017],
                        [2018, 2018, 2017, 2017]
                    ],
                    y: [
                        ['2018', '2018', '2017', '2017'],
                        ['2018', '2018', '2017', '2017']
                    ]
                });
                checkTypes('multicategory', 'multicategory');

                supplyWithTrace({
                    x: [
                        new Float32Array([2018, 2018, 2017, 2017]),
                        [2018, 2018, 2017, 2017]
                    ],
                    y: [
                        [2018, 2018, 2017, 2017],
                        new Float64Array([2018, 2018, 2017, 2017])
                    ]
                });
                checkTypes('multicategory', 'multicategory');

                supplyWithTrace({
                    x: [
                        [2018, 2018, 2017, 2017]
                    ],
                    y: [
                        null,
                        ['d', 'e', 'f']
                    ]
                });
                checkTypes('linear', 'linear');

                supplyWithTrace({
                    type: 'carpet',
                    x: [
                        [2018, 2018, 2017, 2017],
                        ['a', 'b', 'a', 'b']
                    ],
                    y: [
                        ['a', 'b', 'c'],
                        ['d', 'e', 'f']
                    ]
                });
                checkTypes('linear', 'linear');
            });
        });

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

        it('should use \'axis.color\' as default for \'axis.title.font.color\'', function() {
            layoutIn = {
                xaxis: { color: 'red' },
                yaxis: {},
                yaxis2: { title: { font: { color: 'yellow' } } }
            };

            layoutOut.font = { color: 'blue' };
            layoutOut._subplots.cartesian.push('xy2');
            layoutOut._subplots.yaxis.push('y2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.title.font.color).toEqual('red');
            expect(layoutOut.yaxis.title.font.color).toEqual('blue');
            expect(layoutOut.yaxis2.title.font.color).toEqual('yellow');
        });

        it('should use \'axis.color\' as default for \'axis.linecolor\'', function() {
            layoutIn = {
                xaxis: { showline: true, color: 'red' },
                yaxis: { linecolor: 'blue' },
                yaxis2: { showline: true }
            };
            layoutOut._subplots.cartesian.push('xy2');
            layoutOut._subplots.yaxis.push('y2');

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
            layoutOut._subplots.cartesian.push('xy2');
            layoutOut._subplots.yaxis.push('y2');

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
            layoutOut._subplots.cartesian.push('xy2');
            layoutOut._subplots.yaxis.push('y2');

            var bgColor = Color.combine('yellow', 'green');
            var frac = 100 * (0xe - 0x4) / (0xf - 0x4);

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
            layoutOut._subplots.cartesian.push('x2y2', 'xy3');
            layoutOut._subplots.yaxis.push('x2', 'y2', 'y3');

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
            layoutOut._subplots.cartesian.push('x2y2');
            layoutOut._subplots.yaxis.push('x2', 'y2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            Axes.list({ _fullLayout: layoutOut }).forEach(function(ax) {
                expect(ax.autorange).toBe(false, ax._name);
            });
        });

        it('only allows rangemode with linear axes', function() {
            layoutIn = {
                xaxis: {type: 'log', rangemode: 'tozero'},
                yaxis: {type: 'date', rangemode: 'tozero'},
                xaxis2: {type: 'category', rangemode: 'tozero'},
                yaxis2: {type: 'linear', rangemode: 'tozero'}
            };
            layoutOut._subplots.cartesian.push('x2y2');
            layoutOut._subplots.yaxis.push('x2', 'y2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.rangemode).toBeUndefined();
            expect(layoutOut.yaxis.rangemode).toBeUndefined();
            expect(layoutOut.xaxis2.rangemode).toBeUndefined();
            expect(layoutOut.yaxis2.rangemode).toBe('tozero');
        });

        it('finds scaling groups and calculates relative scales', function() {
            layoutIn = {
                // first group: linked in series, scales compound
                xaxis: {},
                yaxis: {scaleanchor: 'x', scaleratio: 2},
                xaxis2: {scaleanchor: 'y', scaleratio: 3},
                yaxis2: {scaleanchor: 'x2', scaleratio: 5},
                // second group: linked in parallel, scales don't compound
                yaxis3: {},
                xaxis3: {scaleanchor: 'y3'},  // default scaleratio: 1
                xaxis4: {scaleanchor: 'y3', scaleratio: 7},
                xaxis5: {scaleanchor: 'y3', scaleratio: 9}
            };
            layoutOut._subplots.cartesian.push('x2y2', 'x3y3', 'x4y3', 'x5y3');
            layoutOut._subplots.yaxis.push('x2', 'x3', 'x4', 'x5', 'y2', 'y3');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisConstraintGroups).toEqual([
                {x: 1, y: 2, x2: 2 * 3, y2: 2 * 3 * 5},
                {y3: 1, x3: 1, x4: 7, x5: 9}
            ]);
        });

        var warnTxt = ' to avoid either an infinite loop and possibly ' +
            'inconsistent scaleratios, or because the target axis has ' +
            'fixed range or this axis declares a *matches* constraint.';

        it('breaks scaleanchor loops and drops conflicting ratios', function() {
            var warnings = [];
            spyOn(Lib, 'warn').and.callFake(function(msg) {
                warnings.push(msg);
            });

            layoutIn = {
                xaxis: {scaleanchor: 'y', scaleratio: 2},
                yaxis: {scaleanchor: 'x', scaleratio: 3}, // dropped loop

                xaxis2: {scaleanchor: 'y2', scaleratio: 5},
                yaxis2: {scaleanchor: 'x3', scaleratio: 7},
                xaxis3: {scaleanchor: 'y3', scaleratio: 9},
                yaxis3: {scaleanchor: 'x2', scaleratio: 11}, // dropped loop

                xaxis4: {scaleanchor: 'x', scaleratio: 13}, // x<->x is OK now
                yaxis4: {scaleanchor: 'y', scaleratio: 17}, // y<->y is OK now
            };
            layoutOut._subplots.cartesian.push('x2y2', 'x3y3', 'x4y4');
            layoutOut._subplots.yaxis.push('x2', 'x3', 'x4', 'y2', 'y3', 'y4');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisConstraintGroups).toEqual([
                {x: 2, y: 1, x4: 2 * 13, y4: 17},
                {x2: 5 * 7 * 9, y2: 7 * 9, y3: 1, x3: 9}
            ]);

            expect(warnings).toEqual([
                'ignored yaxis.scaleanchor: "x"' + warnTxt,
                'ignored yaxis3.scaleanchor: "x2"' + warnTxt
            ]);
        });

        it('silently drops invalid scaleanchor values', function() {
            var warnings = [];
            spyOn(Lib, 'warn').and.callFake(function(msg) {
                warnings.push(msg);
            });

            layoutIn = {
                xaxis: {scaleanchor: 'x', scaleratio: 2}, // can't link to itself - this one isn't ignored...
                yaxis: {scaleanchor: 'x4', scaleratio: 3}, // doesn't exist
                xaxis2: {scaleanchor: 'yaxis', scaleratio: 5} // must be an id, not a name
            };
            layoutOut._subplots.cartesian.push('x2y');
            layoutOut._subplots.yaxis.push('x2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisConstraintGroups).toEqual([]);
            expect(warnings).toEqual(['ignored xaxis.scaleanchor: "x"' + warnTxt]);

            ['xaxis', 'yaxis', 'xaxis2'].forEach(function(axName) {
                expect(layoutOut[axName].scaleanchor).toBeUndefined(axName);
                expect(layoutOut[axName].scaleratio).toBeUndefined(axName);
            });
        });

        it('will not link axes of different types', function() {
            layoutIn = {
                xaxis: {type: 'linear'},
                yaxis: {type: 'log', scaleanchor: 'x', scaleratio: 2},
                xaxis2: {type: 'date', scaleanchor: 'y', scaleratio: 3},
                yaxis2: {type: 'category', scaleanchor: 'x2', scaleratio: 5}
            };
            layoutOut._subplots.cartesian.push('x2y2');
            layoutOut._subplots.yaxis.push('x2', 'y2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisConstraintGroups).toEqual([]);

            ['xaxis', 'yaxis', 'xaxis2', 'yaxis2'].forEach(function(axName) {
                expect(layoutOut[axName].scaleanchor).toBeUndefined(axName);
                expect(layoutOut[axName].scaleratio).toBeUndefined(axName);
            });
        });

        it('will not match axes of different types', function() {
            layoutIn = {
                xaxis: {type: 'linear'},
                yaxis: {type: 'log', matches: 'x'},
                xaxis2: {type: 'date', matches: 'y'},
                yaxis2: {type: 'category', matches: 'x2'}
            };
            layoutOut._subplots.cartesian.push('x2y2');
            layoutOut._subplots.yaxis.push('x2', 'y2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups).toEqual([]);

            ['xaxis', 'yaxis', 'xaxis2', 'yaxis2'].forEach(function(axName) {
                expect(layoutOut[axName].matches).toBeUndefined();
            });
        });

        it('disallow constraining AND matching range', function() {
            layoutIn = {
                xaxis: {},
                xaxis2: {matches: 'x', scaleanchor: 'x'}
            };
            layoutOut._subplots.cartesian.push('x2y');
            layoutOut._subplots.xaxis.push('x2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis2.matches).toBe('x');
            expect(layoutOut.xaxis2.scaleanchor).toBe(undefined);
            expect(layoutOut.xaxis2.constrain).toBe(undefined);

            expect(layoutOut._axisConstraintGroups).toEqual([]);
            expect(layoutOut._axisMatchGroups).toEqual([{x: 1, x2: 1}]);
        });

        it('remove axes from constraint groups if they are in a match group', function() {
            layoutIn = {
                // this one is ok
                xaxis: {},
                yaxis: {scaleanchor: 'x'},
                // this one too
                xaxis2: {},
                yaxis2: {matches: 'x2'},
                // not these ones
                xaxis3: {scaleanchor: 'x2'},
                yaxis3: {scaleanchor: 'y2'}
            };
            layoutOut._subplots.cartesian.push('x2y2, x3y3');
            layoutOut._subplots.xaxis.push('x2', 'x3');
            layoutOut._subplots.yaxis.push('y2', 'y3');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups.length).toBe(1);
            expect(layoutOut._axisMatchGroups).toContain({x2: 1, y2: 1});

            expect(layoutOut._axisConstraintGroups.length).toBe(1);
            expect(layoutOut._axisConstraintGroups).toContain({x: 1, y: 1});
        });

        it('remove constraint group if they are one or zero items left in it', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {matches: 'x'},
                xaxis2: {scaleanchor: 'y'}
            };
            layoutOut._subplots.cartesian.push('x2y');
            layoutOut._subplots.xaxis.push('x2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups.length).toBe(1);
            expect(layoutOut._axisMatchGroups).toContain({x: 1, y: 1});

            expect(layoutOut._axisConstraintGroups.length).toBe(0);
        });

        it('drops scaleanchor settings if either the axis or target has fixedrange', function() {
            // some of these will create warnings... not too important, so not going to test,
            // just want to keep the output clean
            // spyOn(Lib, 'warn');

            layoutIn = {
                xaxis: {fixedrange: true, scaleanchor: 'y', scaleratio: 2},
                yaxis: {scaleanchor: 'x2', scaleratio: 3}, // only this one should survive
                xaxis2: {},
                yaxis2: {scaleanchor: 'x', scaleratio: 5}
            };
            layoutOut._subplots.cartesian.push('x2y2');
            layoutOut._subplots.yaxis.push('x2', 'y2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisConstraintGroups).toEqual([{x2: 1, y: 3}]);

            expect(layoutOut.yaxis.scaleanchor).toBe('x2');
            expect(layoutOut.yaxis.scaleratio).toBe(3);

            ['xaxis', 'yaxis2', 'xaxis2'].forEach(function(axName) {
                expect(layoutOut[axName].scaleanchor).toBeUndefined();
                expect(layoutOut[axName].scaleratio).toBeUndefined();
            });
        });

        it('drops *matches* settings if either the axis or target has fixedrange', function() {
            layoutIn = {
                xaxis: {fixedrange: true, matches: 'y'},
                yaxis: {matches: 'x2'}, // only this one should survive
                xaxis2: {},
                yaxis2: {matches: 'x'}
            };
            layoutOut._subplots.cartesian.push('x2y2');
            layoutOut._subplots.yaxis.push('x2', 'y2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups).toEqual([{x2: 1, y: 1}]);
            expect(layoutOut.yaxis.matches).toBe('x2');

            ['xaxis', 'yaxis2', 'xaxis2'].forEach(function(axName) {
                expect(layoutOut[axName].matches).toBeUndefined();
            });
        });

        it('should coerce hoverformat even on visible: false axes', function() {
            layoutIn = {
                xaxis: {
                    visible: false,
                    hoverformat: 'g'
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.hoverformat).toEqual('g');
        });

        it('should find matching groups', function() {
            layoutIn = {
                // both linked to 'base' ax
                xaxis: {},
                xaxis2: {matches: 'x'},
                xaxis3: {matches: 'x'},
                // cascading links
                yaxis: {},
                yaxis2: {anchor: 'x2', matches: 'y'},
                yaxis3: {anchor: 'x3', matches: 'y2'},
            };
            layoutOut._subplots.cartesian.push('x2y2', 'x3y3');
            layoutOut._subplots.xaxis.push('x2', 'x3');
            layoutOut._subplots.yaxis.push('y2', 'y3');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups.length).toBe(2);
            expect(layoutOut._axisMatchGroups).toContain({x: 1, x2: 1, x3: 1});
            expect(layoutOut._axisMatchGroups).toContain({y: 1, y2: 1, y3: 1});
        });

        it('should match set axis range value for matching axes', function() {
            layoutIn = {
                // autorange case
                xaxis: {},
                xaxis2: {matches: 'x'},
                // matchee ax has range
                yaxis: {range: [0, 1]},
                yaxis2: {matches: 'y'},
                // matcher ax has range (gets ignored)
                xaxis3: {},
                yaxis3: {range: [-1, 1], matches: 'x3'},
                // both ax have range
                xaxis4: {range: [0, 2], matches: 'y4'},
                yaxis4: {range: [-1, 3], matches: 'x4'}
            };
            layoutOut._subplots.cartesian.push('x2y2', 'x3y3', 'x4y4');
            layoutOut._subplots.xaxis.push('x2', 'x3', 'x4');
            layoutOut._subplots.yaxis.push('y2', 'y3', 'y4');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups.length).toBe(4);
            expect(layoutOut._axisMatchGroups).toContain({x: 1, x2: 1});
            expect(layoutOut._axisMatchGroups).toContain({y: 1, y2: 1});
            expect(layoutOut._axisMatchGroups).toContain({x3: 1, y3: 1});
            expect(layoutOut._axisMatchGroups).toContain({x4: 1, y4: 1});

            function _assertMatchingAxes(names, autorange, rng) {
                names.forEach(function(n) {
                    var ax = layoutOut[n];
                    expect(ax.autorange).toBe(autorange, n);
                    expect(ax.range).toEqual(rng);
                });
            }

            _assertMatchingAxes(['xaxis', 'xaxis2'], true, [-1, 6]);
            _assertMatchingAxes(['yaxis', 'yaxis2'], false, [0, 1]);
            _assertMatchingAxes(['xaxis3', 'yaxis3'], true, [-1, 6]);
            _assertMatchingAxes(['xaxis4', 'yaxis4'], false, [-1, 3]);
        });
    });

    describe('constraints relayout', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('updates ranges when adding, removing, or changing a constraint', function(done) {
            Plotly.plot(gd,
                [{z: [[0, 1], [2, 3]], type: 'heatmap'}],
                // plot area is 200x100 px
                {width: 400, height: 300, margin: {l: 100, r: 100, t: 100, b: 100}}
            )
            .then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-0.5, 1.5], 5);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.5, 1.5], 5);

                return Plotly.relayout(gd, {'xaxis.scaleanchor': 'y'});
            })
            .then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-1.5, 2.5], 5);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.5, 1.5], 5);

                return Plotly.relayout(gd, {'xaxis.scaleratio': 10});
            })
            .then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-0.5, 1.5], 5);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-4.5, 5.5], 5);

                return Plotly.relayout(gd, {'xaxis.scaleanchor': null});
            })
            .then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-0.5, 1.5], 5);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.5, 1.5], 5);
            })
            .catch(failTest)
            .then(done);
        });

        function assertRangeDomain(axName, range, domainIn, domainOut, msg) {
            var ax = gd._fullLayout[axName];
            var axIn = ax._input;

            msg = msg || axName;

            expect(ax.domain).toBeCloseToArray(domainOut, 5,
                'full domain, ' + msg);

            // the actual domain in layout is changed, but the original is
            // cached in _fullLayout for responsiveness to later changes.
            // (or may be deleted if domain is not adjusted)
            expect(axIn.domain || ax.domain).toBeCloseToArray(ax.domain, 5,
                'layout domain, ' + msg);
            expect(ax._inputDomain || ax.domain).toBeCloseToArray(domainIn, 5,
                '_inputDomain, ' + msg);

            // input and full range always match
            expect(ax.range.map(ax.r2l)).toBeCloseToArray(range.map(ax.r2l), 5,
                'range, ' + msg + ': ' + ax.range);
            expect(axIn.range.map(ax.r2l)).toBeCloseToArray(ax.range.map(ax.r2l), 5,
                'input range, ' + msg + ': ' + ax.range);
        }

        it('can change per-axis constrain:domain/range and constraintoward', function(done) {
            Plotly.plot(gd,
                // start with a heatmap as it has no padding so calculations are easy
                [{z: [[0, 1], [2, 3]], type: 'heatmap'}],
                // plot area is 200x100 px
                {
                    width: 400,
                    height: 300,
                    margin: {l: 100, r: 100, t: 100, b: 100},
                    xaxis: {constrain: 'domain'},
                    yaxis: {constraintoward: 'top', 'scaleanchor': 'x'}
                }
            )
            .then(function() {
                // x axis is constrained, but by domain rather than by range
                assertRangeDomain('xaxis', [-0.5, 1.5], [0, 1], [0.25, 0.75]);
                assertRangeDomain('yaxis', [-0.5, 1.5], [0, 1], [0, 1]);

                return Plotly.relayout(gd, {
                    'xaxis.constraintoward': 'right',
                    'xaxis.domain': [0.05, 0.95],
                    // no effect for now, y is not constrained
                    'yaxis.constraintoward': 'bottom',
                    'yaxis.constrain': 'domain'
                });
            })
            .then(function() {
                // debatable I guess... you asked for an explicit domain but got a
                // smaller one due to the constraint, which is not how it works
                // if you ask for a new range (in that case you get exactly that
                // range and other axes adjust to accommodate that) but my rationale
                // is that modifying domain is usually done at an earlier stage in
                // making the chart so should affect the "envelope", not the more
                // dynamic behavior of interaction like when you set a range.
                assertRangeDomain('xaxis', [-0.5, 1.5], [0.05, 0.95], [0.45, 0.95]);
                assertRangeDomain('yaxis', [-0.5, 1.5], [0, 1], [0, 1]);

                return Plotly.relayout(gd, {'xaxis.constrain': 'range'});
            })
            .then(function() {
                assertRangeDomain('xaxis', [-2.1, 1.5], [0.05, 0.95], [0.05, 0.95]);
                assertRangeDomain('yaxis', [-0.5, 1.5], [0, 1], [0, 1]);

                return Plotly.relayout(gd, {
                    'xaxis.domain': null,
                    'xaxis.range[0]': -6.5
                });
            })
            .then(function() {
                assertRangeDomain('xaxis', [-6.5, 1.5], [0, 1], [0, 1]);
                assertRangeDomain('yaxis', [-0.5, 1.5], [0, 1], [0, 0.5]);

                return Plotly.relayout(gd, {'yaxis.constraintoward': 'middle'});
            })
            .then(function() {
                assertRangeDomain('yaxis', [-0.5, 1.5], [0, 1], [0.25, 0.75]);

                return Plotly.relayout(gd, {'yaxis.constraintoward': 'top'});
            })
            .then(function() {
                assertRangeDomain('yaxis', [-0.5, 1.5], [0, 1], [0.5, 1]);

                return Plotly.relayout(gd, {'yaxis.constrain': 'range'});
            })
            .then(function() {
                assertRangeDomain('xaxis', [-6.5, 1.5], [0, 1], [0, 1]);
                assertRangeDomain('yaxis', [-2.5, 1.5], [0, 1], [0, 1]);

                return Plotly.relayout(gd, {
                    'xaxis.autorange': true,
                    'xaxis.constrain': 'domain',
                    'xaxis.constraintoward': 'left',
                    'yaxis.autorange': true,
                    'yaxis.constrain': 'domain'
                });
            })
            .then(function() {
                assertRangeDomain('xaxis', [-0.5, 1.5], [0, 1], [0, 0.5]);
                assertRangeDomain('yaxis', [-0.5, 1.5], [0, 1], [0, 1]);

                return Plotly.relayout(gd, {'xaxis.range': [-3.5, 4.5]});
            })
            .then(function() {
                assertRangeDomain('xaxis', [-3.5, 4.5], [0, 1], [0, 1]);
                assertRangeDomain('yaxis', [-0.5, 1.5], [0, 1], [0.5, 1]);

                return Plotly.relayout(gd, {'xaxis.range': [0, 1]});
            })
            .then(function() {
                assertRangeDomain('xaxis', [0, 1], [0, 1], [0, 0.25]);
                assertRangeDomain('yaxis', [-0.5, 1.5], [0, 1], [0, 1]);
            })
            .catch(failTest)
            .then(done);
        });

        it('autoranges consistently with padding', function(done) {
            var xAutoPad = 0.09523809523809526;
            var xAutorange = [-xAutoPad, 1 + xAutoPad];
            var yAutoPad = 0.15476190476190477;
            var yAutorange = [-yAutoPad, 1 + yAutoPad];
            Plotly.plot(gd, [
                {y: [0, 1], mode: 'markers', marker: {size: 4}},
                {y: [0, 1], mode: 'markers', marker: {size: 4}, xaxis: 'x2', yaxis: 'y2'}
            ], {
                xaxis: {domain: [0, 0.5], constrain: 'domain'},
                yaxis: {constrain: 'domain', scaleanchor: 'x'},
                xaxis2: {domain: [0.5, 1], constrain: 'domain'},
                yaxis2: {constrain: 'domain', scaleanchor: 'x2'},
                // plot area 200x200px, so y axes should be squished to
                // (a little over due to autoranging) half their input domain
                width: 400,
                height: 400,
                margin: {l: 100, r: 100, t: 100, b: 100, p: 0},
                showlegend: false
            })
            .then(function() {
                assertRangeDomain('xaxis', xAutorange, [0, 0.5], [0, 0.5]);
                assertRangeDomain('yaxis', yAutorange, [0, 1], [0.225, 0.775]);
                assertRangeDomain('xaxis2', xAutorange, [0.5, 1], [0.5, 1]);
                assertRangeDomain('yaxis2', yAutorange, [0, 1], [0.225, 0.775]);

                return Plotly.relayout(gd, {'xaxis.range': [-1, 2]});
            })
            .then(function() {
                assertRangeDomain('xaxis', [-1, 2], [0, 0.5], [0, 0.5]);
                assertRangeDomain('yaxis', [-0.39, 1.39], [0, 1], [0.3516667, 0.6483333]);
                assertRangeDomain('xaxis2', xAutorange, [0.5, 1], [0.5, 1]);
                assertRangeDomain('yaxis2', yAutorange, [0, 1], [0.225, 0.775]);

                return Plotly.relayout(gd, {'xaxis.autorange': true});
            })
            .then(function() {
                assertRangeDomain('xaxis', xAutorange, [0, 0.5], [0, 0.5]);
                assertRangeDomain('yaxis', yAutorange, [0, 1], [0.225, 0.775]);
                assertRangeDomain('xaxis2', xAutorange, [0.5, 1], [0.5, 1]);
                assertRangeDomain('yaxis2', yAutorange, [0, 1], [0.225, 0.775]);
            })
            .catch(failTest)
            .then(done);
        });

        it('can constrain date axes', function(done) {
            Plotly.plot(gd, [{
                x: ['2001-01-01', '2002-01-01'],
                y: ['2001-01-01', '2002-01-01'],
                mode: 'markers',
                marker: {size: 4}
            }], {
                yaxis: {scaleanchor: 'x'},
                width: 400,
                height: 300,
                margin: {l: 100, r: 100, t: 100, b: 100, p: 0}
            })
            .then(function() {
                assertRangeDomain('xaxis', ['2000-04-23 23:25:42.8572', '2002-09-10 00:34:17.1428'], [0, 1], [0, 1]);
                assertRangeDomain('yaxis', ['2000-11-27 05:42:51.4286', '2002-02-04 18:17:08.5714'], [0, 1], [0, 1]);

                return Plotly.relayout(gd, {
                    'xaxis.constrain': 'domain',
                    'yaxis.constrain': 'domain'
                });
            })
            .then(function() {
                // you'd have thought the x axis would end up exactly the same total size as y
                // (which would be domain [.25, .75]) but it doesn't, because the padding is
                // calculated as 5% of the original axis size, not of the constrained size.
                assertRangeDomain('xaxis', ['2000-11-05 12:17:08.5714', '2002-02-26 11:42:51.4286'], [0, 1], [0.225, 0.775]);
                assertRangeDomain('yaxis', ['2000-11-27 05:42:51.4286', '2002-02-04 18:17:08.5714'], [0, 1], [0, 1]);
            })
            .catch(failTest)
            .then(done);
        });

        it('can constrain category axes', function(done) {
            Plotly.plot(gd, [{
                x: ['a', 'b'],
                y: ['c', 'd'],
                mode: 'markers',
                marker: {size: 4}
            }], {
                yaxis: {scaleanchor: 'x'},
                width: 300,
                height: 400,
                margin: {l: 100, r: 100, t: 100, b: 100, p: 0}
            })
            .then(function() {
                assertRangeDomain('xaxis', [-0.095238095, 1.095238095], [0, 1], [0, 1]);
                assertRangeDomain('yaxis', [-0.69047619, 1.69047619], [0, 1], [0, 1]);

                return Plotly.relayout(gd, {
                    'xaxis.constrain': 'domain',
                    'yaxis.constrain': 'domain'
                });
            })
            .then(function() {
                assertRangeDomain('xaxis', [-0.095238095, 1.095238095], [0, 1], [0, 1]);
                assertRangeDomain('yaxis', [-0.1547619, 1.1547619], [0, 1], [0.225, 0.775]);
            })
            .catch(failTest)
            .then(done);
        });

        it('can constrain log axes', function(done) {
            Plotly.plot(gd, [{
                x: [1, 10],
                y: [1, 10],
                mode: 'markers',
                marker: {size: 4}
            }], {
                xaxis: {type: 'log'},
                yaxis: {type: 'log', scaleanchor: 'x'},
                width: 300,
                height: 400,
                margin: {l: 100, r: 100, t: 100, b: 100, p: 0}
            })
            .then(function() {
                assertRangeDomain('xaxis', [-0.095238095, 1.095238095], [0, 1], [0, 1]);
                assertRangeDomain('yaxis', [-0.69047619, 1.69047619], [0, 1], [0, 1]);

                return Plotly.relayout(gd, {
                    'xaxis.constrain': 'domain',
                    'yaxis.constrain': 'domain'
                });
            })
            .then(function() {
                assertRangeDomain('xaxis', [-0.095238095, 1.095238095], [0, 1], [0, 1]);
                assertRangeDomain('yaxis', [-0.1547619, 1.1547619], [0, 1], [0.225, 0.775]);
            })
            .catch(failTest)
            .then(done);
        });

        it('can react from different layout *grid* settings', function(done) {
            var fig1 = function() {
                return {
                    data: [{}, {xaxis: 'x2'}, {xaxis: 'x3'}, {xaxis: 'x4'}],
                    layout: {
                        grid: {
                            xaxes: ['x', 'x2', 'x3', 'x4'],
                            yaxes: ['y'],
                            xgap: 0.1,
                            ygap: 0.1,
                            xside: 'bottom',
                            yside: 'left'
                        },
                        xaxis2: {scaleanchor: 'x'},
                        xaxis3: {scaleanchor: 'x'},
                        xaxis4: {scaleanchor: 'x'}
                    }
                };
            };

            var fig2 = function() {
                return {
                    data: [{}, {xaxis: 'x2'}, {xaxis: 'x3'}, {xaxis: 'x4'}],
                    layout: {
                        grid: {
                            xaxes: ['x', 'x2'],
                            yaxes: ['y'],
                            xgap: 0.1,
                            ygap: 0.1,
                            xside: 'bottom',
                            yside: 'left'
                        },
                        xaxis2: {scaleanchor: 'x'}
                    }
                };
            };

            var rng = [-1, 6];

            Plotly.plot(gd, fig1())
            .then(function() {
                var msg = 'fig1';
                assertRangeDomain('xaxis', rng, [0, 0.230769], [0, 0.230769], msg);
                assertRangeDomain('xaxis2', rng, [0.256410, 0.487179], [0.256410, 0.487179], msg);
                assertRangeDomain('xaxis3', rng, [0.512820, 0.743589], [0.512820, 0.743589], msg);
            })
            .then(function() { return Plotly.react(gd, fig2()); })
            .then(function() {
                var msg = 'fig2';
                assertRangeDomain('xaxis', rng, [0, 0.473684], [0, 0.473684], msg);
                assertRangeDomain('xaxis2', rng, [0.526315, 1], [0.526315, 1], msg);
            })
            .then(function() { return Plotly.react(gd, fig1()); })
            .then(function() {
                var msg = 'back to fig1';
                assertRangeDomain('xaxis', rng, [0, 0.230769], [0, 0.230769], msg);
                assertRangeDomain('xaxis2', rng, [0.256410, 0.487179], [0.256410, 0.487179], msg);
                assertRangeDomain('xaxis3', rng, [0.512820, 0.743589], [0.512820, 0.743589], msg);
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('matching axes relayout calls', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function assertRanges(msg, exp) {
            exp.forEach(function(expi) {
                var axNames = expi[0];
                var rng = expi[1];
                var autorng = expi[2];

                axNames.forEach(function(n) {
                    var msgi = n + ' - ' + msg;
                    expect(gd._fullLayout[n].range).toBeCloseToArray(rng, 1.5, msgi + ' |range');
                    expect(gd._fullLayout[n].autorange).toBe(autorng, msgi + ' |autorange');
                });
            });
        }

        it('should auto-range according to all matching trace data', function(done) {
            Plotly.plot(gd, [
                { y: [1, 2, 1] },
                { y: [2, 1, 2, 3], xaxis: 'x2' },
                { y: [0, 1], xaxis: 'x3' }
            ], {
                xaxis: {domain: [0, 0.2]},
                xaxis2: {matches: 'x', domain: [0.3, 0.6]},
                xaxis3: {matches: 'x', domain: [0.65, 1]},
                width: 800,
                height: 500,
            })
            .then(function() {
                assertRanges('base (autoranged)', [
                    [['xaxis', 'xaxis2', 'xaxis3'], [-0.245, 3.245], true],
                    [['yaxis'], [-0.211, 3.211], true]
                ]);
            })
            .then(function() { return Plotly.relayout(gd, 'xaxis.range', [-1, 4]); })
            .then(function() {
                assertRanges('set range', [
                    [['xaxis', 'xaxis2', 'xaxis3'], [-1, 4], false],
                    [['yaxis'], [-0.211, 3.211], true]
                ]);
            })
            .then(function() { return Plotly.relayout(gd, 'xaxis2.autorange', true); })
            .then(function() {
                assertRanges('back to autorange', [
                    [['xaxis', 'xaxis2', 'xaxis3'], [-0.245, 3.245], true],
                    [['yaxis'], [-0.211, 3.211], true]
                ]);
            })
            .catch(failTest)
            .then(done);
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
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {xaxis: {type: 'category'}});
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
            });

            it('should set categoryorder to default even if type is not set to category explicitly', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}]);
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
            });

            it('should NOT set categoryorder to default if type is not category', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}]);
                expect(gd._fullLayout.yaxis.categoryorder).toBe(undefined);
                expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
            });

            it('should set categoryorder to default if type is overridden to be category', function() {
                Plotly.plot(gd, [{x: [1, 2, 3, 4, 5], y: [15, 11, 12, 13, 14]}], {yaxis: {type: 'category'}});
                expect(gd._fullLayout.xaxis.categoryorder).toBe(undefined);
                expect(gd._fullLayout.yaxis.categorarray).toBe(undefined);
                expect(gd._fullLayout.yaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.yaxis.categorarray).toBe(undefined);
            });

        });

        describe('setting categoryorder to "array"', function() {

            it('should leave categoryorder on "array" if it is supplied', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'array', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('array');
                expect(gd._fullLayout.xaxis.categoryarray).toEqual(['b', 'a', 'd', 'e', 'c']);
            });

            it('should switch categoryorder on "array" if it is not supplied but categoryarray is supplied', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('array');
                expect(gd._fullLayout.xaxis.categoryarray).toEqual(['b', 'a', 'd', 'e', 'c']);
            });

            it('should revert categoryorder to "trace" if "array" is supplied but there is no list', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'array'}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
            });

        });

        describe('do not set categoryorder to "array" if list exists but empty', function() {

            it('should switch categoryorder to default if list is not supplied', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'array', categoryarray: []}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categoryarray).toEqual([]);
            });

            it('should not switch categoryorder on "array" if categoryarray is supplied but empty', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryarray: []}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categoryarray).toEqual(undefined);
            });
        });

        describe('do NOT set categoryorder to "array" if it has some other proper value', function() {

            it('should use specified categoryorder if it is supplied even if categoryarray exists', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'trace', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
            });

            it('should use specified categoryorder if it is supplied even if categoryarray exists', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'category ascending', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('category ascending');
                expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
            });

            it('should use specified categoryorder if it is supplied even if categoryarray exists', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'category descending', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('category descending');
                expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
            });

        });

        describe('setting categoryorder to the default if the value is unexpected', function() {

            it('should switch categoryorder to "trace" if mode is supplied but invalid', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'invalid value'}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
            });

            it('should switch categoryorder to "array" if mode is supplied but invalid and list is supplied', function() {
                Plotly.plot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'invalid value', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                });
                expect(gd._fullLayout.xaxis.categoryorder).toBe('array');
                expect(gd._fullLayout.xaxis.categoryarray).toEqual(['b', 'a', 'd', 'e', 'c']);
            });

        });

    });

    describe('handleTickDefaults', function() {
        var data = [{ x: [1, 2, 3], y: [3, 4, 5] }];
        var gd;

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

            Plotly.plot(gd, data, layout);

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

            Plotly.plot(gd, data, layout);

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

            Plotly.plot(gd, data, layout);

            var yaxis = gd._fullLayout.yaxis;
            expect(yaxis.tickangle).toBeUndefined();
        });
    });

    describe('handleTickValueDefaults', function() {
        function mockSupplyDefaults(axIn, axOut, axType) {
            function coerce(attr, dflt) {
                return Lib.coerce(axIn, axOut, Cartesian.layoutAttributes, attr, dflt);
            }

            handleTickValueDefaults(axIn, axOut, coerce, axType);
        }

        it('should set default tickmode correctly', function() {
            var axIn = {};
            var axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('auto');
            // and not push it back to axIn (which we used to do)
            expect(axIn.tickmode).toBeUndefined();

            axIn = {tickmode: 'array', tickvals: 'stuff'};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('auto');
            expect(axIn.tickmode).toBe('array');

            axIn = {tickmode: 'array', tickvals: [1, 2, 3]};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'date');
            expect(axOut.tickmode).toBe('auto');
            expect(axIn.tickmode).toBe('array');

            axIn = {tickvals: [1, 2, 3]};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('array');
            expect(axIn.tickmode).toBeUndefined();

            axIn = {dtick: 1};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickmode).toBe('linear');
            expect(axIn.tickmode).toBeUndefined();
        });

        it('should set nticks iff tickmode=auto', function() {
            var axIn = {};
            var axOut = {};
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
            var axIn = {tickmode: 'auto', tick0: 1, dtick: 1};
            var axOut = {};
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
            var someMs = 123456789;
            var someMsDate = Lib.ms2DateTimeLocal(someMs);
            var oneDay = 24 * 3600 * 1000;
            var axIn = {tick0: someMs, dtick: String(3 * oneDay)};
            var axOut = {};
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

            var errors = [];
            spyOn(Loggers, 'error').and.callFake(function(msg) {
                errors.push(msg);
            });

            // now some stuff that shouldn't work, should give defaults
            [
                ['next thursday', -1],
                ['123-45', 'L1'],
                ['', 'M0.5'],
                ['', 'M-1'],
                ['', '2000-01-01']
            ].forEach(function(v, i) {
                axIn = {tick0: v[0], dtick: v[1]};
                axOut = {};
                mockSupplyDefaults(axIn, axOut, 'date');
                expect(axOut.tick0).toBe('2000-01-01');
                expect(axOut.dtick).toBe(oneDay);
                expect(errors.length).toBe(i + 1);
            });
        });

        it('should handle tick0 and dtick for log axes', function() {
            var axIn = {tick0: '0.2', dtick: 0.3};
            var axOut = {};
            mockSupplyDefaults(axIn, axOut, 'log');
            expect(axOut.tick0).toBe(0.2);
            expect(axOut.dtick).toBe(0.3);

            ['D1', 'D2'].forEach(function(v) {
                axIn = {tick0: -1, dtick: v};
                axOut = {};
                mockSupplyDefaults(axIn, axOut, 'log');
                // tick0 gets ignored for D<n>
                expect(axOut.tick0).toBeUndefined(v);
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
            var axIn = {tickmode: 'auto', tickvals: [1, 2, 3], ticktext: ['4', '5', '6']};
            var axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickvals).toBe(undefined);
            expect(axOut.ticktext).toBe(undefined);

            axIn = {tickvals: [2, 4, 6, 8], ticktext: ['who', 'do', 'we', 'appreciate']};
            axOut = {};
            mockSupplyDefaults(axIn, axOut, 'linear');
            expect(axOut.tickvals).toEqual([2, 4, 6, 8]);
            expect(axOut.ticktext).toEqual(['who', 'do', 'we', 'appreciate']);
        });

        it('should not coerce ticktext/tickvals on multicategory axes', function() {
            var axIn = {tickvals: [1, 2, 3], ticktext: ['4', '5', '6']};
            var axOut = {};
            mockSupplyDefaults(axIn, axOut, 'multicategory');
            expect(axOut.tickvals).toBe(undefined);
            expect(axOut.ticktext).toBe(undefined);
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
                    yaxis2: { range: [0.5, 1] },
                    _subplots: {xaxis: ['x', 'x2'], yaxis: ['y', 'y2'], cartesian: ['xy', 'x2y2']}
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
                    _subplots: {xaxis: ['x'], yaxis: ['y', 'y2']},
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
                    _subplots: {xaxis: [], yaxis: [], gl3d: ['scene', 'scene2']},
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
                    _subplots: {xaxis: ['x2'], yaxis: ['y2'], gl3d: ['scene']},
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
                    _subplots: {xaxis: ['x2'], yaxis: ['y2'], gl3d: ['scene']},
                    scene: {
                        xaxis: { _id: 'x', _thisIs3d: true },
                        yaxis: { _id: 'y' },
                        zaxis: { _id: 'z' }
                    },
                    xaxis2: { _id: 'x2' },
                    yaxis2: { _id: 'y2' }
                }
            };

            expect(listFunc(gd, 'x'))
                .toEqual([{ _id: 'x2' }, { _id: 'x', _thisIs3d: true }]);
        });

    });

    describe('getSubplots', function() {
        var getSubplots = Axes.getSubplots;
        var gd = {
            _fullLayout: {
                _subplots: {
                    cartesian: ['x2y2'],
                    gl2d: ['xy']
                }
            }
        };

        it('returns only what was prepopulated in fullLayout._subplots', function() {
            expect(getSubplots(gd))
                .toEqual(['xy', 'x2y2']);
        });

        it('returns list of subplots ids of particular axis with ax option', function() {
            expect(getSubplots(gd, { _id: 'x' }))
                .toEqual(['xy']);
        });
    });

    describe('getAutoRange', function() {
        var getAutoRange = Axes.getAutoRange;
        var gd, ax;

        function mockGd(min, max) {
            return {
                _fullData: [{
                    type: 'scatter',
                    visible: true,
                    xaxis: 'x',
                    _extremes: {
                        x: {min: min, max: max}
                    }
                }],
                _fullLayout: {}
            };
        }

        function mockAx() {
            return {
                _id: 'x',
                type: 'linear',
                _length: 100,
                _traceIndices: [0]
            };
        }

        it('returns reasonable range without explicit rangemode or autorange', function() {
            gd = mockGd([
                // add in an extrapad to verify that it gets used on _min
                // with a _length of 100, extrapad increases pad by 5
                {val: 1, pad: 15, extrapad: true},
                {val: 3, pad: 0},
                {val: 2, pad: 10}
            ], [
                {val: 6, pad: 10},
                {val: 7, pad: 0},
                {val: 5, pad: 20}
            ]);
            ax = mockAx();

            expect(getAutoRange(gd, ax)).toEqual([-0.5, 7]);
        });

        it('reverses axes', function() {
            gd = mockGd([
                {val: 1, pad: 20},
                {val: 3, pad: 0},
                {val: 2, pad: 10}
            ], [
                {val: 6, pad: 10},
                {val: 7, pad: 0},
                {val: 5, pad: 20}
            ]);
            ax = mockAx();
            ax.autorange = 'reversed';
            ax.rangemode = 'normarl';

            expect(getAutoRange(gd, ax)).toEqual([7, -0.5]);
        });

        it('expands empty range', function() {
            gd = mockGd([
                {val: 2, pad: 0}
            ], [
                {val: 2, pad: 0}
            ]);
            ax = mockAx();
            ax.rangemode = 'normal';

            expect(getAutoRange(gd, ax)).toEqual([1, 3]);
        });

        it('returns a lower bound of 0 on rangemode tozero with positive points', function() {
            gd = mockGd([
                {val: 1, pad: 20},
                {val: 3, pad: 0},
                {val: 2, pad: 10}
            ], [
                {val: 6, pad: 10},
                {val: 7, pad: 0},
                {val: 5, pad: 20}
            ]);
            ax = mockAx();
            ax.rangemode = 'tozero';

            expect(getAutoRange(gd, ax)).toEqual([0, 7]);
        });

        it('returns an upper bound of 0 on rangemode tozero with negative points', function() {
            gd = mockGd([
                {val: -10, pad: 20},
                {val: -8, pad: 0},
                {val: -9, pad: 10}
            ], [
                {val: -5, pad: 20},
                {val: -4, pad: 0},
                {val: -6, pad: 10},
            ]);
            ax = mockAx();
            ax.rangemode = 'tozero';

            expect(getAutoRange(gd, ax)).toEqual([-12.5, 0]);
        });

        it('returns a positive and negative range on rangemode tozero with positive and negative points', function() {
            gd = mockGd([
                {val: -10, pad: 20},
                {val: -8, pad: 0},
                {val: -9, pad: 10}
            ], [
                {val: 6, pad: 10},
                {val: 7, pad: 0},
                {val: 5, pad: 20}
            ]);
            ax = mockAx();
            ax.rangemode = 'tozero';

            expect(getAutoRange(gd, ax)).toEqual([-15, 10]);
        });

        it('reverses range after applying rangemode tozero', function() {
            gd = mockGd([
                {val: 1, pad: 20},
                {val: 3, pad: 0},
                {val: 2, pad: 10}
            ], [
                // add in an extrapad to verify that it gets used on _max
                {val: 6, pad: 15, extrapad: true},
                {val: 7, pad: 0},
                {val: 5, pad: 10}
            ]);
            ax = mockAx();
            ax.autorange = 'reversed';
            ax.rangemode = 'tozero';

            expect(getAutoRange(gd, ax)).toEqual([7.5, 0]);
        });

        it('expands empty positive range to include 0 with rangemode tozero', function() {
            gd = mockGd([
                {val: 5, pad: 0}
            ], [
                {val: 5, pad: 0}
            ]);
            ax = mockAx();
            ax.rangemode = 'tozero';

            expect(getAutoRange(gd, ax)).toEqual([0, 5]);
        });

        it('expands empty negative range to something including 0 with rangemode tozero', function() {
            gd = mockGd([
                {val: -5, pad: 0}
            ], [
                {val: -5, pad: 0}
            ]);
            ax = mockAx();
            ax.rangemode = 'tozero';

            expect(getAutoRange(gd, ax)).toEqual([-5, 0]);
        });

        it('pads an empty range, but not past center, with rangemode tozero', function() {
            gd = mockGd([
                {val: 5, pad: 50} // this min pad gets ignored
            ], [
                {val: 5, pad: 20}
            ]);
            ax = mockAx();
            ax.rangemode = 'tozero';

            expect(getAutoRange(gd, ax)).toBeCloseToArray([0, 6.25], 0.01);

            gd = mockGd([
                {val: -5, pad: 80}
            ], [
                {val: -5, pad: 0}
            ]);
            ax = mockAx();
            ax.rangemode = 'tozero';

            expect(getAutoRange(gd, ax)).toBeCloseToArray([-10, 0], 0.01);
        });

        it('shows the data even if it cannot show the padding', function() {
            gd = mockGd([
                {val: 0, pad: 44}
            ], [
                {val: 1, pad: 44}
            ]);
            ax = mockAx();

            // this one is *just* on the allowed side of padding
            // ie data span is just over 10% of the axis
            expect(getAutoRange(gd, ax)).toBeCloseToArray([-3.67, 4.67]);

            gd = mockGd([
                {val: 0, pad: 46}
            ], [
                {val: 1, pad: 46}
            ]);
            ax = mockAx();

            // this one the padded data span would be too small, so we delete
            // the padding
            expect(getAutoRange(gd, ax)).toEqual([0, 1]);

            gd = mockGd([
                {val: 0, pad: 400}
            ], [
                {val: 1, pad: 0}
            ]);
            ax = mockAx();

            // this one the padding is simply impossible to accept!
            expect(getAutoRange(gd, ax)).toEqual([0, 1]);
        });

        it('never returns a negative range when rangemode nonnegative is set with positive and negative points', function() {
            gd = mockGd([
                {val: -10, pad: 20},
                {val: -8, pad: 0},
                {val: -9, pad: 10}
            ], [
                {val: 6, pad: 20},
                {val: 7, pad: 0},
                {val: 5, pad: 10}
            ]);
            ax = mockAx();
            ax.rangemode = 'nonnegative';

            expect(getAutoRange(gd, ax)).toEqual([0, 7.5]);
        });

        it('never returns a negative range when rangemode nonnegative is set with only negative points', function() {
            gd = mockGd([
                {val: -10, pad: 20},
                {val: -8, pad: 0},
                {val: -9, pad: 10}
            ], [
                {val: -5, pad: 20},
                {val: -4, pad: 0},
                {val: -6, pad: 10}
            ]);
            ax = mockAx();
            ax.rangemode = 'nonnegative';

            expect(getAutoRange(gd, ax)).toEqual([0, 1]);
        });

        it('never returns a negative range when rangemode nonnegative is set with only nonpositive points', function() {
            gd = mockGd([
                {val: -10, pad: 20},
                {val: -8, pad: 0},
                {val: -9, pad: 10}
            ], [
                {val: -5, pad: 20},
                {val: 0, pad: 0},
                {val: -6, pad: 10}
            ]);
            ax = mockAx();
            ax.rangemode = 'nonnegative';

            expect(getAutoRange(gd, ax)).toEqual([0, 1]);
        });

        it('expands empty range to something nonnegative with rangemode nonnegative', function() {
            [
                [-5, [0, 1]],
                [0, [0, 1]],
                [0.5, [0, 1.5]],
                [1, [0, 2]],
                [5, [4, 6]]
            ].forEach(function(testCase) {
                var val = testCase[0];
                var expected = testCase[1];
                gd = mockGd([
                    {val: val, pad: 0}
                ], [
                    {val: val, pad: 0}
                ]);
                ax = mockAx();
                ax.rangemode = 'nonnegative';

                expect(getAutoRange(gd, ax)).toEqual(expected, val);
            });
        });
    });

    describe('findExtremes', function() {
        var findExtremes = Axes.findExtremes;
        var ax, data, options, out;

        function getDefaultAx() {
            return {
                c2l: Number,
                type: 'linear',
                _m: 1
            };
        }

        it('constructs simple ax._min and ._max correctly', function() {
            ax = getDefaultAx();
            data = [1, 4, 7, 2];

            out = findExtremes(ax, data);
            expect(out.min).toEqual([{val: 1, pad: 0, extrapad: false}]);
            expect(out.max).toEqual([{val: 7, pad: 0, extrapad: false}]);
        });

        it('calls ax.setScale if necessary', function() {
            ax = getDefaultAx();
            delete ax._m;
            ax.setScale = function() {};
            spyOn(ax, 'setScale');

            findExtremes(ax, [1]);
            expect(ax.setScale).toHaveBeenCalled();
        });

        it('handles symmetric pads as numbers', function() {
            ax = getDefaultAx();
            data = [1, 4, 2, 7];
            options = {vpad: 2, ppad: 10};

            out = findExtremes(ax, data, options);
            expect(out.min).toEqual([{val: -1, pad: 10, extrapad: false}]);
            expect(out.max).toEqual([{val: 9, pad: 10, extrapad: false}]);
        });

        it('handles symmetric pads as number arrays', function() {
            ax = getDefaultAx();
            data = [1, 4, 2, 7];
            options = {vpad: [1, 10, 6, 3], ppad: [0, 15, 20, 10]};

            out = findExtremes(ax, data, options);
            expect(out.min).toEqual([
                {val: -6, pad: 15, extrapad: false},
                {val: -4, pad: 20, extrapad: false}
            ]);
            expect(out.max).toEqual([
                {val: 14, pad: 15, extrapad: false},
                {val: 8, pad: 20, extrapad: false}
            ]);
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

            out = findExtremes(ax, data, options);
            expect(out.min).toEqual([{val: -4, pad: 10, extrapad: false}]);
            expect(out.max).toEqual([{val: 11, pad: 20, extrapad: false}]);
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

            out = findExtremes(ax, data, options);
            expect(out.min).toEqual([
                {val: 1, pad: 30, extrapad: false},
                {val: -3, pad: 10, extrapad: false}
            ]);
            expect(out.max).toEqual([
                {val: 9, pad: 0, extrapad: false},
                {val: 3, pad: 40, extrapad: false},
                {val: 8, pad: 20, extrapad: false}
            ]);
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

            out = findExtremes(ax, data, options);
            expect(out.min).toEqual([{val: -1, pad: 20, extrapad: false}]);
            expect(out.max).toEqual([{val: 9, pad: 40, extrapad: false}]);
        });

        it('adds 5% padding if specified by flag', function() {
            ax = getDefaultAx();
            data = [1, 5];
            options = {vpad: 1, ppad: 10, padded: true};

            out = findExtremes(ax, data, options);
            expect(out.min).toEqual([{val: 0, pad: 10, extrapad: true}]);
            expect(out.max).toEqual([{val: 6, pad: 10, extrapad: true}]);
        });

        it('has lower bound zero with all positive data if tozero is sset', function() {
            ax = getDefaultAx();
            data = [2, 5];
            options = {vpad: 1, ppad: 10, tozero: true};

            out = findExtremes(ax, data, options);
            expect(out.min).toEqual([{val: 0, pad: 0, extrapad: false}]);
            expect(out.max).toEqual([{val: 6, pad: 10, extrapad: false}]);
        });

        it('has upper bound zero with all negative data if tozero is set', function() {
            ax = getDefaultAx();
            data = [-7, -4];
            options = {vpad: 1, ppad: 10, tozero: true};

            out = findExtremes(ax, data, options);
            expect(out.min).toEqual([{val: -8, pad: 10, extrapad: false}]);
            expect(out.max).toEqual([{val: 0, pad: 0, extrapad: false}]);
        });

        it('sets neither bound to zero with positive and negative data if tozero is set', function() {
            ax = getDefaultAx();
            data = [-7, 4];
            options = {vpad: 1, ppad: 10, tozero: true};

            out = findExtremes(ax, data, options);
            expect(out.min).toEqual([{val: -8, pad: 10, extrapad: false}]);
            expect(out.max).toEqual([{val: 5, pad: 10, extrapad: false}]);
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

            out = findExtremes(ax, data, options);
            expect(out.min).toEqual([{val: 0, pad: 0, extrapad: false}]);
            expect(out.max).toEqual([{val: 6, pad: 10, extrapad: true}]);
        });

        it('should fail if no data is given', function() {
            ax = getDefaultAx();
            expect(function() { findExtremes(ax); }).toThrow();
        });

        it('should return even if `autorange` is false', function() {
            ax = getDefaultAx();
            ax.autorange = false;
            ax.rangeslider = { autorange: false };
            data = [2, 5];

            out = findExtremes(ax, data, {});
            expect(out.min).toEqual([{val: 2, pad: 0, extrapad: false}]);
            expect(out.max).toEqual([{val: 5, pad: 0, extrapad: false}]);
        });
    });

    describe('calcTicks and tickText', function() {
        function mockCalc(ax) {
            ax.tickfont = {};
            Axes.setConvert(ax, {separators: '.,', _extraFormat: {
                year: '%Y',
                month: '%b %Y',
                dayMonth: '%b %-d',
                dayMonthYear: '%b %-d, %Y'
            }});
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

        it('reverts to "power" for SI/B exponentformat beyond the prefix range (linear case)', function() {
            var textOut = mockCalc({
                type: 'linear',
                tickmode: 'linear',
                exponentformat: 'B',
                showexponent: 'all',
                tick0: 0,
                dtick: 1e13,
                range: [8.5e13, 11.5e13]
            });

            expect(textOut).toEqual([
                '90T', '100T', '110T'
            ]);

            textOut = mockCalc({
                type: 'linear',
                tickmode: 'linear',
                exponentformat: 'B',
                showexponent: 'all',
                tick0: 0,
                dtick: 1e14,
                range: [8.5e14, 11.5e14]
            });

            expect(textOut).toEqual([
                '0.9×10<sup>15</sup>',
                '1×10<sup>15</sup>',
                '1.1×10<sup>15</sup>'
            ]);

            textOut = mockCalc({
                type: 'linear',
                tickmode: 'linear',
                exponentformat: 'SI',
                showexponent: 'all',
                tick0: 0,
                dtick: 1e-16,
                range: [8.5e-16, 11.5e-16]
            });

            expect(textOut).toEqual([
                '0.9f', '1f', '1.1f'
            ]);

            textOut = mockCalc({
                type: 'linear',
                tickmode: 'linear',
                exponentformat: 'SI',
                showexponent: 'all',
                tick0: 0,
                dtick: 1e-17,
                range: [8.5e-17, 11.5e-17]
            });

            expect(textOut).toEqual([
                '0.9×10<sup>\u221216</sup>',
                '1×10<sup>\u221216</sup>',
                '1.1×10<sup>\u221216</sup>'
            ]);
        });

        it('reverts to "power" for SI/B exponentformat beyond the prefix range (log case)', function() {
            var textOut = mockCalc({
                type: 'log',
                tickmode: 'linear',
                exponentformat: 'B',
                showexponent: 'all',
                tick0: 0,
                dtick: 1,
                range: [-18.5, 18.5]
            });

            expect(textOut).toEqual([
                '10<sup>\u221218</sup>',
                '10<sup>\u221217</sup>',
                '10<sup>\u221216</sup>',
                '1f', '10f', '100f', '1p', '10p', '100p', '1n', '10n', '100n',
                '1μ', '10μ', '100μ', '0.001', '0.01', '0.1', '1', '10', '100',
                '1000', '10k', '100k', '1M', '10M', '100M', '1B', '10B', '100B',
                '1T', '10T', '100T',
                '10<sup>15</sup>',
                '10<sup>16</sup>',
                '10<sup>17</sup>',
                '10<sup>18</sup>'
            ]);

            textOut = mockCalc({
                type: 'log',
                tickmode: 'linear',
                exponentformat: 'SI',
                showexponent: 'all',
                tick0: 0,
                dtick: 'D2',
                range: [7.9, 12.1]
            });

            expect(textOut).toEqual([
                '100M', '2', '5',
                '1G', '2', '5',
                '10G', '2', '5',
                '100G', '2', '5',
                '1T'
            ]);
        });

        it('supports e/E format on log axes', function() {
            ['e', 'E'].forEach(function(e) {
                var textOut = mockCalc({
                    type: 'log',
                    tickmode: 'linear',
                    exponentformat: e,
                    showexponent: 'all',
                    tick0: 0,
                    dtick: 'D2',
                    range: [-4.1, 4.1]
                });

                var oep = '1' + e + '+';
                var oem = '1' + e + '\u2212';

                expect(textOut).toEqual([
                    oem + '4', '2', '5',
                    oem + '3', '2', '5',
                    '0.01', '2', '5',
                    '0.1', '2', '5',
                    '1', '2', '5',
                    '10', '2', '5',
                    '100', '2', '5',
                    oep + '3', '2', '5',
                    oep + '4'
                ]);
            });
        });

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

        it('never gives date dtick < 100 microseconds (autotick case)', function() {
            var ax = {
                type: 'date',
                tickmode: 'auto',
                nticks: '100',
                range: ['2017-02-08 05:21:18.145', '2017-02-08 05:21:18.1451']
            };

            var textOut = mockCalc(ax);
            var expectedText = ['05:21:18.145<br>Feb 8, 2017', '05:21:18.1451'];
            expect(textOut).toEqual(expectedText);
        });

        it('never gives date dtick < 100 microseconds (explicit tick case)', function() {
            var ax = {
                type: 'date',
                tickmode: 'linear',
                tick0: '2000-01-01',
                dtick: 0.01,
                range: ['2017-02-08 05:21:18.145', '2017-02-08 05:21:18.1451']
            };

            var textOut = mockCalc(ax);
            var expectedText = ['05:21:18.145<br>Feb 8, 2017', '05:21:18.1451'];
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
                _categoriesMap: {'a': 0, 'b': 1, 'c': 2, 'd': 3},
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

        it('notices when all categories are off the edge', function() {
            var ax = {
                type: 'category',
                _categories: ['a', 'b', 'c', 'd'],
                _categoriesMap: {'a': 0, 'b': 1, 'c': 2, 'd': 3},
                tickmode: 'linear',
                tick0: 0,
                dtick: 1,
                range: [-0.5, 3.5]
            };

            // baseline
            expect(mockCalc(ax)).toEqual(['a', 'b', 'c', 'd']);
            // reversed baseline
            ax.range = [3.5, -0.5];
            expect(mockCalc(ax)).toEqual(['d', 'c', 'b', 'a']);

            [[-5, -1], [-1, -5], [5, 10], [10, 5]].forEach(function(rng) {
                ax.range = rng;
                expect(mockCalc(ax).length).toBe(0, rng);
            });
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

        it('avoids infinite loops due to rounding errors', function() {
            var textOut = mockCalc({
                type: 'linear',
                tickmode: 'linear',
                tick0: 1e200,
                dtick: 1e-200,
                range: [1e200, 2e200]
            });

            // with the fix for #1645 we're not even getting the '-Infinity' we used to :tada:
            expect(textOut.length).toBe(0);
        });

        it('truncates at the greater of 1001 ticks or one per pixel', function() {
            var ax = {
                type: 'linear',
                tickmode: 'linear',
                tick0: 0,
                dtick: 1,
                range: [0, 1e6],
                _length: 100
            };

            expect(mockCalc(ax).length).toBe(1001);

            ax._length = 10000;

            expect(mockCalc(ax).length).toBe(10001);
        });

        it('never hides the exponent when in hover mode', function() {
            var ax = {
                type: 'linear',
                tickmode: 'linear',
                tick0: 0,
                dtick: 2e20,
                range: [0, 1.0732484076433121e21],
                _length: 270
            };

            mockCalc(ax);

            expect(mockHoverText(ax, 1e-21)).toBe('1×10<sup>−21</sup>');
            expect(mockHoverText(ax, 1)).toBe('1');
            expect(mockHoverText(ax, 1e21)).toBe('1×10<sup>21</sup>');
        });
    });

    describe('autoBin', function() {

        function _autoBin(x, ax, nbins) {
            ax._categories = [];
            ax._categoriesMap = {};
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
                size: 1,
                _dataSpan: 2
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
                size: 2,
                _dataSpan: NaN
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
                size: 2,
                _dataSpan: NaN
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
                size: 2,
                _dataSpan: NaN
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
                size: 1,
                _dataSpan: 3
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
                size: 2,
                _dataSpan: 3
            });
        });
    });

    describe('makeCalcdata', function() {
        var ax;

        function _makeCalcdata(trace, axLetter, axType) {
            ax = {type: axType};
            Axes.setConvert(ax);
            ax._categories = [];
            ax._traceIndices = [0];
            if(axType === 'multicategory') ax.setupMultiCategory([trace]);
            return ax.makeCalcdata(trace, axLetter);
        }

        describe('should convert items', function() {
            it('- linear case', function() {
                var out = _makeCalcdata({
                    x: ['1', NaN, null, 2],
                }, 'x', 'linear');
                expect(out).toEqual([1, BADNUM, BADNUM, 2]);
            });

            it('- date case', function() {
                var msLocal = new Date(2000, 0, 1).getTime();
                var msUTC = 946684800000;
                var out = _makeCalcdata({
                    x: ['2000-01-01', NaN, null, msLocal],
                }, 'x', 'date');
                expect(out).toEqual([msUTC, BADNUM, BADNUM, msUTC]);

                // fractional milliseconds - should round to 0.1 msec
                var out2 = _makeCalcdata({
                    x: [msLocal, msLocal + 0.04, msLocal + 0.06, msLocal + 0.5, msLocal + 0.94, msLocal + 0.96, msLocal + 1]
                }, 'x', 'date');
                expect(out2).toEqual([msUTC, msUTC, msUTC + 0.1, msUTC + 0.5, msUTC + 0.9, msUTC + 1, msUTC + 1]);
            });

            it('- category case', function() {
                var out = _makeCalcdata({
                    x: ['a', 'b', null, 4],
                }, 'x', 'category');

                expect(out).toEqual([0, 1, BADNUM, 2]);
            });
        });

        describe('should fill item to other coordinate length if not present', function() {
            it('- base case', function() {
                var out = _makeCalcdata({
                    y: [1, 2, 1],
                }, 'x', 'linear');
                expect(out).toEqual([0, 1, 2]);
            });

            it('- x0/dx case', function() {
                var out = _makeCalcdata({
                    y: [1, 2, 1],
                    x0: 2,
                    dx: 10,
                    _length: 3
                }, 'x', 'linear');
                expect(out).toEqual([2, 12, 22]);
            });

            it('- other length case', function() {
                var out = _makeCalcdata({
                    _length: 5,
                    y: [1, 2, 1],
                }, 'x', 'linear');
                expect(out).toEqual([0, 1, 2, 3, 4]);
            });
        });

        describe('should subarray typed arrays', function() {
            it('- same length linear case', function() {
                var x = new Float32Array([1, 2, 3]);
                var out = _makeCalcdata({
                    _length: 3,
                    x: x
                }, 'x', 'linear');
                expect(out).toBe(x);
            });

            it('- same length log case', function() {
                var x = new Float32Array([1, 2, 3]);
                var out = _makeCalcdata({
                    _length: 3,
                    x: x
                }, 'x', 'log');
                expect(out).toBe(x);
            });

            it('- subarray case', function() {
                var x = new Float32Array([1, 2, 3]);
                var out = _makeCalcdata({
                    _length: 2,
                    x: x
                }, 'x', 'linear');
                expect(out).toEqual(new Float32Array([1, 2]));
                // check that in and out are linked to same buffer
                expect(out.buffer).toBeDefined();
                expect(out.buffer).toEqual(x.buffer);
            });
        });

        describe('should convert typed arrays to plain array', function() {
            it('- on a category axis', function() {
                var out = _makeCalcdata({
                    x: new Float32Array([3, 1, 2]),
                }, 'x', 'category');
                expect(out).toEqual([0, 1, 2]);
                expect(ax._categories).toEqual([3, 1, 2]);
            });

            it('- on a date axis', function() {
                var dates = [[2000, 0, 1], [2001, 0, 1], [2002, 0, 1]]
                    .map(function(d) { return new Date(d[0], d[1], d[2]).getTime(); });

                // We could make this work down the road (in v2),
                // when address our timezone problems.
                var out = _makeCalcdata({
                    x: new Float64Array(dates)
                }, 'x', 'date');

                expect(out).toEqual([946684800000, 978307200000, 1009843200000]);
            });
        });

        describe('should set up category maps correctly for multicategory axes', function() {
            it('case 1', function() {
                var out = _makeCalcdata({
                    x: [['1', '1', '2', '2'], ['a', 'b', 'a', 'b']]
                }, 'x', 'multicategory');

                expect(out).toEqual([0, 1, 2, 3]);
                expect(ax._categories).toEqual([['1', 'a'], ['1', 'b'], ['2', 'a'], ['2', 'b']]);
                expect(ax._categoriesMap).toEqual({'1,a': 0, '1,b': 1, '2,a': 2, '2,b': 3});
            });

            it('case 2', function() {
                var out = _makeCalcdata({
                    x: [['1', '2', '1', '2'], ['a', 'a', 'b', 'b']]
                }, 'x', 'multicategory');

                expect(out).toEqual([0, 2, 1, 3]);
                expect(ax._categories).toEqual([['1', 'a'], ['1', 'b'], ['2', 'a'], ['2', 'b']]);
                expect(ax._categoriesMap).toEqual({'1,a': 0, '1,b': 1, '2,a': 2, '2,b': 3});
            });

            it('case invalid in x[0]', function() {
                var out = _makeCalcdata({
                    x: [['1', '2', null, '2'], ['a', 'a', 'b', 'b']]
                }, 'x', 'multicategory');

                expect(out).toEqual([0, 1, BADNUM, 2]);
                expect(ax._categories).toEqual([['1', 'a'], ['2', 'a'], ['2', 'b']]);
                expect(ax._categoriesMap).toEqual({'1,a': 0, '2,a': 1, '2,b': 2});
            });

            it('case invalid in x[1]', function() {
                var out = _makeCalcdata({
                    x: [['1', '2', '1', '2'], ['a', 'a', null, 'b']]
                }, 'x', 'multicategory');

                expect(out).toEqual([0, 1, BADNUM, 2]);
                expect(ax._categories).toEqual([['1', 'a'], ['2', 'a'], ['2', 'b']]);
                expect(ax._categoriesMap).toEqual({'1,a': 0, '2,a': 1, '2,b': 2});
            });

            it('case 1D coordinate array', function() {
                var out = _makeCalcdata({
                    x: ['a', 'b', 'c']
                }, 'x', 'multicategory');

                expect(out).toEqual([BADNUM, BADNUM, BADNUM]);
                expect(ax._categories).toEqual([]);
                expect(ax._categoriesMap).toEqual(undefined);
            });

            it('case 2D 1-row coordinate array', function() {
                var out = _makeCalcdata({
                    x: [['a', 'b', 'c']]
                }, 'x', 'multicategory');

                expect(out).toEqual([BADNUM, BADNUM, BADNUM]);
                expect(ax._categories).toEqual([]);
                expect(ax._categoriesMap).toEqual(undefined);
            });

            it('case 2D with empty x[0] row coordinate array', function() {
                var out = _makeCalcdata({
                    x: [null, ['a', 'b', 'c']]
                }, 'x', 'multicategory');

                expect(out).toEqual([BADNUM, BADNUM]);
                expect(ax._categories).toEqual([]);
                expect(ax._categoriesMap).toEqual(undefined);
            });

            it('case with inner typed arrays and set type:multicategory', function() {
                var out = _makeCalcdata({
                    x: [
                        new Float32Array([1, 2, 1, 2]),
                        new Float32Array([10, 10, 20, 20])
                    ]
                }, 'x', 'multicategory');

                expect(out).toEqual([0, 2, 1, 3]);
                expect(ax._categories).toEqual([[1, 10], [1, 20], [2, 10], [2, 20]]);
                expect(ax._categoriesMap).toEqual({'1,10': 0, '1,20': 1, '2,10': 2, '2,20': 3});
            });
        });

        describe('2d coordinate array on non-multicategory axes should return BADNUMs', function() {
            var axTypes = ['linear', 'log', 'date'];

            axTypes.forEach(function(t) {
                it('- case ' + t, function() {
                    var out = _makeCalcdata({
                        x: [['1', '1', '2', '2'], ['a', 'b', 'a', 'b']]
                    }, 'x', t);
                    expect(out).toEqual([BADNUM, BADNUM, BADNUM, BADNUM]);
                });
            });

            it('- case category', function() {
                var out = _makeCalcdata({
                    x: [['1', '1', '2', '2'], ['a', 'b', 'a', 'b']]
                }, 'x', 'category');
                // picks out length=4
                expect(out).toEqual([0, 1, undefined, undefined]);
            });
        });
    });

    describe('automargin', function() {
        var data = [{
            x: [
                'short label 1', 'loooooong label 1',
                'short label 2', 'loooooong label 2',
                'short label 3', 'loooooong label 3',
                'short label 4', 'loooooongloooooongloooooong label 4',
                'short label 5', 'loooooong label 5'
            ],
            y: [
                'short label 1', 'loooooong label 1',
                'short label 2', 'loooooong label 2',
                'short label 3', 'loooooong label 3',
                'short label 4', 'loooooong label 4',
                'short label 5', 'loooooong label 5'
            ]
        }];
        var gd, initialSize, previousSize, savedBottom;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should grow and shrink margins', function(done) {

            Plotly.plot(gd, data)
            .then(function() {
                expect(gd._fullLayout.xaxis._tickAngles.xtick).toBe(30);

                initialSize = previousSize = Lib.extendDeep({}, gd._fullLayout._size);
                return Plotly.relayout(gd, {'yaxis.automargin': true});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBeGreaterThan(previousSize.l);
                expect(size.r).toBe(previousSize.r);
                expect(size.b).toBe(previousSize.b);
                expect(size.t).toBe(previousSize.t);

                previousSize = Lib.extendDeep({}, size);
                return Plotly.relayout(gd, {'xaxis.automargin': true});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBe(previousSize.l);
                expect(size.r).toBe(previousSize.r);
                expect(size.b).toBeGreaterThan(previousSize.b);
                expect(size.t).toBe(previousSize.t);

                previousSize = Lib.extendDeep({}, size);
                savedBottom = previousSize.b;

                // move all the long x labels off-screen
                return Plotly.relayout(gd, {'xaxis.range': [-10, -5]});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBe(previousSize.l);
                expect(size.r).toBe(previousSize.r);
                expect(size.t).toBe(previousSize.t);
                expect(size.b).toBe(initialSize.b);

                // move all the long y labels off-screen
                return Plotly.relayout(gd, {'yaxis.range': [-10, -5]});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBe(initialSize.l);
                expect(size.r).toBe(previousSize.r);
                expect(size.t).toBe(previousSize.t);
                expect(size.b).toBe(initialSize.b);

                // bring the long labels back
                return Plotly.relayout(gd, {
                    'xaxis.autorange': true,
                    'yaxis.autorange': true
                });
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBe(previousSize.l);
                expect(size.r).toBe(previousSize.r);
                expect(size.t).toBe(previousSize.t);
                expect(size.b).toBe(previousSize.b);

                return Plotly.relayout(gd, {'xaxis.tickangle': 45});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBe(previousSize.l);
                expect(size.r).toBe(previousSize.r);
                expect(size.b).toBeGreaterThan(previousSize.b);
                expect(size.t).toBe(previousSize.t);

                previousSize = Lib.extendDeep({}, size);
                return Plotly.relayout(gd, {'xaxis.tickangle': 30});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBe(previousSize.l);
                expect(size.r).toBe(previousSize.r);
                expect(size.b).toBe(savedBottom);
                expect(size.t).toBe(previousSize.t);

                previousSize = Lib.extendDeep({}, size);
                return Plotly.relayout(gd, {'yaxis.ticklen': 30});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBeGreaterThan(previousSize.l);
                expect(size.r).toBe(previousSize.r);
                expect(size.b).toBe(previousSize.b);
                expect(size.t).toBe(previousSize.t);

                previousSize = Lib.extendDeep({}, size);
                return Plotly.relayout(gd, {'yaxis.title.font.size': 30});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size).toEqual(previousSize);

                previousSize = Lib.extendDeep({}, size);
                return Plotly.relayout(gd, {'yaxis.title.text': 'hello'});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBeGreaterThan(previousSize.l);
                expect(size.r).toBe(previousSize.r);
                expect(size.b).toBe(previousSize.b);
                expect(size.t).toBe(previousSize.t);

                previousSize = Lib.extendDeep({}, size);
                return Plotly.relayout(gd, {'yaxis.anchor': 'free'});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBeWithin(previousSize.l, 1.1);
                expect(size.r).toBe(previousSize.r);
                expect(size.b).toBe(previousSize.b);
                expect(size.t).toBe(previousSize.t);

                previousSize = Lib.extendDeep({}, size);
                return Plotly.relayout(gd, {'yaxis.position': 0.1});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBeLessThan(previousSize.l, 'axis moved right');
                expect(size.r).toBe(previousSize.r);
                expect(size.b).toBe(previousSize.b);
                expect(size.t).toBe(previousSize.t);

                previousSize = Lib.extendDeep({}, size);
                return Plotly.relayout(gd, {'yaxis.anchor': 'x'});
            })
            .then(function() {
                var size = gd._fullLayout._size;
                expect(size.l).toBeGreaterThan(previousSize.l, 'axis snapped back');
                expect(size.r).toBe(previousSize.r);
                expect(size.b).toBe(previousSize.b);
                expect(size.t).toBe(previousSize.t);

                previousSize = Lib.extendDeep({}, size);
                return Plotly.relayout(gd, {
                    'yaxis.side': 'right',
                    'xaxis.side': 'top'
                });
            })
            .then(function() {
                var size = gd._fullLayout._size;
                // left to right and bottom to top
                expect(size.l).toBe(initialSize.r);
                expect(size.r).toBe(previousSize.l);
                expect(size.b).toBe(initialSize.b);
                expect(size.t).toBeWithin(previousSize.b, 1.1);

                return Plotly.relayout(gd, {
                    'xaxis.automargin': false,
                    'yaxis.automargin': false
                });
            })
            .then(function() {
                var size = gd._fullLayout._size;
                // back to the defaults
                expect(size).toEqual(initialSize);
            })
            .catch(failTest)
            .then(done);

        });
    });

    describe('zeroline visibility logic', function() {
        var gd;
        beforeEach(function() {
            gd = createGraphDiv();
        });
        afterEach(destroyGraphDiv);

        function assertZeroLines(expectedIDs) {
            var sortedIDs = expectedIDs.slice().sort();
            var zlIDs = [];
            d3.select(gd).selectAll('.zl').each(function() {
                var cls = d3.select(this).attr('class');
                var clsMatch = cls.match(/[xy]\d*(?=zl)/g)[0];
                zlIDs.push(clsMatch);
            });
            zlIDs.sort();
            expect(zlIDs).toEqual(sortedIDs);
        }

        it('works with a single subplot', function(done) {
            Plotly.newPlot(gd, [{x: [1, 2, 3], y: [1, 2, 3]}], {
                xaxis: {range: [0, 4], showzeroline: true, showline: true},
                yaxis: {range: [0, 4], showzeroline: true, showline: true},
                width: 600,
                height: 600
            })
            .then(function() {
                assertZeroLines([]);
                return Plotly.relayout(gd, {'xaxis.showline': false});
            })
            .then(function() {
                assertZeroLines(['y']);
                return Plotly.relayout(gd, {'xaxis.showline': true, 'yaxis.showline': false});
            })
            .then(function() {
                assertZeroLines(['x']);
                return Plotly.relayout(gd, {'yaxis.showline': true, 'yaxis.range': [4, 0]});
            })
            .then(function() {
                assertZeroLines(['y']);
                return Plotly.relayout(gd, {'xaxis.range': [4, 0], 'xaxis.side': 'top'});
            })
            .then(function() {
                assertZeroLines(['x']);
                return Plotly.relayout(gd, {'yaxis.side': 'right', 'xaxis.anchor': 'free', 'xaxis.position': 1});
            })
            .then(function() {
                assertZeroLines([]);
                return Plotly.relayout(gd, {'xaxis.range': [0, 4], 'yaxis.range': [0, 4]});
            })
            .then(function() {
                assertZeroLines(['x', 'y']);
                return Plotly.relayout(gd, {'xaxis.mirror': 'all', 'yaxis.mirror': true});
            })
            .then(function() {
                assertZeroLines([]);
                return Plotly.relayout(gd, {'xaxis.range': [-0.1, 4], 'yaxis.range': [-0.1, 4]});
            })
            .then(function() {
                assertZeroLines(['x', 'y']);
            })
            .catch(failTest)
            .then(done);
        });

        it('works with multiple coupled subplots', function(done) {
            Plotly.newPlot(gd, [
                {x: [1, 2, 3], y: [1, 2, 3]},
                {x: [1, 2, 3], y: [1, 2, 3], xaxis: 'x2'},
                {x: [1, 2, 3], y: [1, 2, 3], yaxis: 'y2'}
            ], {
                xaxis: {range: [0, 4], showzeroline: true, domain: [0, 0.4]},
                yaxis: {range: [0, 4], showzeroline: true, domain: [0, 0.4]},
                xaxis2: {range: [0, 4], showzeroline: true, domain: [0.6, 1]},
                yaxis2: {range: [0, 4], showzeroline: true, domain: [0.6, 1]},
                width: 600,
                height: 600
            })
            .then(function() {
                assertZeroLines(['x', 'x', 'y', 'y', 'x2', 'y2']);
                return Plotly.relayout(gd, {'xaxis.showline': true, 'xaxis.mirror': 'all'});
            })
            .then(function() {
                assertZeroLines(['x', 'x', 'y', 'x2']);
                return Plotly.relayout(gd, {'yaxis.showline': true, 'yaxis.mirror': 'all'});
            })
            .then(function() {
                // x axis still has a zero line on xy2, and y on x2y
                // all the others have disappeared now
                assertZeroLines(['x', 'y']);
                return Plotly.relayout(gd, {'xaxis.mirror': 'allticks', 'yaxis.mirror': 'allticks'});
            })
            .then(function() {
                // allticks works the same as all
                assertZeroLines(['x', 'y']);
            })
            .catch(failTest)
            .then(done);
        });

        it('works with multiple overlaid subplots', function(done) {
            Plotly.newPlot(gd, [
                {x: [1, 2, 3], y: [1, 2, 3]},
                {x: [1, 2, 3], y: [1, 2, 3], xaxis: 'x2', yaxis: 'y2'}
            ], {
                xaxis: {range: [0, 4], showzeroline: true},
                yaxis: {range: [0, 4], showzeroline: true},
                xaxis2: {range: [0, 4], showzeroline: true, side: 'top', overlaying: 'x'},
                yaxis2: {range: [0, 4], showzeroline: true, side: 'right', overlaying: 'y'},
                width: 600,
                height: 600
            })
            .then(function() {
                assertZeroLines(['x', 'y', 'x2', 'y2']);
                return Plotly.relayout(gd, {'xaxis.showline': true, 'yaxis.showline': true});
            })
            .then(function() {
                assertZeroLines([]);
                return Plotly.relayout(gd, {
                    'xaxis.range': [4, 0],
                    'yaxis.range': [4, 0],
                    'xaxis2.range': [4, 0],
                    'yaxis2.range': [4, 0]
                });
            })
            .then(function() {
                assertZeroLines(['x', 'y', 'x2', 'y2']);
                return Plotly.relayout(gd, {
                    'xaxis.showline': false,
                    'yaxis.showline': false,
                    'xaxis2.showline': true,
                    'yaxis2.showline': true
                });
            })
            .then(function() {
                assertZeroLines([]);
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('*tickson*:', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should respond to relayout', function(done) {
            function getPositions(query) {
                var pos = [];
                d3.selectAll(query).each(function() {
                    pos.push(this.getBoundingClientRect().x);
                });
                return pos;
            }

            function _assert(msg, exp) {
                var ticks = getPositions('path.xtick');
                var gridLines = getPositions('path.xgrid');
                var tickLabels = getPositions('.xtick > text');

                expect(ticks).toBeCloseToArray(exp.ticks, 1, msg + '- ticks');
                expect(gridLines).toBeCloseToArray(exp.gridLines, 1, msg + '- grid lines');
                expect(tickLabels.length).toBe(exp.tickLabels.length, msg + '- # of tick labels');
                tickLabels.forEach(function(tl, i) {
                    expect(tl).toBeWithin(exp.tickLabels[i], 2, msg + '- tick label ' + i);
                });
            }

            Plotly.plot(gd, [{
                x: ['a', 'b', 'c'],
                y: [1, 2, 1]
            }], {
                xaxis: {
                    ticks: 'inside',
                    showgrid: true
                }
            })
            .then(function() {
                _assert('on labels (defaults)', {
                    ticks: [110.75, 350, 589.25],
                    gridLines: [110.75, 350, 589.25],
                    tickLabels: [106.421, 345.671, 585.25]
                });
                return Plotly.relayout(gd, 'xaxis.tickson', 'boundaries');
            })
            .then(function() {
                _assert('inside on boundaries', {
                    ticks: [230.369, 469.619], // N.B. first and last tick are clipped
                    gridLines: [230.369, 469.619],
                    tickLabels: [106.421875, 345.671875, 585.25]
                });
                return Plotly.relayout(gd, 'xaxis.ticks', 'outside');
            })
            .then(function() {
                _assert('outside on boundaries', {
                    ticks: [230.369, 469.619],
                    gridLines: [230.369, 469.619],
                    tickLabels: [106.421875, 345.671875, 585.25]
                });
                return Plotly.restyle(gd, 'x', [[1, 2, 1]]);
            })
            .then(function() {
                _assert('fallback to *labels* on non-category axes', {
                    ticks: [110.75, 206.449, 302.149, 397.85, 493.549, 589.25],
                    gridLines: [110.75, 206.449, 302.149, 397.85, 493.549, 589.25],
                    tickLabels: [106.421, 197.121, 292.821, 388.521, 484.221, 584.921]
                });
            })
            .catch(failTest)
            .then(done);
        });

        it('should rotate labels to avoid overlaps', function(done) {
            function _assert(msg, exp) {
                var tickLabels = d3.selectAll('.xtick > text');

                expect(tickLabels.size()).toBe(exp.angle.length, msg + ' - # of tick labels');

                tickLabels.each(function(_, i) {
                    var t = d3.select(this).attr('transform');
                    var rotate = (t.split('rotate(')[1] || '').split(')')[0];
                    var angle = rotate.split(',')[0];
                    expect(Number(angle)).toBe(exp.angle[i], msg + ' - node ' + i);
                });
            }

            Plotly.plot(gd, [{
                x: ['A very long title', 'short', 'Another very long title'],
                y: [1, 4, 2]
            }], {
                xaxis: {
                    domain: [0.22, 0.78],
                    tickson: 'boundaries',
                    ticks: 'outside'
                },
                width: 500,
                height: 500
            })
            .then(function() {
                _assert('base - rotated', {
                    angle: [90, 90, 90]
                });

                return Plotly.relayout(gd, 'xaxis.range', [-0.4, 1.4]);
            })
            .then(function() {
                _assert('narrower range - unrotated', {
                    angle: [0, 0]
                });

                return Plotly.relayout(gd, 'xaxis.tickwidth', 30);
            })
            .then(function() {
                _assert('narrow range / wide ticks - rotated', {
                    angle: [90, 90]
                });
            })
            .catch(failTest)
            .then(done);
        });
    });
});

function getZoomInButton(gd) {
    return selectButton(gd._fullLayout._modeBar, 'zoomIn2d');
}

function getZoomOutButton(gd) {
    return selectButton(gd._fullLayout._modeBar, 'zoomOut2d');
}

function getFormatter(format) {
    return d3.time.format.utc(format);
}

describe('Test Axes.getTickformat', function() {
    'use strict';

    it('get proper tickformatstop for linear axis', function() {
        var lineartickformatstops = [
            {
                enabled: true,
                dtickrange: [null, 1],
                value: '.f2',
            },
            {
                enabled: true,
                dtickrange: [1, 100],
                value: '.f1',
            },
            {
                enabled: true,
                dtickrange: [100, null],
                value: 'g',
            }
        ];
        expect(Axes.getTickFormat({
            type: 'linear',
            tickformatstops: lineartickformatstops,
            dtick: 0.1
        })).toEqual(lineartickformatstops[0].value);

        expect(Axes.getTickFormat({
            type: 'linear',
            tickformatstops: lineartickformatstops,
            dtick: 1
        })).toEqual(lineartickformatstops[0].value);

        expect(Axes.getTickFormat({
            type: 'linear',
            tickformatstops: lineartickformatstops,
            dtick: 99
        })).toEqual(lineartickformatstops[1].value);
        expect(Axes.getTickFormat({
            type: 'linear',
            tickformatstops: lineartickformatstops,
            dtick: 99999
        })).toEqual(lineartickformatstops[2].value);

        // a stop is ignored if it's set invisible, but the others are used
        lineartickformatstops[1].enabled = false;
        expect(Axes.getTickFormat({
            type: 'linear',
            tickformatstops: lineartickformatstops,
            dtick: 99
        })).toBeUndefined();
        expect(Axes.getTickFormat({
            type: 'linear',
            tickformatstops: lineartickformatstops,
            dtick: 99999
        })).toEqual(lineartickformatstops[2].value);
    });

    it('get proper tickformatstop for date axis', function() {
        var MILLISECOND = 1;
        var SECOND = MILLISECOND * 1000;
        var MINUTE = SECOND * 60;
        var HOUR = MINUTE * 60;
        var DAY = HOUR * 24;
        var WEEK = DAY * 7;
        var MONTH = 'M1'; // or YEAR / 12;
        var YEAR = 'M12'; // or 365.25 * DAY;
        var datetickformatstops = [
            {
                enabled: true,
                dtickrange: [null, SECOND],
                value: '%H:%M:%S.%L ms' // millisecond
            },
            {
                enabled: true,
                dtickrange: [SECOND, MINUTE],
                value: '%H:%M:%S s' // second
            },
            {
                enabled: true,
                dtickrange: [MINUTE, HOUR],
                value: '%H:%M m' // minute
            },
            {
                enabled: true,
                dtickrange: [HOUR, DAY],
                value: '%H:%M h' // hour
            },
            {
                enabled: true,
                dtickrange: [DAY, WEEK],
                value: '%e. %b d' // day
            },
            {
                enabled: true,
                dtickrange: [WEEK, MONTH],
                value: '%e. %b w' // week
            },
            {
                enabled: true,
                dtickrange: [MONTH, YEAR],
                value: '%b \'%y M' // month
            },
            {
                enabled: true,
                dtickrange: [YEAR, null],
                value: '%Y Y' // year
            }
        ];
        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 100
        })).toEqual(datetickformatstops[0].value); // millisecond

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 1000
        })).toEqual(datetickformatstops[0].value); // millisecond

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 1000 * 60 * 60 * 3 // three hours
        })).toEqual(datetickformatstops[3].value); // hour

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 1000 * 60 * 60 * 24 * 7 * 2 // two weeks
        })).toEqual(datetickformatstops[5].value); // week

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 'M1'
        })).toEqual(datetickformatstops[5].value); // week

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 'M5'
        })).toEqual(datetickformatstops[6].value); // month

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 'M24'
        })).toEqual(datetickformatstops[7].value); // year
    });

    it('get proper tickformatstop for log axis', function() {
        var logtickformatstops = [
            {
                enabled: true,
                dtickrange: [null, 'L0.01'],
                value: '.f3',
            },
            {
                enabled: true,
                dtickrange: ['L0.01', 'L1'],
                value: '.f2',
            },
            {
                enabled: true,
                dtickrange: ['D1', 'D2'],
                value: '.f1',
            },
            {
                enabled: true,
                dtickrange: [1, null],
                value: 'g'
            }
        ];
        expect(Axes.getTickFormat({
            type: 'log',
            tickformatstops: logtickformatstops,
            dtick: 'L0.0001'
        })).toEqual(logtickformatstops[0].value);

        expect(Axes.getTickFormat({
            type: 'log',
            tickformatstops: logtickformatstops,
            dtick: 'L0.1'
        })).toEqual(logtickformatstops[1].value);

        expect(Axes.getTickFormat({
            type: 'log',
            tickformatstops: logtickformatstops,
            dtick: 'L2'
        })).toEqual(undefined);
        expect(Axes.getTickFormat({
            type: 'log',
            tickformatstops: logtickformatstops,
            dtick: 'D2'
        })).toEqual(logtickformatstops[2].value);
        expect(Axes.getTickFormat({
            type: 'log',
            tickformatstops: logtickformatstops,
            dtick: 1
        })).toEqual(logtickformatstops[3].value);
    });
});

describe('Test tickformatstops:', function() {
    'use strict';

    var mock = require('@mocks/tickformatstops.json');

    var mockCopy, gd;

    beforeEach(function() {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
    });

    afterEach(destroyGraphDiv);

    it('handles zooming-in until milliseconds zoom level', function(done) {
        var promise = Plotly.plot(gd, mockCopy.data, mockCopy.layout);

        var testCount = 0;

        var zoomIn = function() {
            promise = promise.then(function() {
                getZoomInButton(gd).click();
                var xLabels = Axes.calcTicks(gd._fullLayout.xaxis);
                var formatter = getFormatter(Axes.getTickFormat(gd._fullLayout.xaxis));
                var expectedLabels = xLabels.map(function(d) {return formatter(new Date(d.x));});
                var actualLabels = xLabels.map(function(d) {return d.text;});
                expect(expectedLabels).toEqual(actualLabels);
                testCount++;

                if(gd._fullLayout.xaxis.dtick > 1) {
                    zoomIn();
                } else {
                    // make sure we tested as many levels as we thought we would
                    expect(testCount).toBe(32);
                    done();
                }
            });
        };
        zoomIn();
    });

    it('handles zooming-out until years zoom level', function(done) {
        var promise = Plotly.plot(gd, mockCopy.data, mockCopy.layout);

        var testCount = 0;

        var zoomOut = function() {
            promise = promise.then(function() {
                getZoomOutButton(gd).click();
                var xLabels = Axes.calcTicks(gd._fullLayout.xaxis);
                var formatter = getFormatter(Axes.getTickFormat(gd._fullLayout.xaxis));
                var expectedLabels = xLabels.map(function(d) {return formatter(new Date(d.x));});
                var actualLabels = xLabels.map(function(d) {return d.text;});
                expect(expectedLabels).toEqual(actualLabels);
                testCount++;

                if(typeof gd._fullLayout.xaxis.dtick === 'number' ||
                    typeof gd._fullLayout.xaxis.dtick === 'string' && parseInt(gd._fullLayout.xaxis.dtick.replace(/\D/g, '')) < 48) {
                    zoomOut();
                } else {
                    // make sure we tested as many levels as we thought we would
                    expect(testCount).toBe(5);
                    done();
                }
            });
        };
        zoomOut();
    });

    it('responds to hover', function(done) {
        var evt = { xpx: 270, ypx: 10 };

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            Fx.hover(gd, evt, 'xy');

            var hoverTrace = gd._hoverdata[0];
            var formatter = getFormatter(Axes.getTickFormat(gd._fullLayout.xaxis));

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(3);
            expect(hoverTrace.x).toEqual('2005-04-01');
            expect(hoverTrace.y).toEqual(0);

            expect(d3.selectAll('g.axistext').size()).toEqual(1);
            expect(d3.selectAll('g.hovertext').size()).toEqual(1);
            expect(d3.selectAll('g.axistext').select('text').html()).toEqual(formatter(new Date(hoverTrace.x)));
            expect(d3.selectAll('g.hovertext').select('text').html()).toEqual('0');
        })
        .catch(failTest)
        .then(done);
    });

    it('doesn\'t fail on bad input', function(done) {
        var promise = Plotly.plot(gd, mockCopy.data, mockCopy.layout);

        [1, {a: 1, b: 2}, 'boo'].forEach(function(v) {
            promise = promise.then(function() {
                return Plotly.relayout(gd, {'xaxis.tickformatstops': v});
            }).then(function() {
                expect(gd._fullLayout.xaxis.tickformatstops).toBeUndefined();
            });
        });

        promise
        .catch(failTest)
        .then(done);
    });
});
