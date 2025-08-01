var Plotly = require('../../../lib/index');
var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var utcFormat = require('d3-time-format').utcFormat;

var Plots = require('../../../src/plots/plots');
var Lib = require('../../../src/lib');
var Loggers = require('../../../src/lib/loggers');
var Color = require('../../../src/components/color');
var tinycolor = require('tinycolor2');

var handleTickValueDefaults = require('../../../src/plots/cartesian/tick_value_defaults');
var Cartesian = require('../../../src/plots/cartesian');
var Axes = require('../../../src/plots/cartesian/axes');
var Fx = require('../../../src/components/fx');
var supplyLayoutDefaults = require('../../../src/plots/cartesian/layout_defaults');
var numerical = require('../../../src/constants/numerical');
var BADNUM = numerical.BADNUM;
var ONEDAY = numerical.ONEDAY;
var ONEWEEK = numerical.ONEWEEK;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var negateIf = require('../assets/negate_if');
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
                autotypenumbers: 'convert types',
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
                checkTypes('linear', 'category');
            });
        });

        describe('autotype disable/enable converting numeric strings', function() {
            it('should disable converting numeric strings using axis.autotypenumbers', function() {
                layoutIn = {
                    xaxis: {},
                    yaxis: { autotypenumbers: 'strict' }
                };

                supplyLayoutDefaults(layoutIn, layoutOut, [{
                    type: 'scatter',
                    xaxis: 'x',
                    yaxis: 'y',
                    x: ['0', '1', '1970', '2000'],
                    y: ['0', '1', '1970', '2000']
                }]);

                expect(layoutOut.xaxis.autotypenumbers).toBe('convert types');
                expect(layoutOut.yaxis.autotypenumbers).toBe('strict');
                expect(layoutOut.xaxis.type).toBe('linear');
                expect(layoutOut.yaxis.type).toBe('category');
            });

            it('should enable converting numeric strings using axis.autotypenumbers and inherit defaults from layout.autotypenumbers', function() {
                layoutOut.autotypenumbers = 'strict';

                layoutIn = {
                    xaxis: { autotypenumbers: 'convert types' },
                    yaxis: {}
                };

                supplyLayoutDefaults(layoutIn, layoutOut, [{
                    type: 'scatter',
                    xaxis: 'x',
                    yaxis: 'y',
                    x: ['0', '1', '1970', '2000'],
                    y: ['0', '1', '1970', '2000']
                }]);

                expect(layoutOut.xaxis.autotypenumbers).toBe('convert types');
                expect(layoutOut.yaxis.autotypenumbers).toBe('strict');
                expect(layoutOut.xaxis.type).toBe('linear');
                expect(layoutOut.yaxis.type).toBe('category');
            });

            it('should autotype date having more dates with & without strict autotypenumbers', function() {
                layoutIn = {
                    xaxis: {},
                    yaxis: { autotypenumbers: 'strict' }
                };

                var dates = [
                    0,
                    '0',
                    '00',
                    '0000',
                    '1970',
                    '2000',
                    '2001-01',
                    '2001-02',
                    '2001-03',
                    '2001-04',
                    '2001-05',
                    '2001-06',
                    '2001-07',
                    '2001-08',
                    '2001-09',
                    '2001-10',
                    '2001-11',
                    '2001-12'
                ];

                supplyLayoutDefaults(layoutIn, layoutOut, [{
                    type: 'scatter',
                    xaxis: 'x',
                    yaxis: 'y',
                    x: dates,
                    y: dates
                }]);

                expect(layoutOut.xaxis.autotypenumbers).toBe('convert types');
                expect(layoutOut.yaxis.autotypenumbers).toBe('strict');
                expect(layoutOut.xaxis.type).toBe('date');
                expect(layoutOut.yaxis.type).toBe('date');
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
                xaxis: { zeroline: true, color: 'red' },
                yaxis: { zerolinecolor: 'blue' },
                yaxis2: { zeroline: true }
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

        it('should default to a dark color for tickfont when plotting background is light', function() {
            layoutIn = {
                plot_bgcolor: 'lightblue',
                xaxis: {
                    showgrid: true,
                    ticklabelposition: 'inside'
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.tickfont.color).toEqual('#444');
        });

        it('should default to a light color for tickfont when plotting background is dark', function() {
            layoutIn = {
                plot_bgcolor: 'darkblue',
                xaxis: {
                    showgrid: true,
                    ticklabelposition: 'inside'
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.tickfont.color).toEqual('#fff');
        });

        it('should not coerce ticklabelposition on *multicategory* axes for now', function() {
            layoutIn = {
                xaxis: {type: 'multicategory'},
                yaxis: {type: 'multicategory'}
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.ticklabelposition).toBeUndefined();
            expect(layoutOut.yaxis.ticklabelposition).toBeUndefined();
        });

        ['category', 'linear', 'date'].forEach(function(type) {
            it('should coerce ticklabelposition on *' + type + '* axes', function() {
                layoutIn = {
                    xaxis: {type: type},
                    yaxis: {type: type}
                };
                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
                expect(layoutOut.xaxis.ticklabelposition).toBe('outside');
                expect(layoutOut.yaxis.ticklabelposition).toBe('outside');
            });
        });

        ['category', 'linear', 'date'].forEach(function(type) {
            it('should be able to set ticklabelposition to *inside* on *' + type + '* axes', function() {
                layoutIn = {
                    xaxis: {type: type, ticklabelposition: 'inside'},
                    yaxis: {type: type, ticklabelposition: 'inside'}
                };
                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
                expect(layoutOut.xaxis.ticklabelposition).toBe('inside');
                expect(layoutOut.yaxis.ticklabelposition).toBe('inside');
            });
        });

        ['inside left', 'inside right', 'outside left', 'outside right'].forEach(function(ticklabelposition) {
            ['category', 'linear', 'date'].forEach(function(type) {
                it('should be able to set ticklabelposition to *' + ticklabelposition + '* on xaxis for *' + type + '* axes', function() {
                    layoutIn = {
                        xaxis: {type: type, ticklabelposition: ticklabelposition},
                        yaxis: {type: type, ticklabelposition: ticklabelposition}
                    };
                    supplyLayoutDefaults(layoutIn, layoutOut, fullData);
                    expect(layoutOut.xaxis.ticklabelposition).toBe(ticklabelposition);
                    expect(layoutOut.yaxis.ticklabelposition).toBe('outside', ticklabelposition + ' is not a valid input on yaxis');
                });
            });
        });

        ['inside top', 'inside bottom', 'outside top', 'outside bottom'].forEach(function(ticklabelposition) {
            ['category', 'linear', 'date'].forEach(function(type) {
                it('should be able to set ticklabelposition to *' + ticklabelposition + '* on yaxis for *' + type + '* axes', function() {
                    layoutIn = {
                        xaxis: {type: type, ticklabelposition: ticklabelposition},
                        yaxis: {type: type, ticklabelposition: ticklabelposition}
                    };
                    supplyLayoutDefaults(layoutIn, layoutOut, fullData);
                    expect(layoutOut.xaxis.ticklabelposition).toBe('outside', ticklabelposition + ' is not a valid input on yaxis');
                    expect(layoutOut.yaxis.ticklabelposition).toBe(ticklabelposition);
                });
            });
        });

        [
            'inside left', 'inside right', 'outside left', 'outside right',
            'inside top', 'inside bottom', 'outside top', 'outside bottom'
        ].forEach(function(ticklabelposition) {
            it('should not be able to set ticklabelposition to *' + ticklabelposition + '* when ticklabelmode is *period*', function() {
                layoutIn = {
                    xaxis: {type: 'date', ticklabelmode: 'period', ticklabelposition: ticklabelposition},
                    yaxis: {type: 'date', ticklabelmode: 'period', ticklabelposition: ticklabelposition}
                };
                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
                expect(layoutOut.xaxis.ticklabelposition).toBe('outside', ticklabelposition + ' is not a valid input with period mode');
                expect(layoutOut.yaxis.ticklabelposition).toBe('outside', ticklabelposition + ' is not a valid input with period mode');
            });
        });

        it('should be able to set ticklabelposition to *inside* on yaxis when ticklabelmode is *period*', function() {
            layoutIn = {
                xaxis: {type: 'date', ticklabelmode: 'period', ticklabelposition: 'inside'},
                yaxis: {type: 'date', ticklabelmode: 'period', ticklabelposition: 'inside'}
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.xaxis.ticklabelposition).toBe('inside');
            expect(layoutOut.yaxis.ticklabelposition).toBe('inside');
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
                xaxis2: { range: [1] },
                xaxis3: { range: [null, null] },
                yaxis: { range: ['a', 2] },
                yaxis2: { range: [1, 'b'] },
                yaxis3: { range: [undefined, {}] },
                yaxis4: { range: [1, null], autorange: 'min' }, // second range is null not first
                yaxis5: { range: [null, 2], autorange: 'max' }, // first range is null not second
                yaxis6: { range: [1, null], autorange: 'max reversed' }, // second range is null not first
                yaxis7: { range: [null, 2], autorange: 'min reversed' }, // first range is null not second
                yaxis8: { range: [1, null], autorange: 'reversed' },
                yaxis9: { range: [null, 2], autorange: 'reversed' },
                yaxis10: { range: [1, null], autorange: true },
                yaxis11: { range: [null, 2], autorange: true },
            };
            layoutOut._subplots.cartesian.push('x2y2', 'xy3', 'x3y4', 'x3y5', 'x3y6', 'x3y7', 'x3y9', 'x3y9', 'x3y10', 'x3y11');
            layoutOut._subplots.yaxis.push('x2', 'x3', 'y2', 'y3', 'y4', 'y5', 'y6', 'y7', 'y8', 'y9', 'y10', 'y11');

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

        it('should set autorange to true when range[0] and range[1] are set to null', function() {
            layoutIn = {
                xaxis: { range: [null, null] }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.autorange).toBe(true);
        });

        it('should set autorange to min when range[0] is set to null', function() {
            layoutIn = {
                xaxis: { range: [null, 1] }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.autorange).toBe('min');
        });

        it('should set autorange to max when range[1] is set to null', function() {
            layoutIn = {
                xaxis: { range: [1, null] }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.autorange).toBe('max');
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

        it('breaks scaleanchor loops and drops conflicting ratios', function() {
            var warnings = [];
            spyOn(Lib, 'warn').and.callFake(function(msg) {
                warnings.push(msg.substr(0, msg.indexOf(' to avoid')));
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
            layoutOut._subplots.xaxis.push('x2', 'x3', 'x4');
            layoutOut._subplots.yaxis.push('y2', 'y3', 'y4');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisConstraintGroups).toEqual([
                {x: 2, y: 1, x4: 2 * 13, y4: 17},
                {x2: 5 * 7 * 9, y2: 7 * 9, y3: 1, x3: 9}
            ]);

            expect(warnings).toEqual([
                'ignored yaxis.scaleanchor: "x"',
                'ignored yaxis3.scaleanchor: "x2"'
            ]);
        });

        it('silently drops invalid scaleanchor values', function() {
            var warnings = [];
            spyOn(Lib, 'warn').and.callFake(function(msg) {
                warnings.push(msg.substr(0, msg.indexOf(' to avoid')));
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
            expect(warnings).toEqual(['ignored xaxis.scaleanchor: "x"']);

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
            // constrain is still coerced in case someone else scales to xaxis2
            expect(layoutOut.xaxis2.constrain).toBe('range');

            expect(layoutOut._axisConstraintGroups).toEqual([]);
            expect(layoutOut._axisMatchGroups).toEqual([{x: 1, x2: 1}]);
        });

        it('combines all chained scaled/matched axes into a group but drops match-only groups from constraintGroups', function() {
            layoutIn = {
                // this one big group
                xaxis: {},
                yaxis: {scaleanchor: 'x'},
                xaxis2: {matches: 'x'},
                yaxis2: {matches: 'y'},
                // this is another group but only shows up in matchGroups
                xaxis3: {},
                yaxis3: {matches: 'x3'}
            };
            layoutOut._subplots.cartesian.push('x2y2, x3y3');
            layoutOut._subplots.xaxis.push('x2', 'x3');
            layoutOut._subplots.yaxis.push('y2', 'y3');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups).toEqual([{x: 1, x2: 1}, {y: 1, y2: 1}, {x3: 1, y3: 1}]);

            expect(layoutOut._axisConstraintGroups).toEqual([{x: 1, y: 1, x2: 1, y2: 1}]);
        });

        it('includes matches in constraintGroup when combined with scaleanchor', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {matches: 'x'},
                xaxis2: {scaleanchor: 'x'}
            };
            layoutOut._subplots.cartesian.push('x2y');
            layoutOut._subplots.xaxis.push('x2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups).toEqual([{x: 1, y: 1}]);
            expect(layoutOut._axisConstraintGroups).toEqual([{x: 1, y: 'y1', x2: 1}]);
        });

        it('turns all scaled axes fixedrange if any is fixedrange', function() {
            // some of these will create warnings... not too important, so not going to test,
            // just want to keep the output clean
            // spyOn(Lib, 'warn');

            layoutIn = {
                xaxis: {fixedrange: true, scaleanchor: 'y', scaleratio: 2},
                yaxis: {scaleanchor: 'x2', scaleratio: 3},
                xaxis2: {},
                yaxis2: {scaleanchor: 'x', scaleratio: 5}
            };
            layoutOut._subplots.cartesian.push('x2y2');
            layoutOut._subplots.xaxis.push('x2');
            layoutOut._subplots.yaxis.push('y2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisConstraintGroups).toEqual([{x2: 1, y: 3, x: 6, y2: 30}]);

            expect(layoutOut.xaxis.scaleanchor).toBe('y');
            expect(layoutOut.xaxis.scaleratio).toBe(2);
            expect(layoutOut.yaxis.scaleanchor).toBe('x2');
            expect(layoutOut.yaxis.scaleratio).toBe(3);
            expect(layoutOut.yaxis2.scaleanchor).toBe('x');
            expect(layoutOut.yaxis2.scaleratio).toBe(5);

            ['xaxis', 'yaxis', 'yaxis2', 'xaxis2'].forEach(function(axName) {
                expect(layoutOut[axName].fixedrange).toBe(true, axName);
            });
        });

        it('turns all matching axes fixedrange if any is fixedrange', function() {
            layoutIn = {
                xaxis: {fixedrange: true, matches: 'y'},
                yaxis: {matches: 'x2'},
                xaxis2: {},
                yaxis2: {matches: 'x'}
            };
            layoutOut._subplots.cartesian.push('x2y2');
            layoutOut._subplots.xaxis.push('x2');
            layoutOut._subplots.yaxis.push('y2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups).toEqual([{x: 1, x2: 1, y: 1, y2: 1}]);
            expect(layoutOut.yaxis.matches).toBe('x2');

            ['xaxis', 'xaxis2', 'yaxis', 'yaxis2'].forEach(function(axName) {
                negateIf(axName !== 'xaxis2', expect(layoutOut[axName].matches)).toBeUndefined(axName);
                expect(layoutOut[axName].fixedrange).toBe(true, axName);
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

        it('should find matching group even when matching a *missing* axis', function() {
            layoutIn = {
                // N.B. xaxis isn't set
                xaxis2: {matches: 'x'},
                xaxis3: {matches: 'x'},
                xaxis4: {matches: 'x'},
                // N.B. yaxis isn't set
                yaxis2: {matches: 'y'},
                yaxis3: {matches: 'y2'},
                yaxis4: {matches: 'y3'},
            };
            layoutOut._subplots.cartesian = ['x2y2', 'x3y3', 'x4y4'];
            layoutOut._subplots.xaxis = ['x2', 'x3', 'x4'];
            layoutOut._subplots.yaxis = ['y2', 'y3', 'y4'];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups.length).toBe(2);
            expect(layoutOut._axisMatchGroups).toContain({x: 1, x2: 1, x3: 1, x4: 1});
            expect(layoutOut._axisMatchGroups).toContain({y: 1, y2: 1, y3: 1, y4: 1});

            // should coerce the 'missing' axes
            expect(layoutIn.xaxis).toBeDefined();
            expect(layoutIn.yaxis).toBeDefined();
            expect(layoutOut.xaxis).toBeDefined();
            expect(layoutOut.yaxis).toBeDefined();
        });

        it('should find matching group even when matching a *missing* axis (nested case)', function() {
            layoutIn = {
                // N.B. xaxis isn't set
                // N.B. xaxis2 is set, but does not correspond to a subplot
                xaxis2: {matches: 'x'},
                xaxis3: {matches: 'x2'},
                xaxis4: {matches: 'x3'},
                // N.B. yaxis isn't set
                // N.B yaxis2 does not correspond to a subplot and is useless here
                yaxis2: {matches: 'y'},
                yaxis3: {matches: 'y'},
                yaxis4: {matches: 'y3'}
            };
            layoutOut._subplots.cartesian = ['x3y3', 'x4y4'];
            layoutOut._subplots.xaxis = ['x3', 'x4'];
            layoutOut._subplots.yaxis = ['y3', 'y4'];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups.length).toBe(2);
            expect(layoutOut._axisMatchGroups).toContain({x: 1, x2: 1, x3: 1, x4: 1});
            expect(layoutOut._axisMatchGroups).toContain({y: 1, y3: 1, y4: 1});

            // should coerce the 'missing' axes
            expect(layoutIn.xaxis).toBeDefined();
            expect(layoutIn.yaxis).toBeDefined();
            expect(layoutOut.xaxis).toBeDefined();
            expect(layoutOut.yaxis).toBeDefined();

            // should coerce useless axes
            expect(layoutIn.yaxis2).toEqual({matches: 'y'});
            expect(layoutOut.yaxis2).toBeUndefined();
        });

        it('should match set axis range value for matching axes', function() {
            layoutIn = {
                // autorange case
                xaxis: {},
                xaxis2: {matches: 'x'},
                // matchee ax has range
                yaxis: {range: [0, 1]},
                yaxis2: {matches: 'y'},
                // first explicit range gets copied to both
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
                    expect(ax.range[0]).toBe(rng[0], n);
                    expect(ax.range[1]).toBe(rng[1], n);
                });
            }

            _assertMatchingAxes(['xaxis', 'xaxis2'], true, [-1, 6]);
            _assertMatchingAxes(['yaxis', 'yaxis2'], false, [0, 1]);
            _assertMatchingAxes(['xaxis3', 'yaxis3'], false, [-1, 1]);
            _assertMatchingAxes(['xaxis4', 'yaxis4'], false, [-1, 3]);
        });

        it('should match set axis range value for matching axes even when matching a *missing* axis', function() {
            layoutIn = {
                // N.B. xaxis is set, but does not correspond to a subplot
                xaxis: {range: [0, 1]},
                xaxis2: {matches: 'x'},
                xaxis4: {matches: 'x'}
            };
            layoutOut._subplots.cartesian = ['x2y2', 'x4y4'];
            layoutOut._subplots.xaxis = ['x2', 'x4'];
            layoutOut._subplots.yaxis = ['y2', 'y4'];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups.length).toBe(1);
            expect(layoutOut._axisMatchGroups).toContain({x: 1, x2: 1, x4: 1});

            expect(layoutOut.xaxis.range).withContext('xaxis.range').toEqual([0, 1]);
            expect(layoutOut.xaxis2.range).withContext('xaxis2.range').toEqual([0, 1]);
            expect(layoutOut.xaxis4.range).withContext('xaxis4.range').toEqual([0, 1]);
        });

        it('should match set axis range value for matching axes even when matching a *missing* axis (nested case)', function() {
            layoutIn = {
                // N.B. xaxis is set, but does not correspond to a subplot
                xaxis: {range: [0, 1]},
                // N.B. xaxis2 is set, but does not correspond to a subplot
                xaxis2: {matches: 'x'},
                xaxis3: {matches: 'x2'},
                xaxis4: {matches: 'x3'}
            };
            layoutOut._subplots.cartesian = ['x3y3', 'x4y4'];
            layoutOut._subplots.xaxis = ['x3', 'x4'];
            layoutOut._subplots.yaxis = ['y3', 'y4'];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups.length).toBe(1);
            expect(layoutOut._axisMatchGroups).toContain({x: 1, x2: 1, x3: 1, x4: 1});

            expect(layoutOut.xaxis.range).withContext('xaxis.range').toEqual([0, 1]);
            expect(layoutOut.xaxis2.range).withContext('xaxis2.range').toEqual([0, 1]);
            expect(layoutOut.xaxis2.range).withContext('xaxis3.range').toEqual([0, 1]);
            expect(layoutOut.xaxis4.range).withContext('xaxis4.range').toEqual([0, 1]);
        });

        it('should propagate axis type into *missing* axes', function() {
            layoutIn = {
                xaxis2: {type: 'date', matches: 'x'},
                yaxis: {type: 'category', matches: 'y2'}
            };
            layoutOut._subplots.cartesian = ['x2y'];
            layoutOut._subplots.xaxis = ['x2'];
            layoutOut._subplots.yaxis = ['y'];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut._axisMatchGroups.length).toBe(2);
            expect(layoutOut._axisMatchGroups).toContain({x: 1, x2: 1});
            expect(layoutOut._axisMatchGroups).toContain({y: 1, y2: 1});

            expect(layoutOut.xaxis.type).withContext('xaxis.type').toBe('date');
            expect(layoutOut.xaxis2.type).withContext('xaxis2.type').toBe('date');
            expect(layoutOut.yaxis.type).withContext('yaxis.type').toBe('category');
            expect(layoutOut.yaxis2.type).withContext('yaxis2.type').toBe('category');
        });

        it('should adapt default axis ranges to *rangemode*', function() {
            layoutIn = {
                xaxis: {rangemode: 'tozero'},
                yaxis: {rangemode: 'nonnegative'},
                xaxis2: {rangemode: 'nonnegative'},
                yaxis2: {rangemode: 'tozero'}
            };
            layoutOut._subplots.cartesian.push('x2y2');
            layoutOut._subplots.xaxis.push('x2');
            layoutOut._subplots.yaxis.push('y2');

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.range).withContext('xaxis range').toEqual([0, 6]);
            expect(layoutOut.xaxis2.range).withContext('xaxis2 range').toEqual([0, 6]);
            expect(layoutOut.yaxis.range).withContext('yaxis range').toEqual([0, 4]);
            expect(layoutOut.yaxis2.range).withContext('yaxis2 range').toEqual([0, 4]);
        });

        it('should coerce *rangebreaks* container only on a date axis', function() {
            var bounds = ['2020-01-10', '2020-01-11'];
            layoutIn = {
                xaxis: {rangebreaks: [{bounds: bounds}], type: 'date'},
                xaxis2: {rangebreaks: [{bounds: bounds}], type: '-'},
                xaxis3: {rangebreaks: [{bounds: bounds}], type: 'linear'},
                xaxis4: {rangebreaks: [{bounds: bounds}], type: 'log'},
                xaxis5: {rangebreaks: [{bounds: bounds}], type: 'category'},
                xaxis6: {rangebreaks: [{bounds: bounds}], type: 'multicategory'}
            };
            layoutOut._subplots.xaxis.push('x2', 'x3', 'x4', 'x5', 'x6');
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(Array.isArray(layoutOut.xaxis.rangebreaks) && layoutOut.xaxis.rangebreaks.length)
                .toBe(1, 'xaxis.rangebreaks is array of length 1');
            expect(layoutOut.xaxis2.rangebreaks).toBeUndefined();
            expect(layoutOut.xaxis3.rangebreaks).toBeUndefined();
            expect(layoutOut.xaxis4.rangebreaks).toBeUndefined();
            expect(layoutOut.xaxis5.rangebreaks).toBeUndefined();
            expect(layoutOut.xaxis6.rangebreaks).toBeUndefined();
        });

        it('should coerce *rangebreaks* container only when it is a non-empty array', function() {
            layoutIn = {
                xaxis: {type: 'date', rangebreaks: [{bounds: ['2020-01-10', '2020-01-11']}]},
                xaxis2: {type: 'date', rangebreaks: []},
                xaxis3: {type: 'date', rangebreaks: false},
                xaxis4: {type: 'date'}
            };
            layoutOut._subplots.xaxis.push('x2', 'x3', 'x4');
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(Array.isArray(layoutOut.xaxis.rangebreaks) && layoutOut.xaxis.rangebreaks.length)
                .toBe(1, 'xaxis.rangebreaks is array of length 1');
            expect(layoutOut.xaxis2.rangebreaks).toBeUndefined();
            expect(layoutOut.xaxis3.rangebreaks).toBeUndefined();
            expect(layoutOut.xaxis4.rangebreaks).toBeUndefined();
        });

        it('should set *rangebreaks* to *enabled:false* when *bounds* have less than 2 items', function() {
            layoutIn = {
                xaxis: {type: 'date', rangebreaks: [{bounds: ['2020-01-10']}]},
                xaxis2: {type: 'date', rangebreaks: [{bounds: ['2020-01-10'], values: ['2020-01-11']}]},
                xaxis3: {type: 'date', rangebreaks: [{bounds: ['2020-01-10'], values: {}}]},
                xaxis4: {type: 'date', rangebreaks: [{bounds: ['2020-01-10', '2020-01-11', '2020-01-12']}]}
            };
            layoutOut._subplots.xaxis.push('x2', 'x3', 'x4');
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.rangebreaks[0].enabled).toBe(false, 'invalid *bounds*');
            expect(layoutOut.xaxis2.rangebreaks[0].enabled).toBe(true, 'invalid *bounds*, valid *values*');
            expect(layoutOut.xaxis3.rangebreaks[0].enabled).toBe(false, 'invalid *bounds*, invalid *values*');
            expect(layoutOut.xaxis4.rangebreaks[0].enabled && layoutOut.xaxis4.rangebreaks[0].bounds)
                .withContext('valid *bounds*, sliced to length=2').toEqual(['2020-01-10', '2020-01-11']);
        });

        it('if *rangebreaks* *bounds* are bigger than the set *range*, disable rangebreak', function() {
            layoutIn = {
                xaxis: {type: 'date', range: ['2020-01-10', '2020-01-14'], rangebreaks: [{bounds: ['2020-01-11', '2020-01-12']}]},
                xaxis2: {type: 'date', range: ['2020-01-11', '2020-01-12'], rangebreaks: [{bounds: ['2020-01-10', '2020-01-14']}]},
                xaxis3: {type: 'date', range: ['2020-01-14', '2020-01-10'], rangebreaks: [{bounds: ['2020-01-12', '2020-01-11']}]},
                xaxis4: {type: 'date', range: ['2020-01-12', '2020-01-11'], rangebreaks: [{bounds: ['2020-01-14', '2020-01-10']}]}
            };
            layoutOut._subplots.xaxis.push('x2', 'x3', 'x4');
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.rangebreaks[0].enabled).toBe(true, '*bounds* within set range');
            expect(layoutOut.xaxis2.rangebreaks[0].enabled).toBe(false, '*bounds* bigger than set range');
            expect(layoutOut.xaxis3.rangebreaks[0].enabled).toBe(true, '*bounds* within set range (reversed)');
            expect(layoutOut.xaxis4.rangebreaks[0].enabled).toBe(false, '*bounds* bigger than set range (reversed)');
        });

        it('should coerce *rangebreaks* *bounds* over *values*/*dvalue* if both are present', function() {
            layoutIn = {
                xaxis: {type: 'date', rangebreaks: [{bounds: ['2020-01-10', '2020-01-11']}]},
                xaxis2: {type: 'date', rangebreaks: [{values: ['2020-01-10', '2020-01-12', '2020-01-14'], dvalue: 2}]},
                xaxis3: {type: 'date', rangebreaks: [{bounds: ['2020-01-10', '2020-01-11'], values: ['2020-01-10', '2020-01-12', '2020-01-14'], dvalue: 2}]},
                xaxis4: {type: 'date', rangebreaks: [{bounds: false, values: ['2020-01-10', '2020-01-12', '2020-01-14'], dvalue: 2}]},
            };
            layoutOut._subplots.xaxis.push('x2', 'x3', 'x4');
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            var xaBreak = layoutOut.xaxis.rangebreaks[0];
            expect(xaBreak.bounds).withContext('valid *bounds*').toEqual(['2020-01-10', '2020-01-11']);
            expect(xaBreak.values).toBe(undefined, 'not coerced');
            expect(xaBreak.dvalue).toBe(undefined, 'not coerced');

            xaBreak = layoutOut.xaxis2.rangebreaks[0];
            expect(xaBreak.bounds).toBe(undefined, 'not set, not coerced');
            expect(xaBreak.values).withContext('valid *values*').toEqual(['2020-01-10', '2020-01-12', '2020-01-14']);
            expect(xaBreak.dvalue).toBe(2, 'valid *dvalue*');

            xaBreak = layoutOut.xaxis3.rangebreaks[0];
            expect(xaBreak.bounds).withContext('set to valid, coerced').toEqual(['2020-01-10', '2020-01-11']);
            expect(xaBreak.values).toBe(undefined, 'not coerced');
            expect(xaBreak.dvalue).toBe(undefined, 'not coerced');

            xaBreak = layoutOut.xaxis4.rangebreaks[0];
            expect(xaBreak.bounds).toBe(undefined, 'set but invalid, not coerced');
            expect(xaBreak.values).withContext('valid *values*').toEqual(['2020-01-10', '2020-01-12', '2020-01-14']);
            expect(xaBreak.dvalue).toBe(2, 'valid *dvalue*');
        });

        it('should only coerce rangebreaks *pattern* with *bounds*', function() {
            layoutIn = {
                xaxis: {type: 'date', rangebreaks: [{bounds: ['2020-01-04', '2020-01-05']}]},
                xaxis2: {type: 'date', rangebreaks: [{bounds: [6, 1], pattern: 'day of week'}]},
                xaxis3: {type: 'date', rangebreaks: [{values: ['2020-01-04', '2020-01-05'], pattern: 'NOP'}]},
            };
            layoutOut._subplots.xaxis.push('x2', 'x3');
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.rangebreaks[0].pattern).toBe('', 'coerced to dflt value');
            expect(layoutOut.xaxis2.rangebreaks[0].pattern).toBe('day of week', 'coerced');
            expect(layoutOut.xaxis3.rangebreaks[0].pattern).toBe(undefined, 'not coerce, using *values*');
        });

        it('should auto default rangebreaks.pattern to *day of week* when *bounds* include a weekday string and convert bounds to integer days', function() {
            layoutIn = {
                xaxis: {type: 'date', rangebreaks: [
                    {bounds: ['Saturday', 'Monday']}
                ]},
                xaxis2: {type: 'date', rangebreaks: [
                    {bounds: ['sun', 'thu']},
                    {bounds: ['mon', 'fri']},
                    {bounds: ['tue', 'sat']},
                    {bounds: ['wed', '-1']}
                ]}
            };
            layoutOut._subplots.xaxis.push('x2');
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.rangebreaks[0].pattern).toBe('day of week', 'complete Capital');
            expect(layoutOut.xaxis2.rangebreaks[0].pattern).toBe('day of week', '3-letter case');
            expect(layoutOut.xaxis2.rangebreaks[0].bounds[0]).toBe(0, 'convert sun');
            expect(layoutOut.xaxis2.rangebreaks[1].bounds[0]).toBe(1, 'convert mon');
            expect(layoutOut.xaxis2.rangebreaks[2].bounds[0]).toBe(2, 'convert tue');
            expect(layoutOut.xaxis2.rangebreaks[3].bounds[0]).toBe(3, 'convert wed');
            expect(layoutOut.xaxis2.rangebreaks[0].bounds[1]).toBe(4, 'convert thu');
            expect(layoutOut.xaxis2.rangebreaks[1].bounds[1]).toBe(5, 'convert fri');
            expect(layoutOut.xaxis2.rangebreaks[2].bounds[1]).toBe(6, 'convert sat');
            expect(layoutOut.xaxis2.rangebreaks[3].bounds[1]).toBe('-1', 'string');
        });

        it('should validate inputs in respect to *day of week* pattern', function() {
            layoutIn = {
                xaxis: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: ['6', '0'] }]},
                xaxis2: {type: 'date', rangebreaks: [{bounds: ['Sunday'] }]},
                xaxis3: {type: 'date', rangebreaks: [{bounds: ['sun', 'mon', 'tue'] }]},
                xaxis4: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, '-1'] }]},
                xaxis5: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, '-.25'] }]},
                xaxis6: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, '7'] }]},
                xaxis7: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, '6.75'] }]},
                xaxis8: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, ''] }]},
                xaxis9: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, null] }]},
                xaxis10: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, false] }]},
                xaxis11: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, true] }]}
            };
            layoutOut._subplots.xaxis.push('x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8', 'x9', 'x10', 'x11');
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.rangebreaks[0].enabled).toBe(true, 'valid');
            expect(layoutOut.xaxis.rangebreaks[0].bounds[0]).toBe(6, 'cast float to int');
            expect(layoutOut.xaxis.rangebreaks[0].bounds[1]).toBe(0, 'cast string to int');
            expect(layoutOut.xaxis2.rangebreaks[0].enabled).toBe(false, 'reject bounds.length < 2');
            expect(layoutOut.xaxis3.rangebreaks[0].enabled).toBe(true, 'do not reject bounds.length > 2');
            expect(layoutOut.xaxis3.rangebreaks[0].bounds.length).toBe(2, 'pick first two');
            expect(layoutOut.xaxis4.rangebreaks[0].enabled).toBe(false, 'reject bound < 0');
            expect(layoutOut.xaxis5.rangebreaks[0].enabled).toBe(false, 'reject bound < 0');
            expect(layoutOut.xaxis6.rangebreaks[0].enabled).toBe(false, 'reject bound >= 7');
            expect(layoutOut.xaxis7.rangebreaks[0].enabled).toBe(false, 'reject bound < 7 - not supported yet');
            expect(layoutOut.xaxis8.rangebreaks[0].enabled).toBe(false, 'reject blank string');
            expect(layoutOut.xaxis9.rangebreaks[0].enabled).toBe(false, 'reject null');
            expect(layoutOut.xaxis10.rangebreaks[0].enabled).toBe(false, 'reject false');
            expect(layoutOut.xaxis11.rangebreaks[0].enabled).toBe(false, 'reject true');
        });

        it('should validate inputs in respect to *hour* pattern', function() {
            layoutIn = {
                xaxis: {type: 'date', rangebreaks: [{pattern: 'hour', bounds: ['24', '1e-3'] }]},
                xaxis2: {type: 'date', rangebreaks: [{pattern: 'hour', bounds: [1] }]},
                xaxis3: {type: 'date', rangebreaks: [{pattern: 'hour', bounds: [1, 2, 3] }]},
                xaxis4: {type: 'date', rangebreaks: [{pattern: 'hour', bounds: [1, '-1'] }]},
                xaxis5: {type: 'date', rangebreaks: [{pattern: 'hour', bounds: [1, '-.001'] }]},
                xaxis6: {type: 'date', rangebreaks: [{pattern: 'hour', bounds: [1, '24.001'] }]},
                xaxis7: {type: 'date', rangebreaks: [{pattern: 'hour', bounds: [1, '23.999'] }]},
                xaxis8: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, ''] }]},
                xaxis9: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, null] }]},
                xaxis10: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, false] }]},
                xaxis11: {type: 'date', rangebreaks: [{pattern: 'day of week', bounds: [1, true] }]}
            };
            layoutOut._subplots.xaxis.push('x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8', 'x9', 'x10', 'x11');
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);

            expect(layoutOut.xaxis.rangebreaks[0].enabled).toBe(true, 'valid');
            expect(layoutOut.xaxis.rangebreaks[0].bounds[0]).toBe(24, 'accept 24');
            expect(layoutOut.xaxis.rangebreaks[0].bounds[1]).toBe(0.001, 'cast string to float');
            expect(layoutOut.xaxis2.rangebreaks[0].enabled).toBe(false, 'reject bounds.length < 2');
            expect(layoutOut.xaxis3.rangebreaks[0].enabled).toBe(true, 'do not reject bounds.length > 2');
            expect(layoutOut.xaxis3.rangebreaks[0].bounds.length).toBe(2, 'pick first two');
            expect(layoutOut.xaxis4.rangebreaks[0].enabled).toBe(false, 'reject bound < 0');
            expect(layoutOut.xaxis5.rangebreaks[0].enabled).toBe(false, 'reject bound < 0');
            expect(layoutOut.xaxis6.rangebreaks[0].enabled).toBe(false, 'reject bound > 24');
            expect(layoutOut.xaxis7.rangebreaks[0].enabled).toBe(true, 'do not reject bound <= 24');
            expect(layoutOut.xaxis8.rangebreaks[0].enabled).toBe(false, 'reject blank string');
            expect(layoutOut.xaxis9.rangebreaks[0].enabled).toBe(false, 'reject null');
            expect(layoutOut.xaxis10.rangebreaks[0].enabled).toBe(false, 'reject false');
            expect(layoutOut.xaxis11.rangebreaks[0].enabled).toBe(false, 'reject true');
        });

        it('should coerce autoshift and shift only if anchor is *free*', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {anchor: 'free'}
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.yaxis.autoshift).toBe(false);
            expect(layoutOut.yaxis.shift).toEqual(0);

            layoutIn.yaxis.autoshift = true;
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.yaxis.autoshift).toBe(true);
            expect(layoutOut.yaxis.shift).toEqual(-3);

            layoutIn.yaxis.anchor = 'x';
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.yaxis.autoshift).toBeUndefined();
            expect(layoutOut.yaxis.shift).toBeUndefined();
        });

        it('should set automargin to *true* when shift is *true*', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {autoshift: true, anchor: 'free'}
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.yaxis.automargin).toBe(true);
        });

        it('should set automargin to *false* when shift is numeric', function() {
            layoutIn = {
                xaxis: {},
                yaxis: {shift: 100, anchor: 'free'}
            };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.yaxis.automargin).toBe(false);
        });

        it('should set default axis position if shift is *true* according to overlaying domain', function() {
            layoutIn = {
                xaxis: {domain: [0.2, 0.5]},
                yaxis: {},
                yaxis2: {autoshift: true, anchor: 'free', overlaying: 'y'}
            };

            layoutOut._subplots.cartesian.push('xy2');
            layoutOut._subplots.yaxis.push('y2');
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.yaxis2.position).toBe(0.2);

            layoutIn.yaxis2.side = 'right';
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.yaxis2.position).toBe(0.5);

            // Same should apply if shift is numeric
            layoutIn.yaxis2.shift = 100;
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.yaxis2.position).toBe(0.5);
        });
    });

    describe('autorange relayout', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('can relayout autorange', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [0, 1],
                    y: [0, 1]
                }],
                layout: {
                    width: 400,
                    height: 400,
                    margin: {
                        t: 40,
                        b: 40,
                        l: 40,
                        r: 40
                    },
                    xaxis: {
                        autorange: false,
                    },
                    yaxis: {
                        autorange: true,
                    }
                }
            }).then(function() {
                expect(gd._fullLayout.xaxis.range).toEqual([-1, 6]);
                expect(gd._fullLayout.yaxis.range).toBeCloseToArray([-0.07, 1.07]);

                return Plotly.relayout(gd, 'yaxis.autorange', false);
            }).then(function() {
                expect(gd._fullLayout.yaxis.autorange).toBe(false);
                expect(gd._fullLayout.yaxis.range).toBeCloseToArray([-0.07, 1.07]);

                return Plotly.relayout(gd, 'xaxis.autorange', true);
            }).then(function() {
                expect(gd._fullLayout.xaxis.autorange).toBe(true);
                expect(gd._fullLayout.xaxis.range).toBeCloseToArray([-0.07, 1.07]);
            })
            .then(done, done.fail);
        });

        it('can relayout one partial range without affecting other subplots', function(done) {
            var rangeX2;
            var rangeX3;
            var rangeX4;
            var autorangeX2;
            var autorangeX3;
            var autorangeX4;

            Plotly.newPlot(gd, {
                data: [
                    {
                        xaxis: 'x',
                        yaxis: 'y',
                        y: [1000, 10, 100, 1],
                    },
                    {
                        xaxis: 'x2',
                        yaxis: 'y2',
                        y: [1000, 10, 100, 1],
                    },
                    {
                        xaxis: 'x3',
                        yaxis: 'y3',
                        y: [1000, 10, 100, 1],
                    },
                    {
                        xaxis: 'x4',
                        yaxis: 'y4',
                        y: [1000, 10, 100, 1],
                    },
                ],
                layout: {
                    xaxis: {
                        range: [-1, null],
                        anchor: 'y',
                        domain: [0, 0.45],
                    },
                    yaxis: {
                        anchor: 'x',
                        domain: [0, 0.45],
                        side: 'right',
                    },
                    xaxis2: {
                        range: [null, 4],
                        anchor: 'y2',
                        domain: [0, 0.45],
                    },
                    yaxis2: {
                        anchor: 'x2',
                        domain: [0.55, 1],
                        side: 'left',
                    },
                    xaxis3: {
                        range: [null, -1],
                        autorange: 'max reversed',
                        anchor: 'y3',
                        domain: [0.55, 1],
                    },
                    yaxis3: {
                        anchor: 'x3',
                        domain: [0, 0.45],
                        side: 'left',
                    },
                    xaxis4: {
                        range: [4, null],
                        autorange: 'min reversed',
                        anchor: 'y4',
                        domain: [0.55, 1],
                    },
                    yaxis4: {
                        anchor: 'x4',
                        domain: [0.55, 1],
                        side: 'right',
                    }
                }
            }).then(function() {
                rangeX2 = gd._fullLayout.xaxis2.range.slice();
                rangeX3 = gd._fullLayout.xaxis3.range.slice();
                rangeX4 = gd._fullLayout.xaxis4.range.slice();

                autorangeX2 = gd._fullLayout.xaxis2.autorange;
                autorangeX3 = gd._fullLayout.xaxis3.autorange;
                autorangeX4 = gd._fullLayout.xaxis4.autorange;

                return Plotly.relayout(gd, 'xaxis.range', [1, 2]);
            }).then(function() {
                expect(gd._fullLayout.xaxis2.range).toEqual(rangeX2);
                expect(gd._fullLayout.xaxis3.range).toEqual(rangeX3);
                expect(gd._fullLayout.xaxis4.range).toEqual(rangeX4);

                expect(gd._fullLayout.xaxis2.autorange).toEqual(autorangeX2);
                expect(gd._fullLayout.xaxis3.autorange).toEqual(autorangeX3);
                expect(gd._fullLayout.xaxis4.autorange).toEqual(autorangeX4);
            })
            .then(done, done.fail);
        });

        it('should make room for the inside labels of the counter axes', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [1, 2, 3],
                    y: [0, 100, 0]
                }],
                layout: {
                    width: 300,
                    height: 300,
                    showlegend: false,
                    plot_bgcolor: 'lightblue',
                    yaxis: { ticklabelposition: 'inside' },
                    xaxis: { range: [1.5, 2.5] }
                }
            }).then(function() {
                expect(gd._fullLayout.xaxis.range).toEqual([1.5, 2.5]);

                return Plotly.relayout(gd, 'xaxis.autorange', true);
            }).then(function() {

                expect(gd._fullLayout.xaxis.range).toBeCloseToArray([0.37, 3.22], 1);
            })
            .then(done, done.fail);
        });
    });

    describe('insiderange relayout', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('can relayout insiderange', function(done) {
            Plotly.newPlot(gd, [{
                y: [1, 3, 2, 4]}
            ], {
                xaxis: {insiderange: [0, 2]},
                yaxis: {ticklabelposition: 'inside'},
                plot_bgcolor: 'lightgray',
                width: 600,
                height: 600
            }).then(function() {
                expect(gd._fullLayout.xaxis.range).toBeCloseToArray([-0.110, 2]);

                return Plotly.relayout(gd, {
                    'xaxis.insiderange': [1, 3]
                });
            }).then(function() {
                expect(gd._fullLayout.xaxis.range).toBeCloseToArray([0.889, 3]);
            }).then(done, done.fail);
        });
    });

    describe('constraints relayout', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('updates ranges when adding, removing, or changing a constraint', function(done) {
            Plotly.newPlot(gd,
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
            .then(done, done.fail);
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

        it('can change axis domain on call to react when template is present', function(done) {
            Plotly.newPlot(gd,
                [{z: [[0, 1], [2, 3]], type: 'heatmap'}],
                { template: {}, xaxis: { domain: [0,1], scaleanchor: 'y' } }
            )
            .then(function() {
                return Plotly.react(gd, 
                    [{z: [[0, 1], [2, 3]], type: 'heatmap'}],
                    { template: {}, xaxis: { domain: [0.1, 0.9] } }
                );
            })
            .then(function() {
                assertRangeDomain('xaxis', [-0.5,1.5], [0.1, 0.9], [0.1, 0.9]);
            })
            .then(done, done.fail);
        });

        it('can change per-axis constrain:domain/range and constraintoward', function(done) {
            Plotly.newPlot(gd,
                // start with a heatmap as it has no padding so calculations are easy
                [{z: [[0, 1], [2, 3]], type: 'heatmap'}],
                // plot area is 200x100 px
                {
                    width: 400,
                    height: 300,
                    margin: {l: 100, r: 100, t: 100, b: 100},
                    xaxis: {constrain: 'domain'},
                    yaxis: {constraintoward: 'top', scaleanchor: 'x'}
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
            .then(done, done.fail);
        });

        it('autoranges consistently with padding', function(done) {
            var xAutoPad = 0.09523809523809526;
            var xAutorange = [-xAutoPad, 1 + xAutoPad];
            var yAutoPad = 0.15476190476190477;
            var yAutorange = [-yAutoPad, 1 + yAutoPad];
            Plotly.newPlot(gd, [
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
            .then(done, done.fail);
        });

        it('can constrain date axes', function(done) {
            Plotly.newPlot(gd, [{
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
            .then(done, done.fail);
        });

        it('can constrain category axes', function(done) {
            Plotly.newPlot(gd, [{
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
            .then(done, done.fail);
        });

        it('can constrain log axes', function(done) {
            Plotly.newPlot(gd, [{
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
            .then(done, done.fail);
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

            Plotly.newPlot(gd, fig1())
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
            .then(done, done.fail);
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
            Plotly.newPlot(gd, [
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
                    [['xaxis', 'xaxis2', 'xaxis3'], [-0.285, 3.245], true],
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
                    [['xaxis', 'xaxis2', 'xaxis3'], [-0.285, 3.245], true],
                    [['yaxis'], [-0.211, 3.211], true]
                ]);
            })
            .then(done, done.fail);
        });
    });

    describe('categoryorder', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        describe('setting, or not setting categoryorder if it is not explicitly declared', function() {
            it('should set categoryorder to default if categoryorder and categoryarray are not supplied', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {xaxis: {type: 'category'}})
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                    expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
                })
                .then(done, done.fail);
            });

            it('should set categoryorder to default even if type is not set to category explicitly', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}])
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                    expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
                })
                .then(done, done.fail);
            });

            it('should NOT set categoryorder to default if type is not category', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}])
                .then(function() {
                    expect(gd._fullLayout.yaxis.categoryorder).toBe(undefined);
                    expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
                })
                .then(done, done.fail);
            });

            it('should set categoryorder to default if type is overridden to be category', function(done) {
                Plotly.newPlot(gd, [{x: [1, 2, 3, 4, 5], y: [15, 11, 12, 13, 14]}], {yaxis: {type: 'category'}})
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe(undefined);
                    expect(gd._fullLayout.yaxis.categorarray).toBe(undefined);
                    expect(gd._fullLayout.yaxis.categoryorder).toBe('trace');
                    expect(gd._fullLayout.yaxis.categorarray).toBe(undefined);
                })
                .then(done, done.fail);
            });
        });

        describe('setting categoryorder to "array"', function() {
            it('should leave categoryorder on "array" if it is supplied', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'array', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('array');
                    expect(gd._fullLayout.xaxis.categoryarray).toEqual(['b', 'a', 'd', 'e', 'c']);
                })
                .then(done, done.fail);
            });

            it('should switch categoryorder on "array" if it is not supplied but categoryarray is supplied', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('array');
                    expect(gd._fullLayout.xaxis.categoryarray).toEqual(['b', 'a', 'd', 'e', 'c']);
                })
                .then(done, done.fail);
            });

            it('should revert categoryorder to "trace" if "array" is supplied but there is no list', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'array'}
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                    expect(gd._fullLayout.xaxis.categorarray).toBe(undefined);
                })
                .then(done, done.fail);
            });
        });

        describe('do not set categoryorder to "array" if list exists but empty', function() {
            it('should switch categoryorder to default if list is not supplied', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'array', categoryarray: []}
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                    expect(gd._fullLayout.xaxis.categoryarray).toEqual([]);
                })
                .then(done, done.fail);
            });

            it('should not switch categoryorder on "array" if categoryarray is supplied but empty', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryarray: []}
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                    expect(gd._fullLayout.xaxis.categoryarray).toEqual(undefined);
                })
                .then(done, done.fail);
            });
        });

        describe('do NOT set categoryorder to "array" if it has some other proper value', function() {
            it('should use specified categoryorder if it is supplied even if categoryarray exists', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'trace', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                    expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
                })
                .then(done, done.fail);
            });

            it('should use specified categoryorder if it is supplied even if categoryarray exists', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'category ascending', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('category ascending');
                    expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
                })
                .then(done, done.fail);
            });

            it('should use specified categoryorder if it is supplied even if categoryarray exists', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'category descending', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('category descending');
                    expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
                })
                .then(done, done.fail);
            });
        });

        describe('setting categoryorder to the default if the value is unexpected', function() {
            it('should switch categoryorder to "trace" if mode is supplied but invalid', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'invalid value'}
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('trace');
                    expect(gd._fullLayout.xaxis.categoryarray).toBe(undefined);
                })
                .then(done, done.fail);
            });

            it('should switch categoryorder to "array" if mode is supplied but invalid and list is supplied', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], {
                    xaxis: {type: 'category', categoryorder: 'invalid value', categoryarray: ['b', 'a', 'd', 'e', 'c']}
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis.categoryorder).toBe('array');
                    expect(gd._fullLayout.xaxis.categoryarray).toEqual(['b', 'a', 'd', 'e', 'c']);
                })
                .then(done, done.fail);
            });
        });
    });

    describe('bar category autorange', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        describe('a category has the same value of one of the auto range computed extreme', function() {
            it('should compute the right range for X axis', function(done) {
                Plotly.newPlot(gd, [{x: ['0', '-0.5', '3.5', 'Not Known'], y: [ '1.0', '1.0', '2.0', '1.0'], type: 'bar'}], {
                    xaxis: {type: 'category', autorange: true}
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis._rl).toEqual([-0.5, 3.5]);
                })
                .then(done, done.fail);
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

        it('should set defaults on bad inputs', function(done) {
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

            Plotly.newPlot(gd, data, layout)
            .then(function() {
                var yaxis = gd._fullLayout.yaxis;
                expect(yaxis.ticklen).toBe(5);
                expect(yaxis.tickwidth).toBe(1);
                expect(yaxis.tickcolor).toBe('#444');
                expect(yaxis.ticks).toBe('outside');
                expect(yaxis.showticklabels).toBe(true);
                expect(yaxis.tickfont).toEqual({
                    family: '"Open Sans", verdana, arial, sans-serif',
                    size: 12,
                    color: '#444',
                    weight: 'normal',
                    style: 'normal',
                    variant: 'normal',
                    textcase: 'normal',
                    lineposition: 'none',
                    shadow: 'none',
                });
                expect(yaxis.tickangle).toBe('auto');
            })
            .then(done, done.fail);
        });

        it('should use valid inputs', function(done) {
            var layout = {
                yaxis: {
                    ticklen: 10,
                    tickwidth: 5,
                    tickcolor: '#F00',
                    showticklabels: true,
                    tickfont: {
                        family: 'Garamond',
                        size: 72,
                        color: '#0FF',
                        weight: 'normal',
                        style: 'normal',
                        variant: 'normal',
                        textcase: 'normal',
                        lineposition: 'none',
                        shadow: 'none',
                    },
                    tickangle: -20
                }
            };

            Plotly.newPlot(gd, data, layout)
            .then(function() {
                var yaxis = gd._fullLayout.yaxis;
                expect(yaxis.ticklen).toBe(10);
                expect(yaxis.tickwidth).toBe(5);
                expect(yaxis.tickcolor).toBe('#F00');
                expect(yaxis.ticks).toBe('outside');
                expect(yaxis.showticklabels).toBe(true);
                expect(yaxis.tickfont).toEqual({
                    family: 'Garamond',
                    size: 72,
                    color: '#0FF',
                    weight: 'normal',
                    style: 'normal',
                    variant: 'normal',
                    textcase: 'normal',
                    lineposition: 'none',
                    shadow: 'none',
                });
                expect(yaxis.tickangle).toBe(-20);
            })
            .then(done, done.fail);
        });

        it('should conditionally coerce based on showticklabels', function(done) {
            var layout = {
                yaxis: {
                    showticklabels: false,
                    tickangle: -90
                }
            };

            Plotly.newPlot(gd, data, layout)
            .then(function() {
                var yaxis = gd._fullLayout.yaxis;
                expect(yaxis.tickangle).toBeUndefined();
            })
            .then(done, done.fail);
        });
    });

    describe('handleTickValueDefaults', function() {
        var viaTemplate;

        function mockSupplyDefaults(axIn, axOut, axType) {
            if(viaTemplate) {
                axOut._template = axIn;
                axIn = {};
            }

            function coerce(attr, dflt) {
                return Lib.coerce(axIn, axOut, Cartesian.layoutAttributes, attr, dflt);
            }

            handleTickValueDefaults(axIn, axOut, coerce, axType);
        }

        [
            '(without template) ',
            '(with template) '
        ].forEach(function(woTemplate, index) {
            viaTemplate = index === 1;

            it(woTemplate + 'should set default tickmode correctly', function() {
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

                axIn = {tickvals: [1, 2, 3]};
                axOut = {};
                mockSupplyDefaults(axIn, axOut, 'date');
                expect(axOut.tickmode).toBe('array');
                expect(axIn.tickmode).toBeUndefined();

                axIn = {tickmode: 'array', tickvals: [1, 2, 3]};
                axOut = {};
                mockSupplyDefaults(axIn, axOut, 'date');
                expect(axOut.tickmode).toBe('array');
                expect(axIn.tickmode).toBe('array');

                axIn = {tickvals: [1, 2, 3]};
                axOut = {};
                mockSupplyDefaults(axIn, axOut, 'linear');
                expect(axOut.tickmode).toBe('array');
                expect(axIn.tickmode).toBeUndefined();

                var arr = new Float32Array(2);
                arr[0] = 0;
                arr[1] = 1;
                axIn = {tickvals: arr};
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

            it(woTemplate + 'should set nticks if tickmode=auto', function() {
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

            it(woTemplate + 'should set tick0 and dtick if tickmode=linear', function() {
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

            it(woTemplate + 'should handle tick0 and dtick for date axes', function() {
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

            it(woTemplate + 'should handle tick0 and dtick for log axes', function() {
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

            it(woTemplate + 'should set tickvals and ticktext if tickmode=array', function() {
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

            it(woTemplate + 'should not coerce ticktext/tickvals on multicategory axes', function() {
                var axIn = {tickvals: [1, 2, 3], ticktext: ['4', '5', '6']};
                var axOut = {};
                mockSupplyDefaults(axIn, axOut, 'multicategory');
                expect(axOut.tickvals).toBe(undefined);
                expect(axOut.ticktext).toBe(undefined);
            });
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

        it('should save range when autosize turned off and rangeInitials are not defined', function() {
            ['xaxis', 'yaxis', 'xaxis2', 'yaxis2'].forEach(function(ax) {
                gd._fullLayout[ax].autorange = false;
            });

            hasOneAxisChanged = saveRangeInitial(gd);

            expect(hasOneAxisChanged).toBe(true);
            expect(gd._fullLayout.xaxis._rangeInitial0).toEqual(0);
            expect(gd._fullLayout.xaxis._rangeInitial1).toEqual(0.5);

            expect(gd._fullLayout.yaxis._rangeInitial0).toEqual(0);
            expect(gd._fullLayout.yaxis._rangeInitial1).toEqual(0.5);

            expect(gd._fullLayout.xaxis2._rangeInitial0).toEqual(0.5);
            expect(gd._fullLayout.xaxis2._rangeInitial1).toEqual(1);

            expect(gd._fullLayout.yaxis2._rangeInitial0).toEqual(0.5);
            expect(gd._fullLayout.yaxis2._rangeInitial1).toEqual(1);
        });

        it('should not overwrite saved range if rangeInitials are defined', function() {
            ['xaxis', 'yaxis', 'xaxis2', 'yaxis2'].forEach(function(ax) {
                gd._fullLayout[ax]._rangeInitial0 = gd._fullLayout[ax].range[0];
                gd._fullLayout[ax]._rangeInitial1 = gd._fullLayout[ax].range[1];
                gd._fullLayout[ax].range = [0, 1];
            });

            hasOneAxisChanged = saveRangeInitial(gd);

            expect(hasOneAxisChanged).toBe(false);

            expect(gd._fullLayout.xaxis._rangeInitial0).toEqual(0);
            expect(gd._fullLayout.xaxis._rangeInitial1).toEqual(0.5);

            expect(gd._fullLayout.yaxis._rangeInitial0).toEqual(0);
            expect(gd._fullLayout.yaxis._rangeInitial1).toEqual(0.5);

            expect(gd._fullLayout.xaxis2._rangeInitial0).toEqual(0.5);
            expect(gd._fullLayout.xaxis2._rangeInitial1).toEqual(1);

            expect(gd._fullLayout.yaxis2._rangeInitial0).toEqual(0.5);
            expect(gd._fullLayout.yaxis2._rangeInitial1).toEqual(1);
        });

        it('should save range when overwrite option is on and range has changed', function() {
            ['xaxis', 'yaxis', 'xaxis2', 'yaxis2'].forEach(function(ax) {
                gd._fullLayout[ax]._rangeInitial0 = gd._fullLayout[ax].range[0];
                gd._fullLayout[ax]._rangeInitial1 = gd._fullLayout[ax].range[1];
            });
            gd._fullLayout.xaxis2.range = [0.2, 0.4];

            hasOneAxisChanged = saveRangeInitial(gd, true);
            expect(hasOneAxisChanged).toBe(true);

            expect(gd._fullLayout.xaxis._rangeInitial0).toEqual(0);
            expect(gd._fullLayout.xaxis._rangeInitial1).toEqual(0.5);

            expect(gd._fullLayout.yaxis._rangeInitial0).toEqual(0);
            expect(gd._fullLayout.yaxis._rangeInitial1).toEqual(0.5);

            expect(gd._fullLayout.xaxis2._rangeInitial0).toEqual(0.2);
            expect(gd._fullLayout.xaxis2._rangeInitial1).toEqual(0.4);

            expect(gd._fullLayout.yaxis2._rangeInitial0).toEqual(0.5);
            expect(gd._fullLayout.yaxis2._rangeInitial1).toEqual(1);
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

        it('Does not use SI prefixes for 10^n with |n| < minexponent', function() {
            var textOut = mockCalc({
                type: 'log',
                tickmode: 'linear',
                exponentformat: 'SI',
                minexponent: 5,
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
                '1μ', '0.00001', '0.0001', '0.001', '0.01', '0.1', '1', '10', '100',
                '1000', '10,000', '100,000', '1M', '10M', '100M', '1G', '10G', '100G',
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
                minexponent: 0,
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
                '1μ', '10μ', '100μ', '1m', '10m', '100m', '1', '10', '100',
                '1k', '10k', '100k', '1M', '10M', '100M', '1G', '10G', '100G',
                '1T', '10T', '100T',
                '10<sup>15</sup>',
                '10<sup>16</sup>',
                '10<sup>17</sup>',
                '10<sup>18</sup>'
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
                _categoriesMap: {a: 0, b: 1, c: 2, d: 3},
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
                _categoriesMap: {a: 0, b: 1, c: 2, d: 3},
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
                expect(ax._categories).toEqual(['3', '1', '2']);
            });

            it('- on a date axis', function() {
                var dates = [[2000, 0, 1], [2001, 0, 1], [2002, 0, 1]]
                    .map(function(d) { return new Date(d[0], d[1], d[2]).getTime(); });

                // We could make this work down the road (in v3),
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
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should grow and shrink margins', function(done) {
            var initialSize;
            var previousSize;

            function assertSize(msg, actual, exp) {
                for(var k in exp) {
                    var parts = exp[k].split('|');
                    var op = parts[0];

                    var method = {
                        '=': 'toBeCloseTo',
                        '~=': 'toBeWithin',
                        grew: 'toBeGreaterThan',
                        shrunk: 'toBeLessThan',
                        initial: 'toBeCloseTo'
                    }[op];

                    var val = op === 'initial' ? initialSize[k] : previousSize[k];
                    var msgk = msg + ' ' + k + (parts[1] ? ' |' + parts[1] : '');
                    var args = [val];
                    if(op === '~=') {
                        args.push(1.1);
                    } else if(method === 'toBeCloseTo') {
                        args.push(3);
                    }
                    args.push(msgk);

                    expect(actual[k])[method](args[0], args[1], args[2]);
                }
            }

            function check(msg, relayoutObj, exp) {
                return function() {
                    return Plotly.relayout(gd, relayoutObj).then(function() {
                        var gs = Lib.extendDeep({}, gd._fullLayout._size);
                        assertSize(msg, gs, exp);
                        previousSize = gs;
                    });
                };
            }

            Plotly.newPlot(gd, [{
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
            }], {
                margin: {l: 0, r: 0, b: 0, t: 0},
                width: 600, height: 600
            })
            .then(function() {
                expect(gd._fullLayout.xaxis._tickAngles.xtick).toBeCloseTo(30, 3);

                var gs = gd._fullLayout._size;
                initialSize = Lib.extendDeep({}, gs);
                previousSize = Lib.extendDeep({}, gs);
            })
            .then(check('automargin y', {'yaxis.automargin': true}, {
                t: '=', l: 'grew',
                b: '=', r: '='
            }))
            .then(check('automargin x', {'xaxis.automargin': true}, {
                t: '=', l: '=',
                b: 'grew', r: 'grew'
            }))
            .then(check('move all x label off-screen', {'xaxis.range': [-10, -5]}, {
                t: '=', l: '=',
                b: 'initial', r: 'initial'
            }))
            .then(check('move all y label off-screen', {'yaxis.range': [-10, -5]}, {
                t: '=', l: 'initial',
                b: '=', r: '='
            }))
            .then(check('back to label for auto ranges', {'xaxis.autorange': true, 'yaxis.autorange': true}, {
                t: '=', l: 'grew',
                b: 'grew', r: 'grew'
            }))
            .then(check('tilt x label to 45 degrees', {'xaxis.tickangle': 45}, {
                t: '=', l: '=',
                b: 'grew', r: 'shrunk'
            }))
            .then(check('tilt x labels back to 30 degrees', {'xaxis.tickangle': 30}, {
                t: '=', l: '=',
                b: 'shrunk', r: 'grew'
            }))
            .then(check('bump y-axis tick length', {'yaxis.ticklen': 30}, {
                t: '=', l: 'grew',
                b: '=', r: 'grew| as x ticks got shifted right'
            }))
            .then(check('add y-axis title', {'yaxis.title.text': 'hello'}, {
                t: '=', l: 'grew',
                b: '=', r: 'grew| as x ticks got shifted right'
            }))
            .then(check('size up y-axis title', {'yaxis.title.font.size': 30}, {
                t: '=', l: 'grew',
                b: '=', r: 'grew| as x ticks got shifted right'
            }))
            .then(check('tilt y labels up 30 degrees', {'yaxis.tickangle': 30}, {
                t: 'grew', l: 'shrunk',
                b: '=', r: 'shrunk| as x ticks got shifted left'
            }))
            .then(check('un-tilt y labels', {'yaxis.tickangle': null}, {
                t: 'shrunk', l: 'grew',
                b: '=', r: 'grew'
            }))
            .then(check('unanchor y-axis', {'yaxis.anchor': 'free'}, {
                t: '=', l: '~=',
                b: '=', r: '='
            }))
            .then(check('offset y-axis to the left', {'yaxis.position': 0.1}, {
                t: '=', l: 'shrunk| as y-axis shifted right',
                b: '=', r: 'shrunk| as y-axis shifted right'
            }))
            .then(check('re-anchor y-axis', {'yaxis.anchor': 'x'}, {
                t: '=', l: 'grew',
                b: '=', r: 'grew'
            }))
            .then(check('flip axis side', {'yaxis.side': 'right', 'xaxis.side': 'top'}, {
                t: 'grew', l: 'shrunk',
                b: 'shrunk', r: 'grew'
            }))
            .then(check('tilt x labels vertically', {'xaxis.tickangle': 90}, {
                t: 'grew', l: 'shrunk',
                b: '=', r: '='
            }))
            .then(check('tilt y labels down 30 degrees', {'yaxis.tickangle': 30}, {
                t: '=', l: '=',
                b: 'grew', r: 'shrunk'
            }))
            .then(check('turn off automargin', {'xaxis.automargin': false, 'yaxis.automargin': false}, {
                t: 'initial', l: 'initial',
                b: 'initial', r: 'initial'
            }))
            .then(done, done.fail);
        });

        it('should not lead to negative plot area heights', function(done) {
            function _assert(msg, exp) {
                var gs = gd._fullLayout._size;
                expect(gs.h).toBeGreaterThan(0, msg + '- positive height');
                expect(gs.b).toBeGreaterThan(exp.bottomLowerBound, msg + ' - margin bottom');
                expect(gs.b + gs.h + gs.t).toBeWithin(exp.totalHeight, 1.5, msg + ' - total height');
            }

            Plotly.newPlot(gd, [{
                x: ['loooooong label 1', 'loooooong label 2'],
                y: [1, 2]
            }], {
                xaxis: {automargin: true, tickangle: 90},
                width: 500,
                height: 500
            })
            .then(function() {
                _assert('base', {
                    bottomLowerBound: 80,
                    totalHeight: 500
                });
            })
            .then(function() { return Plotly.relayout(gd, 'height', 100); })
            .then(function() {
                _assert('after relayout to *small* height', {
                    bottomLowerBound: 15,
                    totalHeight: 100
                });
            })
            .then(function() { return Plotly.relayout(gd, 'height', 800); })
            .then(function() {
                _assert('after relayout to *big* height', {
                    bottomLowerBound: 80,
                    totalHeight: 800
                });
            })
            .then(done, done.fail);
        });

        it('should not lead to negative plot area widths', function(done) {
            function _assert(msg, exp) {
                var gs = gd._fullLayout._size;
                expect(gs.w).toBeGreaterThan(0, msg + '- positive width');
                expect(gs.l).toBeGreaterThan(exp.leftLowerBound, msg + ' - margin left');
                expect(gs.l + gs.w + gs.r).toBeWithin(exp.totalWidth, 1.5, msg + ' - total width');
            }

            Plotly.newPlot(gd, [{
                y: ['loooooong label 1', 'loooooong label 2'],
                x: [1, 2]
            }], {
                yaxis: {automargin: true},
                width: 500,
                height: 500
            })
            .then(function() {
                _assert('base', {
                    leftLowerBound: 80,
                    totalWidth: 500
                });
            })
            .then(function() { return Plotly.relayout(gd, 'width', 100); })
            .then(function() {
                _assert('after relayout to *small* width', {
                    leftLowerBound: 15,
                    totalWidth: 100
                });
            })
            .then(function() { return Plotly.relayout(gd, 'width', 1000); })
            .then(function() {
                _assert('after relayout to *big* width', {
                    leftLowerBound: 80,
                    totalWidth: 1000
                });
            })
            .then(done, done.fail);
        });

        it('should handle partial automargin', function(done) {
            var initialSize;

            function assertSize(msg, actual, exp) {
                for(var k in exp) {
                    var parts = exp[k].split('|');
                    var op = parts[0];

                    var method = {
                        '=': 'toBeCloseTo',
                        '~=': 'toBeWithin',
                        grew: 'toBeGreaterThan',
                        shrunk: 'toBeLessThan',
                        initial: 'toBeCloseTo'
                    }[op];

                    var val = initialSize[k];
                    var msgk = msg + ' ' + k + (parts[1] ? ' |' + parts[1] : '');
                    var args = [val];
                    if(op === '~=') {
                        args.push(1.1);
                    } else if(method === 'toBeCloseTo') {
                        args.push(3);
                    }
                    args.push(msgk);

                    expect(actual[k])[method](args[0], args[1], args[2]);
                }
            }

            function check(msg, relayoutObj, exp) {
                return function() {
                    return Plotly.relayout(gd, relayoutObj).then(function() {
                        var gs = Lib.extendDeep({}, gd._fullLayout._size);
                        assertSize(msg, gs, exp);
                    });
                };
            }

            Plotly.newPlot(gd, [{
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
            }], {
                margin: {l: 0, r: 0, b: 0, t: 0},
                width: 600, height: 600
            })
            .then(function() {
                expect(gd._fullLayout.xaxis._tickAngles.xtick).toBeCloseTo(30, 3);

                var gs = gd._fullLayout._size;
                initialSize = Lib.extendDeep({}, gs);
            })
            .then(check('automargin y', {'yaxis.automargin': true, 'yaxis.tickangle': 30, 'yaxis.ticklen': 30}, {
                t: 'grew', l: 'grew',
                b: '=', r: '='
            }))
            .then(check('automargin not left', {'yaxis.automargin': 'right+height'}, {
                t: 'grew', l: '=',
                b: '=', r: '='
            }))
            .then(check('automargin keep left height', {'yaxis.automargin': 'left+height'}, {
                t: 'grew', l: 'grew',
                b: '=', r: '='
            }))
            .then(check('automargin keep bottom right', {'yaxis.automargin': 'bottom+right'}, {
                t: '=', l: '=',
                b: '=', r: '='
            }))
            .then(check('automargin keep height', {'yaxis.automargin': 'height'}, {
                t: 'grew', l: '=',
                b: '=', r: '='
            }))
            .then(check('automargin keep top', {'yaxis.automargin': 'top'}, {
                t: 'grew', l: '=',
                b: '=', r: '='
            }))
            .then(check('automargin not top', {'yaxis.automargin': 'bottom+width'}, {
                t: '=', l: 'grew',
                b: '=', r: '='
            }))
            .then(check('automargin keep left', {'yaxis.automargin': 'left'}, {
                t: '=', l: 'grew',
                b: '=', r: '='
            }))
            .then(check('automargin keep width', {'yaxis.automargin': 'width'}, {
                t: '=', l: 'grew',
                b: '=', r: '='
            }))
            .then(check('automargin x', {'xaxis.automargin': true, 'yaxis.automargin': false}, {
                t: '=', l: '=',
                b: 'grew', r: 'grew'
            }))
            .then(check('automargin not bottom', {'xaxis.automargin': 'top+width'}, {
                t: '=', l: '=',
                b: '=', r: 'grew'
            }))
            .then(check('automargin keep right', {'xaxis.automargin': 'right'}, {
                t: '=', l: '=',
                b: '=', r: 'grew'
            }))
            .then(check('automargin keep bottom', {'xaxis.automargin': 'bottom'}, {
                t: '=', l: '=',
                b: 'grew', r: '='
            }))
            .then(check('automargin keep top right', {'xaxis.automargin': 'top+right'}, {
                t: '=', l: '=',
                b: '=', r: 'grew'
            }))
            .then(check('automargin keep top left', {'xaxis.automargin': 'top+left'}, {
                t: '=', l: '=',
                b: '=', r: '='
            }))
            .then(check('automargin keep bottom left', {'xaxis.automargin': 'bottom+left'}, {
                t: '=', l: '=',
                b: 'grew', r: '='
            }))
            .then(check('turn off automargin', {'xaxis.automargin': false, 'yaxis.automargin': false}, {
                t: '=', l: '=',
                b: '=', r: '='
            }))
            .then(done, done.fail);
        });

        it('should handle cases with free+mirror axes', function(done) {
            Plotly.newPlot(gd, [{
                y: [1, 2, 1]
            }], {
                xaxis: {
                    ticks: 'outside',
                    mirror: 'ticks',
                    anchor: 'free',
                    automargin: true
                },
                yaxis: {
                    showline: true,
                    linewidth: 2,
                    mirror: 'all',
                    anchor: 'free',
                    automargin: true
                }
            })
            .then(function() {
                // N.B. no '.automargin.mirror'
                expect(Object.keys(gd._fullLayout._pushmargin))
                    .toEqual(['x.automargin', 'y.automargin', 'base']);
            })
            .then(done, done.fail);
        });
        it('should respect axis title placement on relayout', function(done) {
            function getPos(gd, sel) {
                return d3Select(gd).select(sel).node().getBoundingClientRect();
            }

            // Tick position is < title position since 0 is at the top of the graph,
            // rather than at the bottom. We're checking that the ticks and title don't overlap
            function assertLayout() {
                var titleTop = getPos(gd, '.xtitle').top;
                var tickBottom = getPos(gd, '.xtick').bottom;
                expect(tickBottom).toBeLessThan(titleTop + 2); // allow two pixels tolerance
            }

            var fig = require('../../image/mocks/automargin-zoom.json');
            Plotly.newPlot(gd, fig)

            .then(assertLayout)
            .then(function() {
                return Plotly.relayout(gd, {'xaxis.range': [6, 14]});
            })
            .then(function() {
                assertLayout();
            })
            .then(done, done.fail);
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
            d3Select(gd).selectAll('.zl').each(function() {
                var cls = d3Select(this).attr('class');
                var clsMatch = cls.match(/[xy]\d*(?=zl)/g)[0];
                zlIDs.push(clsMatch);
            });
            zlIDs.sort();
            expect(zlIDs).toEqual(sortedIDs);
        }

        it('works with a single subplot', function(done) {
            Plotly.newPlot(gd, [{x: [1, 2, 3], y: [1, 2, 3]}], {
                xaxis: {range: [0, 4], zeroline: true, showline: true},
                yaxis: {range: [0, 4], zeroline: true, showline: true},
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
                return Plotly.relayout(gd, {
                    'xaxis.showline': false, 'xaxis.nticks': 1, 'xaxis.range': [0, 0.1],
                    'yaxis.showline': false, 'yaxis.nticks': 2, 'yaxis.range': [0, 0.1]
                });
            })
            .then(function() {
                // no grid lines, but still should show zeroline in this case
                // see https://github.com/plotly/plotly.js/issues/4027
                expect(gd._fullLayout.xaxis._gridVals.length).toBe(0, '# of grid lines');
                expect(gd._fullLayout.xaxis._gridVals.length).toBe(0, '# of grid lines');
                assertZeroLines(['x', 'y']);
            })
            .then(done, done.fail);
        });

        it('works with multiple coupled subplots', function(done) {
            Plotly.newPlot(gd, [
                {x: [1, 2, 3], y: [1, 2, 3]},
                {x: [1, 2, 3], y: [1, 2, 3], xaxis: 'x2'},
                {x: [1, 2, 3], y: [1, 2, 3], yaxis: 'y2'}
            ], {
                xaxis: {range: [0, 4], zeroline: true, domain: [0, 0.4]},
                yaxis: {range: [0, 4], zeroline: true, domain: [0, 0.4]},
                xaxis2: {range: [0, 4], zeroline: true, domain: [0.6, 1]},
                yaxis2: {range: [0, 4], zeroline: true, domain: [0.6, 1]},
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
            .then(done, done.fail);
        });

        it('works with multiple overlaid subplots', function(done) {
            Plotly.newPlot(gd, [
                {x: [1, 2, 3], y: [1, 2, 3]},
                {x: [1, 2, 3], y: [1, 2, 3], xaxis: 'x2', yaxis: 'y2'}
            ], {
                xaxis: {range: [0, 4], zeroline: true},
                yaxis: {range: [0, 4], zeroline: true},
                xaxis2: {range: [0, 4], zeroline: true, side: 'top', overlaying: 'x'},
                yaxis2: {range: [0, 4], zeroline: true, side: 'right', overlaying: 'y'},
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
            .then(done, done.fail);
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
                d3SelectAll(query).each(function() {
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

            Plotly.newPlot(gd, [{
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
            .then(done, done.fail);
        });

        it('should rotate labels to avoid overlaps', function(done) {
            function _assert(msg, exp) {
                var tickLabels = d3SelectAll('.xtick > text');

                expect(tickLabels.size()).withContext(msg + ' - # of tick labels').toBe(exp.angle.length);

                tickLabels.each(function(_, i) {
                    var t = d3Select(this).attr('transform');
                    var rotate = (t.split('rotate(')[1] || '').split(')')[0];
                    var angle = rotate.split(',')[0];
                    expect(Number(angle)).withContext(msg + ' - node ' + i).toBeCloseTo(exp.angle[i], 2);
                });
            }

            Plotly.newPlot(gd, [{
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
                    angle: [30, 30, 30]
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
                    angle: [30, 30]
                });
            })
            .then(done, done.fail);
        });
    });

    describe('*rangebreaks*', function() {
        describe('during doCalcdata', function() {
            var gd;

            function _calc(trace, layout) {
                gd = {data: [trace], layout: layout};
                supplyDefaults(gd);
                Plots.doCalcdata(gd);
            }

            function _assert(msg, exp) {
                var cd = gd.calcdata[0];
                var xc = cd.map(function(cdi) { return cdi.x; });
                expect(xc).withContext(msg).toEqual(exp);
            }

            it('should discard coords within break bounds', function() {
                var x = [
                    '1970-01-01 00:00:00.000',
                    '1970-01-01 00:00:00.010',
                    '1970-01-01 00:00:00.050',
                    '1970-01-01 00:00:00.090',
                    '1970-01-01 00:00:00.100',
                    '1970-01-01 00:00:00.150',
                    '1970-01-01 00:00:00.190',
                    '1970-01-01 00:00:00.200'
                ];

                _calc({
                    x: x
                }, {
                    xaxis: {
                        rangebreaks: [
                            {bounds: [
                                '1970-01-01 00:00:00.010',
                                '1970-01-01 00:00:00.090'
                            ]},
                            {bounds: [
                                '1970-01-01 00:00:00.100',
                                '1970-01-01 00:00:00.190'
                            ]}
                        ]
                    }
                });
                _assert('', [0, BADNUM, BADNUM, 90, BADNUM, BADNUM, 190, 200]);
            });

            it('should discard coords within break bounds - date day of week case', function() {
                var x = [
                    // Thursday
                    '2020-01-02 08:00', '2020-01-02 16:00',
                    // Friday
                    '2020-01-03 08:00', '2020-01-03 16:00',
                    // Saturday
                    '2020-01-04 08:00', '2020-01-04 16:00',
                    // Sunday
                    '2020-01-05 08:00', '2020-01-05 16:00',
                    // Monday
                    '2020-01-06 08:00', '2020-01-06 16:00',
                    // Tuesday
                    '2020-01-07 08:00', '2020-01-07 16:00'
                ];

                var noWeekend = [
                    1577952000000, 1577980800000,
                    1578038400000, 1578067200000,
                    BADNUM, BADNUM,
                    BADNUM, BADNUM,
                    1578297600000, 1578326400000,
                    1578384000000, 1578412800000
                ];

                _calc({x: x}, {
                    xaxis: {
                        rangebreaks: [
                            {pattern: 'day of week', bounds: [6, 1]}
                        ]
                    }
                });
                _assert('[6,1]', noWeekend);
            });

            it('should discard coords within break bounds - date hour case', function() {
                _calc({
                    x: [
                        '2020-01-02 08:00', '2020-01-02 20:00',
                        '2020-01-03 08:00', '2020-01-03 20:00',
                        '2020-01-04 08:00', '2020-01-04 20:00',
                        '2020-01-05 08:00', '2020-01-05 20:00',
                        '2020-01-06 08:00', '2020-01-06 20:00',
                        '2020-01-07 08:00', '2020-01-07 20:00'
                    ]
                }, {
                    xaxis: {
                        rangebreaks: [
                            {pattern: 'hour', bounds: [17, 8]}
                        ]
                    }
                });
                _assert('', [
                    1577952000000, BADNUM,
                    1578038400000, BADNUM,
                    1578124800000, BADNUM,
                    1578211200000, BADNUM,
                    1578297600000, BADNUM,
                    1578384000000, BADNUM
                ]);
            });

            it('should discard coords within break bounds - date hour / high precision case', function() {
                _calc({
                    x: [
                        '2020-01-03 16:45',
                        '2020-01-03 17:00',
                        '2020-01-03 17:15',
                        '2020-01-03 17:30',
                        '2020-01-06 7:45',
                        '2020-01-06 8:00',
                        '2020-01-06 8:15',
                        '2020-01-06 8:30'
                    ]
                }, {
                    xaxis: {
                        rangebreaks: [
                            {pattern: 'hour', bounds: [17, 8]}
                        ]
                    }
                });
                _assert('', [
                    Lib.dateTime2ms('2020-01-03 16:45'),
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    Lib.dateTime2ms('2020-01-06 8:00'),
                    Lib.dateTime2ms('2020-01-06 8:15'),
                    Lib.dateTime2ms('2020-01-06 8:30')
                ]);
            });

            it('should discard coords within break bounds - date hour case of [23, 1]', function() {
                _calc({
                    x: [
                        '2020-01-01 22',
                        '2020-01-01 23',
                        '2020-01-01 23:30',
                        '2020-01-01 23:59',
                        '2020-01-01 23:59:30',
                        '2020-01-01 23:59:59',
                        '2020-01-02 00:00:00',
                        '2020-01-02 00:00:01',
                        '2020-01-02 00:00:30',
                        '2020-01-02 00:30',
                        '2020-01-02 01',
                        '2020-01-02 02'
                    ]
                }, {
                    xaxis: {
                        rangebreaks: [
                            {pattern: 'hour', bounds: [23, 1]}
                        ]
                    }
                });
                _assert('', [
                    Lib.dateTime2ms('2020-01-01 22'),
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    Lib.dateTime2ms('2020-01-02 01'),
                    Lib.dateTime2ms('2020-01-02 02')
                ]);
            });

            it('should discard coords within break bounds - date hour case of [23, 0]', function() {
                _calc({
                    x: [
                        '2020-01-01 22',
                        '2020-01-01 23',
                        '2020-01-01 23:30',
                        '2020-01-01 23:59',
                        '2020-01-01 23:59:30',
                        '2020-01-01 23:59:59',
                        '2020-01-02 00:00:00',
                        '2020-01-02 00:00:01',
                        '2020-01-02 00:00:30',
                        '2020-01-02 00:30',
                        '2020-01-02 01',
                        '2020-01-02 02'
                    ]
                }, {
                    xaxis: {
                        rangebreaks: [
                            {pattern: 'hour', bounds: [23, 0]}
                        ]
                    }
                });
                _assert('', [
                    Lib.dateTime2ms('2020-01-01 22'),
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    Lib.dateTime2ms('2020-01-02 00:00:00'),
                    Lib.dateTime2ms('2020-01-02 00:00:01'),
                    Lib.dateTime2ms('2020-01-02 00:00:30'),
                    Lib.dateTime2ms('2020-01-02 00:30'),
                    Lib.dateTime2ms('2020-01-02 01'),
                    Lib.dateTime2ms('2020-01-02 02')
                ]);
            });

            it('should discard coords within break bounds - date hour case of [23, 24]', function() {
                _calc({
                    x: [
                        '2020-01-01 22',
                        '2020-01-01 23',
                        '2020-01-01 23:30',
                        '2020-01-01 23:59',
                        '2020-01-01 23:59:30',
                        '2020-01-01 23:59:59',
                        '2020-01-02 00:00:00',
                        '2020-01-02 00:00:01',
                        '2020-01-02 00:00:30',
                        '2020-01-02 00:30',
                        '2020-01-02 01',
                        '2020-01-02 02'
                    ]
                }, {
                    xaxis: {
                        rangebreaks: [
                            {pattern: 'hour', bounds: [23, 24]}
                        ]
                    }
                });
                _assert('', [
                    Lib.dateTime2ms('2020-01-01 22'),
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    Lib.dateTime2ms('2020-01-02 00:00:00'),
                    Lib.dateTime2ms('2020-01-02 00:00:01'),
                    Lib.dateTime2ms('2020-01-02 00:00:30'),
                    Lib.dateTime2ms('2020-01-02 00:30'),
                    Lib.dateTime2ms('2020-01-02 01'),
                    Lib.dateTime2ms('2020-01-02 02')
                ]);
            });

            it('should discard coords within break bounds - date hour case of [23.75, 0.25]', function() {
                _calc({
                    x: [
                        '2020-01-01 22',
                        '2020-01-01 23',
                        '2020-01-01 23:30',
                        '2020-01-01 23:59',
                        '2020-01-01 23:59:30',
                        '2020-01-01 23:59:59',
                        '2020-01-02 00:00:00',
                        '2020-01-02 00:00:01',
                        '2020-01-02 00:00:30',
                        '2020-01-02 00:30',
                        '2020-01-02 01',
                        '2020-01-02 02'
                    ]
                }, {
                    xaxis: {
                        rangebreaks: [
                            {pattern: 'hour', bounds: [23.75, 0.25]}
                        ]
                    }
                });
                _assert('', [
                    Lib.dateTime2ms('2020-01-01 22'),
                    Lib.dateTime2ms('2020-01-01 23'),
                    Lib.dateTime2ms('2020-01-01 23:30'),
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    BADNUM,
                    Lib.dateTime2ms('2020-01-02 00:30'),
                    Lib.dateTime2ms('2020-01-02 01'),
                    Lib.dateTime2ms('2020-01-02 02')
                ]);
            });

            it('should discard coords within [values[i], values[i] + dvalue] bounds', function() {
                var x = [
                    // Thursday
                    '2020-01-02 08:00', '2020-01-02 16:00',
                    // Friday
                    '2020-01-03 08:00', '2020-01-03 16:00',
                    // Saturday
                    '2020-01-04 08:00', '2020-01-04 16:00',
                    // Sunday
                    '2020-01-05 08:00', '2020-01-05 16:00',
                    // Monday
                    '2020-01-06 08:00', '2020-01-06 16:00',
                    // Tuesday
                    '2020-01-07 08:00', '2020-01-07 16:00'
                ];

                _calc({x: x}, {
                    xaxis: {
                        rangebreaks: [{values: ['2020-01-04', '2020-01-05'], dvalue: ONEDAY}],
                    }
                });
                _assert('two values', [
                    1577952000000, 1577980800000,
                    1578038400000, 1578067200000,
                    BADNUM, BADNUM,
                    BADNUM, BADNUM,
                    1578297600000, 1578326400000,
                    1578384000000, 1578412800000
                ]);
            });

            it('should discard coords equal to two consecutive open values bounds', function() {
                _calc({
                    x: [
                        '1970-01-01 00:00:00.001',
                        '1970-01-01 00:00:00.002',
                        '1970-01-01 00:00:00.003',
                        '1970-01-01 00:00:00.004',
                        '1970-01-01 00:00:00.005'
                    ]
                }, {
                    xaxis: {
                        rangebreaks: [{ values: [
                            '1970-01-01 00:00:00.002',
                            '1970-01-01 00:00:00.003'
                        ], dvalue: 1 }]
                    }
                });
                _assert('', [1, BADNUM, BADNUM, 4, 5]);
            });

            it('should adapt coords generated from x0/dx about rangebreaks', function() {
                _calc({
                    x0: '1970-01-01 00:00:00.001',
                    dx: 0.5,
                    y: [1, 3, 5, 2, 4]
                }, {
                    xaxis: {
                        rangebreaks: [
                            {bounds: [
                                '1970-01-01 00:00:00.002',
                                '1970-01-01 00:00:00.003'
                            ]}
                        ]
                    }
                });
                _assert('generated x=2.5 gets masked', [1, 1.5, BADNUM, BADNUM, 3]);
            });
        });

        describe('during doAutorange', function() {
            var gd;

            beforeEach(function() {
                gd = createGraphDiv();
            });

            afterEach(destroyGraphDiv);

            function _assert(msg, exp) {
                expect(gd._fullLayout.xaxis.range).toEqual(exp.xrng, msg + '| x range');
                expect(gd._fullLayout.xaxis._lBreaks).toBe(exp.lBreaks, msg + '| lBreaks');
            }

            it('should adapt padding about axis rangebreaks length', function(done) {
                Plotly.newPlot(gd, [{
                    mode: 'markers',
                    x: [
                        '1970-01-01 00:00:00.000',
                        '1970-01-01 00:00:00.010',
                        '1970-01-01 00:00:00.050',
                        '1970-01-01 00:00:00.090',
                        '1970-01-01 00:00:00.100',
                        '1970-01-01 00:00:00.150',
                        '1970-01-01 00:00:00.190',
                        '1970-01-01 00:00:00.200'
                    ]
                }], {
                    xaxis: {
                        rangebreaks: [
                            {bounds: [
                                '1970-01-01 00:00:00.011',
                                '1970-01-01 00:00:00.089'
                            ]},
                            {bounds: [
                                '1970-01-01 00:00:00.101',
                                '1970-01-01 00:00:00.189'
                            ]}
                        ]
                    }
                })
                .then(function() {
                    _assert('mode:markers (i.e. with padding)', {
                        xrng: ['1969-12-31 23:59:59.9978', '1970-01-01 00:00:00.2022'],
                        lBreaks: 166
                    });
                })
                .then(function() {
                    gd.data[0].mode = 'lines';
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('mode:lines (i.e. no padding)', {
                        xrng: ['1970-01-01', '1970-01-01 00:00:00.2'],
                        lBreaks: 166
                    });
                })
                .then(function() {
                    gd.data[0].mode = 'markers';
                    gd.layout.xaxis.rangebreaks[0].enabled = false;
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('mode:markers | one of two rangebreaks enabled', {
                        xrng: ['1969-12-31 23:59:59.9928', '1970-01-01 00:00:00.2072'],
                        lBreaks: 88
                    });
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks[1].enabled = false;
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('mode:markers | no rangebreaks enabled', {
                        xrng: ['1969-12-31 23:59:59.9871', '1970-01-01 00:00:00.2129'],
                        lBreaks: 0
                    });
                })
                .then(done, done.fail);
            });
        });

        describe('during setConvert (once range is available)', function() {
            var gd;

            beforeEach(function() {
                gd = createGraphDiv();
            });

            afterEach(destroyGraphDiv);

            function _assert(msg, axLetter, exp) {
                var fullLayout = gd._fullLayout;
                var ax = fullLayout[axLetter + 'axis'];

                if(exp) {
                    expect(ax._rangebreaks.length)
                        .toBe(exp.rangebreaks.length, msg + '| correct # of rangebreaks');
                    expect(ax._rangebreaks.map(function(brk) { return [brk.min, brk.max]; }))
                        .toBeCloseTo2DArray(exp.rangebreaks, 2, msg + '| rangebreaks [min,max]');

                    expect(ax._m2).toBe(exp.m2, msg + '| l2p slope');
                    expect(ax._B).toBeCloseToArray(exp.B, 2, msg + '| l2p piecewise offsets');
                } else {
                    expect(ax._rangebreaks).withContext(msg).toEqual([]);
                    expect(ax._m2).toBe(0, msg);
                    expect(ax._B).withContext(msg).toEqual([]);
                }
            }

            it('should locate rangebreaks & compute l <-> p parameters - x-axis case', function(done) {
                Plotly.newPlot(gd, [{
                    x: [
                        '1970-01-01 00:00:00.000',
                        '1970-01-01 00:00:00.010',
                        '1970-01-01 00:00:00.050',
                        '1970-01-01 00:00:00.090',
                        '1970-01-01 00:00:00.100',
                        '1970-01-01 00:00:00.150',
                        '1970-01-01 00:00:00.190',
                        '1970-01-01 00:00:00.200'
                    ]
                }], {
                    xaxis: {}
                })
                .then(function() {
                    _assert('no set rangebreaks', 'x', null);
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {bounds: [
                            '1970-01-01 00:00:00.011',
                            '1970-01-01 00:00:00.089'
                        ]},
                        {bounds: [
                            '1970-01-01 00:00:00.101',
                            '1970-01-01 00:00:00.189'
                        ]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('2 disjoint rangebreaks within range', 'x', {
                        rangebreaks: [[11, 89], [101, 189]],
                        m2: 14.062499999998405,
                        B: [30.937, -1065.937, -2303.437]
                    });
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {bounds: [
                            '1970-01-01 00:00:00.011',
                            '1970-01-01 00:00:00.089'
                        ]},
                        {bounds: [
                            '1970-01-01 00:00:00.070',
                            '1970-01-01 00:00:00.189'
                        ]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('2 overlapping rangebreaks within range', 'x', {
                        rangebreaks: [[11, 189]],
                        m2: 21.7741935483922,
                        B: [30.483, -3845.322]
                    });
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {bounds: [
                            '1969-12-31 23:59:59.990',
                            '1970-01-01 00:00:00.089'
                        ]},
                        {bounds: [
                            '1970-01-01 00:00:00.101',
                            '1970-01-01 00:00:00.189'
                        ]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('break beyond xaxis.range[0]', 'x', {
                        rangebreaks: [[88.6, 89], [101, 189]],
                        m2: 22.1311475409836,
                        B: [-1960.819, -1969.672, -3917.213]
                    });
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {bounds: [
                            '1970-01-01 00:00:00.011',
                            '1970-01-01 00:00:00.089'
                        ]},
                        {bounds: [
                            '1970-01-01 00:00:00.101',
                            '1970-01-01 00:00:00.300'
                        ]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('break beyond xaxis.range[1]', 'x', {
                        rangebreaks: [[11, 89], [101, 101.4]],
                        m2: 22.131147540988888,
                        B: [30.983, -1695.245, -1704.098]
                    });
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {bounds: [
                            '1969-12-31 23:59:59.989',
                            '1970-01-01 00:00:00.090'
                        ]},
                        {bounds: [
                            '1970-01-01 00:00:00.101',
                            '1970-01-01 00:00:00.300'
                        ]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('both rangebreaks beyond xaxis.range', 'x', {
                        rangebreaks: [[89.4, 90]],
                        m2: 50.943396226415125,
                        B: [-4554.339622641512, -4584.9056603773615]
                    });
                })
                .then(done, done.fail);
            });

            it('should locate rangebreaks & compute l <-> p parameters - y-axis case', function(done) {
                Plotly.newPlot(gd, [{
                    y: [
                        '1970-01-01 00:00:00.000',
                        '1970-01-01 00:00:00.010',
                        '1970-01-01 00:00:00.050',
                        '1970-01-01 00:00:00.090',
                        '1970-01-01 00:00:00.100',
                        '1970-01-01 00:00:00.150',
                        '1970-01-01 00:00:00.190',
                        '1970-01-01 00:00:00.200'
                    ]
                }], {
                    yaxis: {}
                })
                .then(function() {
                    _assert('no set rangebreaks', 'y', null);
                })
                .then(function() {
                    gd.layout.yaxis.rangebreaks = [
                        {bounds: [
                            '1970-01-01 00:00:00.011',
                            '1970-01-01 00:00:00.089'
                        ]},
                        {bounds: [
                            '1970-01-01 00:00:00.101',
                            '1970-01-01 00:00:00.189'
                        ]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('2 disjoint rangebreaks within range', 'y', {
                        rangebreaks: [[101, 189], [11, 89]],
                        m2: -6.923076923076923,
                        B: [1401.923, 792.692, 252.692]
                    });
                })
                .then(function() {
                    gd.layout.yaxis.rangebreaks = [
                        {bounds: [
                            '1970-01-01 00:00:00.011',
                            '1970-01-01 00:00:00.089'
                        ]},
                        {bounds: [
                            '1970-01-01 00:00:00.070',
                            '1970-01-01 00:00:00.189'
                        ]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('2 overlapping rangebreaks within range', 'y', {
                        rangebreaks: [[11, 189]],
                        m2: -10.714285714283243,
                        B: [2160, 252.857]
                    });
                })
                .then(done, done.fail);
            });

            it('should locate rangebreaks & compute l <-> p parameters - date axis case', function(done) {
                Plotly.newPlot(gd, [{
                    x: [
                        // Thursday
                        '2020-01-02 08:00', '2020-01-02 17:00',
                        // Friday
                        '2020-01-03 08:00', '2020-01-03 17:00',
                        // Saturday
                        '2020-01-04 08:00', '2020-01-04 17:00',
                        // Sunday
                        '2020-01-05 08:00', '2020-01-05 17:00',
                        // Monday
                        '2020-01-06 08:00', '2020-01-06 17:00',
                        // Tuesday
                        '2020-01-07 08:00', '2020-01-07 17:00'
                    ]
                }], {
                    xaxis: {}
                })
                .then(function() {
                    _assert('no set rangebreaks', 'x', null);
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {pattern: 'day of week', bounds: [6, 1]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('break over the weekend days', 'x', {
                        rangebreaks: [
                            ['2020-01-04', '2020-01-06'].map(Lib.dateTime2ms)
                        ],
                        m2: 0.000001640946501588664,
                        B: [-2589304.064, -2589587.619]
                    });
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {pattern: 'day of week', bounds: [5, 6]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('skip Friday', 'x', {
                        rangebreaks: [
                            ['2020-01-03', '2020-01-04'].map(Lib.dateTime2ms)
                        ],
                        m2: 0.0000012658730158736563,
                        B: [-1997456.107, -1997565.478]
                    });
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {pattern: 'day of week', bounds: [5, 5]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('bad input -> implied empty rangebreaks', 'x', null);
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {pattern: 'hour', bounds: [17, 8]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('breaks outside workday hours', 'x', {
                        rangebreaks: [
                            ['2020-01-02 17:00:00', '2020-01-03 08:00:00'].map(Lib.dateTime2ms),
                            ['2020-01-03 17:00:00', '2020-01-04 08:00:00'].map(Lib.dateTime2ms),
                            ['2020-01-04 17:00:00', '2020-01-05 08:00:00'].map(Lib.dateTime2ms),
                            ['2020-01-05 17:00:00', '2020-01-06 08:00:00'].map(Lib.dateTime2ms),
                            ['2020-01-06 17:00:00', '2020-01-07 08:00:00'].map(Lib.dateTime2ms)
                        ],
                        m2: 0.0000029537037039351,
                        B: [
                            -4660771.917031818, -4660931.41703183,
                            -4661090.917031842, -4661250.417031854,
                            -4661409.9170318665, -4661569.417031879
                        ]
                    });
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {pattern: 'day of week', bounds: [6, 1]},
                        {pattern: 'hour', bounds: [17, 8]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('breaks outside workday hours & weekends', 'x', {
                        rangebreaks: [
                            ['2020-01-02 17:00:00', '2020-01-03 08:00:00'].map(Lib.dateTime2ms),
                            ['2020-01-03 17:00:00', '2020-01-06 08:00:00'].map(Lib.dateTime2ms),
                            ['2020-01-06 17:00:00', '2020-01-07 08:00:00'].map(Lib.dateTime2ms)
                        ],
                        m2: 0.000004922839504765992,
                        B: [
                            -7767973.692224438, -7768239.525557696,
                            -7769356.025557376, -7769621.858890634
                        ]
                    });
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {pattern: 'hour', bounds: [17, 8]},
                        {pattern: 'day of week', bounds: [6, 1]}
                    ];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('breaks outside workday hours & weekends (reversed break order)', 'x', {
                        rangebreaks: [
                            ['2020-01-02 17:00:00', '2020-01-03 08:00:00'].map(Lib.dateTime2ms),
                            ['2020-01-03 17:00:00', '2020-01-06 08:00:00'].map(Lib.dateTime2ms),
                            ['2020-01-06 17:00:00', '2020-01-07 08:00:00'].map(Lib.dateTime2ms)
                        ],
                        m2: 0.000004922839504765992,
                        B: [
                            -7767973.692224438, -7768239.525557696,
                            -7769356.025557376, -7769621.858890634
                        ]
                    });
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {pattern: 'hour', bounds: [17, 8]}
                    ];
                    // N.B. xaxis.range[0] falls within a break
                    gd.layout.xaxis.autorange = false;
                    gd.layout.xaxis.range = ['2020-01-01 20:00:00', '2020-01-04 20:00:00'];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('when range[0] falls within a break pattern (hour case)', 'x', {
                        rangebreaks: [
                            [1577908800000, Lib.dateTime2ms('2020-01-02 08:00:00')],
                            ['2020-01-02 17:00:00', '2020-01-03 08:00:00'].map(Lib.dateTime2ms),
                            ['2020-01-03 17:00:00', '2020-01-04 08:00:00'].map(Lib.dateTime2ms),
                            ['2020-01-04 17:00:00', '2020-01-04 20:00:00'].map(Lib.dateTime2ms)
                        ],
                        m2: 0.000005555555555555556,
                        B: [-8766160, -8766400, -8766700, -8767000, -8767060]
                    });
                })
                .then(function() {
                    gd.layout.xaxis.rangebreaks = [
                        {pattern: 'day of week', bounds: [2, 4]}
                    ];
                    // N.B. xaxis.range[0] falls within a break
                    gd.layout.xaxis.autorange = false;
                    gd.layout.xaxis.range = ['2020-01-01', '2020-01-09'];
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('when range[0] falls within a break pattern (day of week case)', 'x', {
                        rangebreaks: [
                            ['2020-01-01 00:00:00', '2020-01-02 00:00:00'].map(Lib.dateTime2ms),
                            ['2020-01-07 00:00:00', '2020-01-09 00:00:00'].map(Lib.dateTime2ms)
                        ],
                        m2: 0.00000125,
                        B: [-1972296, -1972404, -1972620]
                    });
                })
                .then(done, done.fail);
            });
        });

        describe('during calcTicks', function() {
            var gd;

            beforeEach(function() {
                gd = createGraphDiv();
            });

            afterEach(destroyGraphDiv);

            function _assert(msg, exp, autorange) {
                var fullLayout = gd._fullLayout;
                var xa = fullLayout.xaxis;

                var vals = xa._vals.map(function(d) { return Lib.ms2DateTime(d.x); });
                if(autorange === 'reversed') vals.reverse();

                expect(vals).withContext(msg).toEqual(exp.tickVals);
            }

            it('should not include requested ticks that fall within rangebreaks', function(done) {
                Plotly.newPlot(gd, [{
                    x: [
                        '1970-01-01 00:00:00.000',
                        '1970-01-01 00:00:00.010',
                        '1970-01-01 00:00:00.050',
                        '1970-01-01 00:00:00.090',
                        '1970-01-01 00:00:00.100',
                        '1970-01-01 00:00:00.150',
                        '1970-01-01 00:00:00.190',
                        '1970-01-01 00:00:00.200'
                    ]
                }], {
                    xaxis: {},
                    width: 800,
                    height: 400
                })
                .then(function() {
                    _assert('base', {
                        tickVals: ['1970-01-01', '1970-01-01 00:00:00.05', '1970-01-01 00:00:00.1', '1970-01-01 00:00:00.15', '1970-01-01 00:00:00.2']
                    });
                })
                .then(function() {
                    gd.layout.xaxis = {
                        rangebreaks: [
                            {bounds: [
                                '1970-01-01 00:00:00.011',
                                '1970-01-01 00:00:00.089'
                            ]},
                            {bounds: [
                                '1970-01-01 00:00:00.101',
                                '1970-01-01 00:00:00.189'
                            ]}
                        ]
                    };
                    return Plotly.react(gd, gd.data, gd.layout);
                })
                .then(function() {
                    _assert('with two rangebreaks', {
                        tickVals: ['1970-01-01', '1970-01-01 00:00:00.089', '1970-01-01 00:00:00.1', '1970-01-01 00:00:00.189', '1970-01-01 00:00:00.2']
                    });
                })
                .then(done, done.fail);
            });

            [true, 'reversed'].forEach(function(autorange) {
                it('with ' + autorange + ' autorange, should include requested ticks using tick0 and dtick with rangebreaks', function(done) {
                    var fig = {
                        data: [{
                            x: [
                                '1970-01-01 06:00', '1970-01-01 07:00', '1970-01-01 08:00', '1970-01-01 09:00', '1970-01-01 10:00', '1970-01-01 11:00', '1970-01-01 12:00', '1970-01-01 13:00', '1970-01-01 14:00', '1970-01-01 15:00', '1970-01-01 16:00', '1970-01-01 17:00', '1970-01-01 18:00',
                                '1970-01-02 06:00', '1970-01-02 07:00', '1970-01-02 08:00', '1970-01-02 09:00', '1970-01-02 10:00', '1970-01-02 11:00', '1970-01-02 12:00', '1970-01-02 13:00', '1970-01-02 14:00', '1970-01-02 15:00', '1970-01-02 16:00', '1970-01-02 17:00', '1970-01-02 18:00',
                                '1970-01-03 06:00', '1970-01-03 07:00', '1970-01-03 08:00', '1970-01-03 09:00', '1970-01-03 10:00', '1970-01-03 11:00', '1970-01-03 12:00', '1970-01-03 13:00', '1970-01-03 14:00', '1970-01-03 15:00', '1970-01-03 16:00', '1970-01-03 17:00', '1970-01-03 18:00',
                                '1970-01-04 06:00', '1970-01-04 07:00', '1970-01-04 08:00', '1970-01-04 09:00', '1970-01-04 10:00', '1970-01-04 11:00', '1970-01-04 12:00', '1970-01-04 13:00', '1970-01-04 14:00', '1970-01-04 15:00', '1970-01-04 16:00', '1970-01-04 17:00', '1970-01-04 18:00',
                                '1970-01-05 06:00', '1970-01-05 07:00', '1970-01-05 08:00', '1970-01-05 09:00', '1970-01-05 10:00', '1970-01-05 11:00', '1970-01-05 12:00', '1970-01-05 13:00', '1970-01-05 14:00', '1970-01-05 15:00', '1970-01-05 16:00', '1970-01-05 17:00', '1970-01-05 18:00',
                                '1970-01-06 06:00', '1970-01-06 07:00', '1970-01-06 08:00', '1970-01-06 09:00', '1970-01-06 10:00', '1970-01-06 11:00', '1970-01-06 12:00', '1970-01-06 13:00', '1970-01-06 14:00', '1970-01-06 15:00', '1970-01-06 16:00', '1970-01-06 17:00', '1970-01-06 18:00',
                                '1970-01-07 06:00', '1970-01-07 07:00', '1970-01-07 08:00', '1970-01-07 09:00', '1970-01-07 10:00', '1970-01-07 11:00', '1970-01-07 12:00', '1970-01-07 13:00', '1970-01-07 14:00', '1970-01-07 15:00', '1970-01-07 16:00', '1970-01-07 17:00', '1970-01-07 18:00',
                                '1970-01-08 06:00', '1970-01-08 07:00', '1970-01-08 08:00', '1970-01-08 09:00', '1970-01-08 10:00', '1970-01-08 11:00', '1970-01-08 12:00', '1970-01-08 13:00', '1970-01-08 14:00', '1970-01-08 15:00', '1970-01-08 16:00', '1970-01-08 17:00', '1970-01-08 18:00',
                                '1970-01-09 06:00', '1970-01-09 07:00', '1970-01-09 08:00', '1970-01-09 09:00', '1970-01-09 10:00', '1970-01-09 11:00', '1970-01-09 12:00', '1970-01-09 13:00', '1970-01-09 14:00', '1970-01-09 15:00', '1970-01-09 16:00', '1970-01-09 17:00', '1970-01-09 18:00',
                                '1970-01-10 06:00', '1970-01-10 07:00', '1970-01-10 08:00', '1970-01-10 09:00', '1970-01-10 10:00', '1970-01-10 11:00', '1970-01-10 12:00', '1970-01-10 13:00', '1970-01-10 14:00', '1970-01-10 15:00', '1970-01-10 16:00', '1970-01-10 17:00', '1970-01-10 18:00',
                                '1970-01-11 06:00', '1970-01-11 07:00', '1970-01-11 08:00', '1970-01-11 09:00', '1970-01-11 10:00', '1970-01-11 11:00', '1970-01-11 12:00', '1970-01-11 13:00', '1970-01-11 14:00', '1970-01-11 15:00', '1970-01-11 16:00', '1970-01-11 17:00', '1970-01-11 18:00',
                                '1970-01-12 06:00', '1970-01-12 07:00', '1970-01-12 08:00', '1970-01-12 09:00', '1970-01-12 10:00', '1970-01-12 11:00', '1970-01-12 12:00', '1970-01-12 13:00', '1970-01-12 14:00', '1970-01-12 15:00', '1970-01-12 16:00', '1970-01-12 17:00', '1970-01-12 18:00',
                                '1970-01-13 06:00', '1970-01-13 07:00', '1970-01-13 08:00', '1970-01-13 09:00', '1970-01-13 10:00', '1970-01-13 11:00', '1970-01-13 12:00', '1970-01-13 13:00', '1970-01-13 14:00', '1970-01-13 15:00', '1970-01-13 16:00', '1970-01-13 17:00', '1970-01-13 18:00',
                                '1970-01-14 06:00', '1970-01-14 07:00', '1970-01-14 08:00', '1970-01-14 09:00', '1970-01-14 10:00', '1970-01-14 11:00', '1970-01-14 12:00', '1970-01-14 13:00', '1970-01-14 14:00', '1970-01-14 15:00', '1970-01-14 16:00', '1970-01-14 17:00', '1970-01-14 18:00'
                            ]
                        }],
                        layout: {
                            width: 1600,
                            height: 400
                        }
                    };

                    fig.layout.xaxis = {
                        autorange: autorange,
                        tick0: '1970-01-01 08:00',
                        dtick: 4 * 60 * 60 * 1000,
                        rangebreaks: [{
                            bounds: [ 17, 8 ],
                            pattern: 'hour'
                        }, {
                            bounds: [ 6, 1 ],
                            pattern: 'day of week'
                        }]
                    };

                    Plotly.newPlot(gd, fig)
                    .then(function() {
                        _assert('base', {
                            tickVals: [
                                '1970-01-01 08:00', '1970-01-01 12:00', '1970-01-01 16:00',
                                '1970-01-02 08:00', '1970-01-02 12:00', '1970-01-02 16:00',
                                '1970-01-05 08:00', '1970-01-05 12:00', '1970-01-05 16:00',
                                '1970-01-06 08:00', '1970-01-06 12:00', '1970-01-06 16:00',
                                '1970-01-07 08:00', '1970-01-07 12:00', '1970-01-07 16:00',
                                '1970-01-08 08:00', '1970-01-08 12:00', '1970-01-08 16:00',
                                '1970-01-09 08:00', '1970-01-09 12:00', '1970-01-09 16:00',
                                '1970-01-12 08:00', '1970-01-12 12:00', '1970-01-12 16:00',
                                '1970-01-13 08:00', '1970-01-13 12:00', '1970-01-13 16:00',
                                '1970-01-14 08:00', '1970-01-14 12:00', '1970-01-14 16:00'
                            ]
                        }, autorange);
                    })
                    .then(function() {
                        fig.layout.xaxis = {
                            autorange: autorange,
                            tick0: '1970-01-01 08:00',
                            dtick: 3 * 60 * 60 * 1000,
                            rangebreaks: [{
                                bounds: [ 17, 8 ],
                                pattern: 'hour'
                            }, {
                                bounds: [ 6, 1 ],
                                pattern: 'day of week'
                            }]
                        };
                        return Plotly.newPlot(gd, gd.data, gd.layout);
                    })
                    .then(function() {
                        _assert('3-hour dtick', {
                            tickVals: [
                                '1970-01-01 08:00', '1970-01-01 11:00', '1970-01-01 14:00',
                                '1970-01-02 08:00', '1970-01-02 11:00', '1970-01-02 14:00',
                                '1970-01-05 08:00', '1970-01-05 11:00', '1970-01-05 14:00',
                                '1970-01-06 08:00', '1970-01-06 11:00', '1970-01-06 14:00',
                                '1970-01-07 08:00', '1970-01-07 11:00', '1970-01-07 14:00',
                                '1970-01-08 08:00', '1970-01-08 11:00', '1970-01-08 14:00',
                                '1970-01-09 08:00', '1970-01-09 11:00', '1970-01-09 14:00',
                                '1970-01-12 08:00', '1970-01-12 11:00', '1970-01-12 14:00',
                                '1970-01-13 08:00', '1970-01-13 11:00', '1970-01-13 14:00',
                                '1970-01-14 08:00', '1970-01-14 11:00', '1970-01-14 14:00'
                            ]
                        }, autorange);
                    })
                    .then(function() {
                        fig.layout.xaxis = {
                            autorange: autorange,
                            tick0: '1970-01-01 08:00',
                            dtick: 2 * 60 * 60 * 1000,
                            rangebreaks: [{
                                bounds: [ 17, 8 ],
                                pattern: 'hour'
                            }, {
                                bounds: [ 6, 1 ],
                                pattern: 'day of week'
                            }]
                        };
                        return Plotly.newPlot(gd, gd.data, gd.layout);
                    })
                    .then(function() {
                        _assert('2-hour dtick', {
                            tickVals: [
                                '1970-01-01 08:00', '1970-01-01 10:00', '1970-01-01 12:00', '1970-01-01 14:00', '1970-01-01 16:00',
                                '1970-01-02 08:00', '1970-01-02 10:00', '1970-01-02 12:00', '1970-01-02 14:00', '1970-01-02 16:00',
                                '1970-01-05 08:00', '1970-01-05 10:00', '1970-01-05 12:00', '1970-01-05 14:00', '1970-01-05 16:00',
                                '1970-01-06 08:00', '1970-01-06 10:00', '1970-01-06 12:00', '1970-01-06 14:00', '1970-01-06 16:00',
                                '1970-01-07 08:00', '1970-01-07 10:00', '1970-01-07 12:00', '1970-01-07 14:00', '1970-01-07 16:00',
                                '1970-01-08 08:00', '1970-01-08 10:00', '1970-01-08 12:00', '1970-01-08 14:00', '1970-01-08 16:00',
                                '1970-01-09 08:00', '1970-01-09 10:00', '1970-01-09 12:00', '1970-01-09 14:00', '1970-01-09 16:00',
                                '1970-01-12 08:00', '1970-01-12 10:00', '1970-01-12 12:00', '1970-01-12 14:00', '1970-01-12 16:00',
                                '1970-01-13 08:00', '1970-01-13 10:00', '1970-01-13 12:00', '1970-01-13 14:00', '1970-01-13 16:00',
                                '1970-01-14 08:00', '1970-01-14 10:00', '1970-01-14 12:00', '1970-01-14 14:00', '1970-01-14 16:00'
                            ]
                        }, autorange);
                    })
                    .then(done, done.fail);
                });
            });
        });

        it('should set visible:false in scattergl traces on axis with rangebreaks', function(done) {
            var gd = createGraphDiv();

            spyOn(Lib, 'warn');

            Plotly.newPlot(gd, [{
                type: 'scattergl',
                x: [
                    '2020-01-02 08:00', '2020-01-02 17:00',
                    '2020-01-03 08:00', '2020-01-03 17:00',
                    '2020-01-04 08:00', '2020-01-04 17:00',
                    '2020-01-05 08:00', '2020-01-05 17:00',
                    '2020-01-06 08:00', '2020-01-06 17:00',
                    '2020-01-07 08:00', '2020-01-07 17:00'
                ]
            }], {
                xaxis: {
                    rangebreaks: [{pattern: 'hour', bounds: [17, 8]}]
                }
            })
            .then(function() {
                expect(gd._fullData[0].visible).toBe(false, 'sets visible:false');
                expect(Lib.warn).toHaveBeenCalledTimes(1);
                expect(Lib.warn).toHaveBeenCalledWith('scattergl traces do not work on axes with rangebreaks. Setting trace 0 to `visible: false`.');
            })
            .then(function() {
                destroyGraphDiv();
                done();
            }, done.fail);
        });
    });

    describe('label positioning using *ticklabelmode*: "period"', function() {
        var hovertemplate = 'x:%{x|%x %X}'; // to make debugging easier
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function _assert(msg, expPositions, expLabels) {
            var ax = gd._fullLayout.xaxis;

            var positions = ax._vals.map(function(d) { return ax.c2d(d.periodX !== undefined ? d.periodX : d.x); });
            var labels = ax._vals.map(function(d) { return d.text; });

            for(var i = 0; i < labels.length; i++) {
                expect(labels[i]).withContext(msg).toBe(expLabels[i]);
                if(labels[i] !== '') {
                    expect(positions[i]).withContext(msg).toBe(expPositions[i]);
                }
            }
        }

        ['%Y', '%y'].forEach(function(formatter, i) {
            it('should respect yearly tickformat that includes ' + formatter, function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        hovertemplate: hovertemplate,
                        x: ['2020-01-01', '2026-01-01']
                    }],
                    layout: {
                        width: 1000,
                        xaxis: {
                            ticklabelmode: 'period',
                            tickformat: formatter
                        }
                    }
                })
                .then(function() {
                    _assert('', [
                        '2019-07-02 12:00',
                        '2020-07-02',
                        '2021-07-02 12:00',
                        '2022-07-02 12:00',
                        '2023-07-02 12:00',
                        '2024-07-02',
                        '2025-07-02 12:00',
                        '2026-07-02 12:00'
                    ], [
                        ['', '2020', '2021', '2022', '2023', '2024', '2025', ''],
                        ['', '20', '21', '22', '23', '24', '25', '']
                    ][i]);
                })
                .then(done, done.fail);
            });
        });

        it('should respect quarters tickformat that includes %q', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    hovertemplate: hovertemplate,
                    x: ['2020-01-01', '2022-01-01']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        ticklabelmode: 'period',
                        tickformat: '%Y-Q%q'
                    }
                }
            })
            .then(function() {
                _assert('', [
                    '2019-11-16',
                    '2020-02-15 12:00',
                    '2020-05-16 12:00',
                    '2020-08-16',
                    '2020-11-16',
                    '2021-02-15',
                    '2021-05-16 12:00',
                    '2021-08-16',
                    '2021-11-16',
                    '2022-02-16'
                ], ['', '2020-Q1', '2020-Q2', '2020-Q3', '2020-Q4', '2021-Q1', '2021-Q2', '2021-Q3', '2021-Q4', '']);
            })
            .then(done, done.fail);
        });

        it('should position quarters - case of dtick set to M6', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    hovertemplate: hovertemplate,
                    x: ['2020-01-01', '2022-01-01']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        dtick: 'M6',
                        ticklabelmode: 'period',
                        tickformat: '%Y-Q%q'
                    }
                }
            })
            .then(function() {
                _assert('', [
                    '2019-08-15 15:45',
                    '2020-02-15 15:45',
                    '2020-08-15 15:45',
                    '2021-02-15 15:45',
                    '2021-08-15 15:45',
                    '2022-02-15 15:45'
                ], ['', '2020-Q1', '2020-Q3', '2021-Q1', '2021-Q3', '']);
            })
            .then(done, done.fail);
        });

        ['%B', '%b', '%m'].forEach(function(formatter, i) {
            it('should respect monthly tickformat that includes ' + formatter, function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        hovertemplate: hovertemplate,
                        x: ['2020-01-01', '2020-07-01']
                    }],
                    layout: {
                        width: 1000,
                        xaxis: {
                            ticklabelmode: 'period',
                            tickformat: 'Q%q-' + formatter
                        }
                    }
                })
                .then(function() {
                    _assert('', [
                        '2019-12-16 12:00',
                        '2020-01-16 12:00',
                        '2020-02-15 12:00',
                        '2020-03-16 12:00',
                        '2020-04-16',
                        '2020-05-16 12:00',
                        '2020-06-16',
                        '2020-07-16'
                    ], [
                        ['', 'Q1-January', 'Q1-February', 'Q1-March', 'Q2-April', 'Q2-May', 'Q2-June', ''],
                        ['', 'Q1-Jan', 'Q1-Feb', 'Q1-Mar', 'Q2-Apr', 'Q2-May', 'Q2-Jun', ''],
                        ['', 'Q1-01', 'Q1-02', 'Q1-03', 'Q2-04', 'Q2-05', 'Q2-06', '']
                    ][i]);
                })
                .then(done, done.fail);
            });
        });

        it('should respect Sunday-based week tickformat that includes %U', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    hovertemplate: hovertemplate,
                    x: ['2020-02-01', '2020-04-01']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        ticklabelmode: 'period',
                        tickformat: '%b-W%U'
                    }
                }
            })
            .then(function() {
                _assert('', [
                    '2020-01-29 12:00',
                    '2020-02-05 12:00',
                    '2020-02-12 12:00',
                    '2020-02-19 12:00',
                    '2020-02-26 12:00',
                    '2020-03-04 12:00',
                    '2020-03-11 12:00',
                    '2020-03-18 12:00',
                    '2020-03-25 12:00',
                    '2020-04-01 12:00'
                ], ['Jan-W04', 'Feb-W05', 'Feb-W06', 'Feb-W07', 'Feb-W08', 'Mar-W09', 'Mar-W10', 'Mar-W11', 'Mar-W12', 'Mar-W13']);
            })
            .then(done, done.fail);
        });

        ['%V', '%W'].forEach(function(formatter, i) {
            it('should respect Monday-based week tickformat that includes ' + formatter, function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        hovertemplate: hovertemplate,
                        x: ['2020-02-01', '2020-04-01']
                    }],
                    layout: {
                        width: 1000,
                        xaxis: {
                            ticklabelmode: 'period',
                            tickformat: '%b-W' + formatter
                        }
                    }
                })
                .then(function() {
                    _assert('', [
                        '2020-01-30 12:00',
                        '2020-02-06 12:00',
                        '2020-02-13 12:00',
                        '2020-02-20 12:00',
                        '2020-02-27 12:00',
                        '2020-03-05 12:00',
                        '2020-03-12 12:00',
                        '2020-03-19 12:00',
                        '2020-03-26 12:00',
                        '2020-04-02 12:00'
                    ], [
                        ['Jan-W05', 'Feb-W06', 'Feb-W07', 'Feb-W08', 'Feb-W09', 'Mar-W10', 'Mar-W11', 'Mar-W12', 'Mar-W13', 'Mar-W14'],
                        ['Jan-W04', 'Feb-W05', 'Feb-W06', 'Feb-W07', 'Feb-W08', 'Mar-W09', 'Mar-W10', 'Mar-W11', 'Mar-W12', 'Mar-W13']
                    ][i]);
                })
                .then(done, done.fail);
            });
        });

        ['%U', '%V', '%W'].forEach(function(formatter, i) {
            it('should position weekly labels in the middle when *day of week* rangebreak is present', function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        hovertemplate: hovertemplate,
                        x: [
                            '2020-01-01',
                            '2020-01-02',
                            '2020-01-03',
                            '2020-01-04',
                            '2020-01-05',
                            '2020-01-06',
                            '2020-01-07',
                            '2020-01-08',
                            '2020-01-09',
                            '2020-01-10',
                            '2020-01-11',
                            '2020-01-12',
                            '2020-01-13',
                            '2020-01-14',
                            '2020-01-15',
                            '2020-01-16',
                            '2020-01-17',
                            '2020-01-18',
                            '2020-01-19',
                            '2020-01-20',
                            '2020-01-21',
                            '2020-01-22',
                            '2020-01-23',
                            '2020-01-24',
                            '2020-01-25',
                            '2020-01-26',
                            '2020-01-27',
                            '2020-01-28',
                            '2020-01-29',
                            '2020-01-30',
                            '2020-01-31'
                        ]
                    }],
                    layout: {
                        width: 1000,
                        xaxis: {
                            rangebreaks: [{bounds: ['sat', 'mon']}],
                            ticklabelmode: 'period',
                            tickformat: '%b-W' + formatter
                        }
                    }
                })
                .then(function() {
                    _assert('', [
                        ['2020-01-08 12:00', '2020-01-15 12:00', '2020-01-22 12:00', '2020-01-29 12:00'],
                        ['2020-01-08 12:00', '2020-01-15 12:00', '2020-01-22 12:00', '2020-01-29 12:00'],
                        ['2020-01-08 12:00', '2020-01-15 12:00', '2020-01-22 12:00', '2020-01-29 12:00']
                    ][i], [
                        ['Jan-W01', 'Jan-W02', 'Jan-W03', 'Jan-W04'],
                        ['Jan-W02', 'Jan-W03', 'Jan-W04', 'Jan-W05'],
                        ['Jan-W01', 'Jan-W02', 'Jan-W03', 'Jan-W04']
                    ][i]);
                })
                .then(done, done.fail);
            });
        });

        ['%A', '%a', '%d', '%e', '%j', '%u', '%w', '%x'].forEach(function(formatter, i) {
            it('should respect daily tickformat that includes ' + formatter, function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        hovertemplate: hovertemplate,
                        x: ['2020-01-01', '2020-01-08']
                    }],
                    layout: {
                        width: 1000,
                        xaxis: {
                            ticklabelmode: 'period',
                            tickformat: '%b-' + formatter
                        }
                    }
                })
                .then(function() {
                    _assert('', [
                        '2019-12-31 12:00',
                        '2020-01-01 12:00',
                        '2020-01-02 12:00',
                        '2020-01-03 12:00',
                        '2020-01-04 12:00',
                        '2020-01-05 12:00',
                        '2020-01-06 12:00',
                        '2020-01-07 12:00',
                        '2020-01-08 12:00'
                    ], [
                        ['', 'Jan-Wednesday', 'Jan-Thursday', 'Jan-Friday', 'Jan-Saturday', 'Jan-Sunday', 'Jan-Monday', 'Jan-Tuesday', ''],
                        ['', 'Jan-Wed', 'Jan-Thu', 'Jan-Fri', 'Jan-Sat', 'Jan-Sun', 'Jan-Mon', 'Jan-Tue', ''],
                        ['', 'Jan-01', 'Jan-02', 'Jan-03', 'Jan-04', 'Jan-05', 'Jan-06', 'Jan-07', ''],
                        ['', 'Jan- 1', 'Jan- 2', 'Jan- 3', 'Jan- 4', 'Jan- 5', 'Jan- 6', 'Jan- 7', ''],
                        ['', 'Jan-001', 'Jan-002', 'Jan-003', 'Jan-004', 'Jan-005', 'Jan-006', 'Jan-007', ''],
                        ['', 'Jan-3', 'Jan-4', 'Jan-5', 'Jan-6', 'Jan-7', 'Jan-1', 'Jan-2', ''],
                        ['', 'Jan-3', 'Jan-4', 'Jan-5', 'Jan-6', 'Jan-0', 'Jan-1', 'Jan-2', ''],
                        ['', 'Jan-01/01/2020', 'Jan-01/02/2020', 'Jan-01/03/2020', 'Jan-01/04/2020', 'Jan-01/05/2020', 'Jan-01/06/2020', 'Jan-01/07/2020', '']
                    ][i]);
                })
                .then(done, done.fail);
            });
        });

        ['%Q', '%s', '%X'].forEach(function(formatter, i) {
            it('should respect daily tickformat that includes ' + formatter, function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        hovertemplate: hovertemplate,
                        x: ['2020-01-01', '2020-01-02']
                    }],
                    layout: {
                        width: 1000,
                        xaxis: {
                            ticklabelmode: 'period',
                            tickformat: '%a-' + formatter
                        }
                    }
                })
                .then(function() {
                    _assert('', [
                        '2019-12-31 21:00',
                        '2020-01-01',
                        '2020-01-01 03:00',
                        '2020-01-01 06:00',
                        '2020-01-01 09:00',
                        '2020-01-01 12:00',
                        '2020-01-01 15:00',
                        '2020-01-01 18:00',
                        '2020-01-01 21:00',
                        '2020-01-02'
                    ], [
                        ['', 'Wed-1577836800000', 'Wed-1577847600000', 'Wed-1577858400000', 'Wed-1577869200000', 'Wed-1577880000000', 'Wed-1577890800000', 'Wed-1577901600000', 'Wed-1577912400000', 'Thu-1577923200000'],
                        ['', 'Wed-1577836800', 'Wed-1577847600', 'Wed-1577858400', 'Wed-1577869200', 'Wed-1577880000', 'Wed-1577890800', 'Wed-1577901600', 'Wed-1577912400', 'Thu-1577923200'],
                        ['', 'Wed-00:00:00', 'Wed-03:00:00', 'Wed-06:00:00', 'Wed-09:00:00', 'Wed-12:00:00', 'Wed-15:00:00', 'Wed-18:00:00', 'Wed-21:00:00', 'Thu-00:00:00']
                    ][i]);
                })
                .then(done, done.fail);
            });
        });

        [
            {
                formatter: '%H',
                positions: ['2019-12-31 21:30', '2020-01-01 00:30', '2020-01-01 03:30', '2020-01-01 06:30', '2020-01-01 09:30', '2020-01-01 12:30', '2020-01-01 15:30', '2020-01-01 18:30', '2020-01-01 21:30', '2020-01-02 00:30'],
                labels: ['', 'Wed-00', 'Wed-03', 'Wed-06', 'Wed-09', 'Wed-12', 'Wed-15', 'Wed-18', 'Wed-21', 'Thu-00']
            },
            {
                formatter: '%I',
                positions: ['2019-12-31 21:30', '2020-01-01 00:30', '2020-01-01 03:30', '2020-01-01 06:30', '2020-01-01 09:30', '2020-01-01 12:30', '2020-01-01 15:30', '2020-01-01 18:30', '2020-01-01 21:30', '2020-01-02 00:30'],
                labels: ['', 'Wed-12', 'Wed-03', 'Wed-06', 'Wed-09', 'Wed-12', 'Wed-03', 'Wed-06', 'Wed-09', 'Thu-12']
            },
            {
                formatter: '%p',
                positions: ['2019-12-31 18:00', '2020-01-01 06:00', '2020-01-01 18:00', '2020-01-02 06:00'],
                labels: ['', 'Wed-AM', 'Wed-PM', '']
            },
            {
                formatter: '%M',
                positions: ['2019-12-31 21:00', '2020-01-01', '2020-01-01 03:00', '2020-01-01 06:00', '2020-01-01 09:00', '2020-01-01 12:00', '2020-01-01 15:00', '2020-01-01 18:00', '2020-01-01 21:00', '2020-01-02'],
                labels: ['', 'Wed-00', 'Wed-00', 'Wed-00', 'Wed-00', 'Wed-00', 'Wed-00', 'Wed-00', 'Wed-00', 'Thu-00']
            },
            {
                formatter: '%S',
                positions: ['2019-12-31 21:00', '2020-01-01', '2020-01-01 03:00', '2020-01-01 06:00', '2020-01-01 09:00', '2020-01-01 12:00', '2020-01-01 15:00', '2020-01-01 18:00', '2020-01-01 21:00', '2020-01-02'],
                labels: ['', 'Wed-00', 'Wed-00', 'Wed-00', 'Wed-00', 'Wed-00', 'Wed-00', 'Wed-00', 'Wed-00', 'Thu-00']
            },
            {
                formatter: '%L',
                positions: ['2019-12-31 21:00', '2020-01-01', '2020-01-01 03:00', '2020-01-01 06:00', '2020-01-01 09:00', '2020-01-01 12:00', '2020-01-01 15:00', '2020-01-01 18:00', '2020-01-01 21:00', '2020-01-02'],
                labels: ['', 'Wed-000', 'Wed-000', 'Wed-000', 'Wed-000', 'Wed-000', 'Wed-000', 'Wed-000', 'Wed-000', 'Thu-000']
            },
            {
                formatter: '%f',
                positions: ['2019-12-31 21:00', '2020-01-01', '2020-01-01 03:00', '2020-01-01 06:00', '2020-01-01 09:00', '2020-01-01 12:00', '2020-01-01 15:00', '2020-01-01 18:00', '2020-01-01 21:00', '2020-01-02'],
                labels: ['', 'Wed-0', 'Wed-0', 'Wed-0', 'Wed-0', 'Wed-0', 'Wed-0', 'Wed-0', 'Wed-0', 'Thu-0']
            }
        ].forEach(function(t) {
            it('should respect time tickformat that includes ' + t.formatter, function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        hovertemplate: hovertemplate,
                        x: ['2020-01-01', '2020-01-02']
                    }],
                    layout: {
                        width: 1000,
                        xaxis: {
                            ticklabelmode: 'period',
                            tickformat: '%a-' + t.formatter
                        }
                    }
                })
                .then(function() {
                    _assert('', t.positions, t.labels);
                })
                .then(done, done.fail);
            });
        });

        [
            {
                range: ['2019-12-10', '2020-01-10'],
                positions: ['2019-12-16 12:00', '2020-01-10'],
                labels: ['2019-Dec', '']
            },
            {
                range: ['2019-12-20', '2020-01-20'],
                positions: ['2019-12-20', '2020-01-16 12:00'],
                labels: ['', '2020-Jan']
            },
            {
                range: ['2020-01-20', '2019-12-20'],
                positions: ['2020-01-20', '2020-01-16 12:00'],
                labels: ['', '2020-Jan']
            }
        ].forEach(function(t) {
            it('should position labels with monthly tickformat when auto dtick is weekly | range:' + t.range, function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        x: [
                            '2020-01-01',
                            '2020-01-02'
                        ],
                        mode: 'lines+text',
                        text: [
                            'Jan 01',
                            'Jan 02'
                        ]
                    }],
                    layout: {
                        width: 600,
                        xaxis: {
                            range: t.range,
                            ticklabelmode: 'period',
                            tickformat: '%Y-%b'
                        }
                    }
                })
                .then(function() {
                    _assert('', t.positions, t.labels);
                })
                .then(done, done.fail);
            });
        });

        [
            {
                range: ['2020-12-15', '2084-12-15'],
                positions: ['2020-07-01 15:00', '2030-07-02 15:00', '2040-07-01 15:00', '2050-07-02 15:00', '2060-07-01 15:00', '2070-07-02 15:00', '2080-07-01 15:00'],
                labels: ['', '2030', '2040', '2050', '2060', '2070', '2080']
            },
            {
                range: ['2020-12-15', '2052-12-15'],
                positions: ['2020-07-01 15:00', '2025-07-02 15:00', '2030-07-02 15:00', '2035-07-02 15:00', '2040-07-01 15:00', '2045-07-02 15:00', '2050-07-02 15:00'],
                labels: ['', '2025', '2030', '2035', '2040', '2045', '2050']
            },
            {
                range: ['2020-12-15', '2036-12-15'],
                positions: ['2020-07-01 15:00', '2022-07-02 15:00', '2024-07-01 15:00', '2026-07-02 15:00', '2028-07-01 15:00', '2030-07-02 15:00', '2032-07-01 15:00', '2034-07-02 15:00', '2036-07-01 15:00'],
                labels: ['', '2022', '2024', '2026', '2028', '2030', '2032', '2034', '2036']
            },
            {
                range: ['2020-12-15', '2028-12-15'],
                positions: ['2020-07-02', '2021-07-02 12:00', '2022-07-02 12:00', '2023-07-02 12:00', '2024-07-02', '2025-07-02 12:00', '2026-07-02 12:00', '2027-07-02 12:00', '2028-07-01 12:00'],
                labels: ['', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028']
            },
            {
                range: ['2020-12-15', '2024-12-15'],
                positions: ['2020-07-16 05:15', '2021-01-16 05:15', '2021-07-16 05:15', '2022-01-16 05:15', '2022-07-16 05:15', '2023-01-16 05:15', '2023-07-16 05:15', '2024-01-16 05:15', '2024-07-16 05:15'],
                labels: ['', 'Jan 2021', 'Jul 2021', 'Jan 2022', 'Jul 2022', 'Jan 2023', 'Jul 2023', 'Jan 2024', 'Jul 2024']
            },
            {
                range: ['2020-12-15', '2022-12-15'],
                positions: ['2020-10-16 05:15', '2021-01-16 05:15', '2021-04-16 05:15', '2021-07-16 05:15', '2021-10-16 05:15', '2022-01-16 05:15', '2022-04-16 05:15', '2022-07-16 05:15', '2022-10-16 05:15'],
                labels: ['', 'Jan 2021', 'Apr 2021', 'Jul 2021', 'Oct 2021', 'Jan 2022', 'Apr 2022', 'Jul 2022', 'Oct 2022']
            },
            {
                range: ['2020-12-15', '2021-12-15'],
                positions: ['2020-11-16 05:15', '2021-01-16 05:15', '2021-03-16 05:15', '2021-05-16 05:15', '2021-07-16 05:15', '2021-09-16 05:15', '2021-11-16 05:15'],
                labels: ['', 'Jan 2021', 'Mar 2021', 'May 2021', 'Jul 2021', 'Sep 2021', 'Nov 2021']
            },
            {
                range: ['2020-12-15', '2021-06-15'],
                positions: ['2020-12-16 12:00', '2021-01-16 12:00', '2021-02-15', '2021-03-16 12:00', '2021-04-16', '2021-05-16 12:00', '2021-06-16 12:00'],
                labels: ['Dec 2020', 'Jan 2021', 'Feb 2021', 'Mar 2021', 'Apr 2021', 'May 2021', '']
            },
            {
                range: ['2020-12-15', '2021-02-15'],
                positions: ['2020-12-13 12:00', '2020-12-20 12:00', '2020-12-27 12:00', '2021-01-03 12:00', '2021-01-10 12:00', '2021-01-17 12:00', '2021-01-24 12:00', '2021-01-31 12:00', '2021-02-07 12:00', '2021-02-14 12:00'],
                labels: ['', 'Dec 20<br>2020', 'Dec 27', 'Jan 3<br>2021', 'Jan 10', 'Jan 17', 'Jan 24', 'Jan 31', 'Feb 7', 'Feb 14']
            },
            {
                range: ['2020-12-15', '2021-01-15'],
                positions: ['2020-12-13 12:00', '2020-12-20 12:00', '2020-12-27 12:00', '2021-01-03 12:00', '2021-01-10 12:00'],
                labels: ['', 'Dec 20<br>2020', 'Dec 27', 'Jan 3<br>2021', 'Jan 10']
            },
            {
                range: ['2020-12-15', '2021-01-01'],
                positions: ['2020-12-14 12:00', '2020-12-16 12:00', '2020-12-18 12:00', '2020-12-20 12:00', '2020-12-22 12:00', '2020-12-24 12:00', '2020-12-26 12:00', '2020-12-28 12:00', '2020-12-30 12:00', '2021-01-01 12:00'],
                labels: ['', 'Dec 16<br>2020', 'Dec 18', 'Dec 20', 'Dec 22', 'Dec 24', 'Dec 26', 'Dec 28', 'Dec 30', '']
            },
            {
                range: ['2020-12-15', '2020-12-21'],
                positions: ['2020-12-14 12:00', '2020-12-15 12:00', '2020-12-16 12:00', '2020-12-17 12:00', '2020-12-18 12:00', '2020-12-19 12:00', '2020-12-20 12:00', '2020-12-21 12:00'],
                labels: ['', 'Dec 15<br>2020', 'Dec 16', 'Dec 17', 'Dec 18', 'Dec 19', 'Dec 20', '']
            },
            {
                range: ['2020-12-15', '2020-12-16'],
                positions: ['2020-12-14 21:00', '2020-12-15', '2020-12-15 03:00', '2020-12-15 06:00', '2020-12-15 09:00', '2020-12-15 12:00', '2020-12-15 15:00', '2020-12-15 18:00', '2020-12-15 21:00', '2020-12-16'],
                labels: ['', '00:00<br>Dec 15, 2020', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '00:00<br>Dec 16, 2020']
            },
            {
                range: ['2020-12-15', '2020-12-15 12:00'],
                positions: ['2020-12-14 22:00', '2020-12-15', '2020-12-15 02:00', '2020-12-15 04:00', '2020-12-15 06:00', '2020-12-15 08:00', '2020-12-15 10:00', '2020-12-15 12:00'],
                labels: ['', '00:00<br>Dec 15, 2020', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00']
            }
        ].forEach(function(t) {
            it('should position auto labels | range:' + t.range, function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        hovertemplate: hovertemplate,
                        x: [
                            '2020-12-15',
                            '2020-12-15 0:45',
                            '2020-12-15 1:30',
                            '2020-12-15 3:00',
                            '2020-12-15 6:00',
                            '2020-12-15 12:00',
                            '2020-12-16',
                            '2020-12-18',
                            '2020-12-24',
                            '2021-01-01',
                            '2021-01-15',
                            '2021-02-15',
                            '2021-03-15',
                            '2021-04-15',
                            '2021-05-15',
                            '2021-06-15',
                            '2021-07-01',
                            '2022-07-01',
                            '2023-07-01',
                            '2024-07-01',
                            '2025-07-01',
                            '2030-07-01',
                            '2035-07-01',
                            '2040-07-01',
                            '2080-07-01',
                            '2160-07-01'
                        ]
                    }],
                    layout: {
                        width: 1000,
                        xaxis: {
                            ticklabelmode: 'period',
                            range: t.range
                        }
                    }
                })
                .then(function() {
                    _assert('', t.positions, t.labels);
                })
                .then(done, done.fail);
            });
        });

        [
            {
                range: ['2084-12-15', '2020-12-15'],
                positions: ['2090-07-02 15:00', '2080-07-01 15:00', '2070-07-02 15:00', '2060-07-01 15:00', '2050-07-02 15:00', '2040-07-01 15:00', '2030-07-02 15:00'],
                labels: ['', '2080', '2070', '2060', '2050', '2040', '2030']
            },
            {
                range: ['2052-12-15', '2020-12-15'],
                positions: ['2055-07-02 15:00', '2050-07-02 15:00', '2045-07-02 15:00', '2040-07-01 15:00', '2035-07-02 15:00', '2030-07-02 15:00', '2025-07-02 15:00'],
                labels: ['', '2050', '2045', '2040', '2035', '2030', '2025']
            },
            {
                range: ['2036-12-15', '2020-12-15'],
                positions: ['2038-07-02 15:00', '2036-07-01 15:00', '2034-07-02 15:00', '2032-07-01 15:00', '2030-07-02 15:00', '2028-07-01 15:00', '2026-07-02 15:00', '2024-07-01 15:00', '2022-07-02 15:00'],
                labels: ['', '2036', '2034', '2032', '2030', '2028', '2026', '2024', '2022']
            },
            {
                range: ['2028-12-15', '2020-12-15'],
                positions: ['2029-07-03', '2028-07-01 12:00', '2027-07-02 12:00', '2026-07-02 12:00', '2025-07-03', '2024-07-01 12:00', '2023-07-02 12:00', '2022-07-02 12:00', '2021-07-02 12:00'],
                labels: ['', '2028', '2027', '2026', '2025', '2024', '2023', '2022', '2021']
            },
            {
                range: ['2024-12-15', '2020-12-15'],
                positions: ['2025-01-16 05:15', '2024-07-16 05:15', '2024-01-16 05:15', '2023-07-16 05:15', '2023-01-16 05:15', '2022-07-16 05:15', '2022-01-16 05:15', '2021-07-16 05:15', '2021-01-16 05:15'],
                labels: ['', 'Jul 2024', 'Jan 2024', 'Jul 2023', 'Jan 2023', 'Jul 2022', 'Jan 2022', 'Jul 2021', 'Jan 2021']
            },
            {
                range: ['2022-12-15', '2020-12-15'],
                positions: ['2023-01-16 05:15', '2022-10-16 05:15', '2022-07-16 05:15', '2022-04-16 05:15', '2022-01-16 05:15', '2021-10-16 05:15', '2021-07-16 05:15', '2021-04-16 05:15', '2021-01-16 05:15'],
                labels: ['', 'Oct 2022', 'Jul 2022', 'Apr 2022', 'Jan 2022', 'Oct 2021', 'Jul 2021', 'Apr 2021', 'Jan 2021']
            },
            {
                range: ['2021-12-15', '2020-12-15'],
                positions: ['2022-01-16 05:15', '2021-11-16 05:15', '2021-09-16 05:15', '2021-07-16 05:15', '2021-05-16 05:15', '2021-03-16 05:15', '2021-01-16 05:15'],
                labels: ['', 'Nov 2021', 'Sep 2021', 'Jul 2021', 'May 2021', 'Mar 2021', 'Jan 2021']
            },
            {
                range: ['2021-06-15', '2020-12-15'],
                positions: ['2021-07-16', '2021-06-16 12:00', '2021-05-16', '2021-04-16 12:00', '2021-03-15', '2021-02-16 12:00', '2021-01-16 12:00'],
                labels: ['', '', 'May 2021', 'Apr 2021', 'Mar 2021', 'Feb 2021', 'Jan 2021']
            },
            {
                range: ['2021-02-15', '2020-12-15'],
                positions: ['2021-02-21 12:00', '2021-02-14 12:00', '2021-02-07 12:00', '2021-01-31 12:00', '2021-01-24 12:00', '2021-01-17 12:00', '2021-01-10 12:00', '2021-01-03 12:00', '2020-12-27 12:00', '2020-12-20 12:00'],
                labels: ['', 'Feb 14<br>2021', 'Feb 7', 'Jan 31', 'Jan 24', 'Jan 17', 'Jan 10', 'Jan 3', 'Dec 27<br>2020', 'Dec 20']
            },
            {
                range: ['2021-01-15', '2020-12-15'],
                positions: ['2021-01-17 12:00', '2021-01-10 12:00', '2021-01-03 12:00', '2020-12-27 12:00', '2020-12-20 12:00'],
                labels: ['', 'Jan 10<br>2021', 'Jan 3', 'Dec 27<br>2020', 'Dec 20']
            },
            {
                range: ['2021-01-01', '2020-12-15'],
                positions: ['2021-01-03 12:00', '2021-01-01 12:00', '2020-12-30 12:00', '2020-12-28 12:00', '2020-12-26 12:00', '2020-12-24 12:00', '2020-12-22 12:00', '2020-12-20 12:00', '2020-12-18 12:00', '2020-12-16 12:00'],
                labels: ['', '', 'Dec 30<br>2020', 'Dec 28', 'Dec 26', 'Dec 24', 'Dec 22', 'Dec 20', 'Dec 18', 'Dec 16']
            },
            {
                range: ['2020-12-21', '2020-12-15'],
                positions: ['2020-12-22 12:00', '2020-12-21 12:00', '2020-12-20 12:00', '2020-12-19 12:00', '2020-12-18 12:00', '2020-12-17 12:00', '2020-12-16 12:00', '2020-12-15 12:00'],
                labels: ['', '', 'Dec 20<br>2020', 'Dec 19', 'Dec 18', 'Dec 17', 'Dec 16', 'Dec 15']
            },
            {
                range: ['2020-12-16', '2020-12-15'],
                positions: ['2020-12-16 03:00', '2020-12-16', '2020-12-15 21:00', '2020-12-15 18:00', '2020-12-15 15:00', '2020-12-15 12:00', '2020-12-15 09:00', '2020-12-15 06:00', '2020-12-15 03:00', '2020-12-15'],
                labels: ['', '00:00<br>Dec 16, 2020', '21:00<br>Dec 15, 2020', '18:00', '15:00', '12:00', '09:00', '06:00', '03:00', '00:00']
            },
            {
                range: ['2020-12-15 12:00', '2020-12-15'],
                positions: ['2020-12-15 14:00', '2020-12-15 12:00', '2020-12-15 10:00', '2020-12-15 08:00', '2020-12-15 06:00', '2020-12-15 04:00', '2020-12-15 02:00', '2020-12-15'],
                labels: ['', '12:00<br>Dec 15, 2020', '10:00', '08:00', '06:00', '04:00', '02:00', '00:00']
            }
        ].forEach(function(t) {
            it('should position auto labels | reversed range:' + t.range, function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        hovertemplate: hovertemplate,
                        x: [
                            '2020-12-15',
                            '2020-12-15 0:45',
                            '2020-12-15 1:30',
                            '2020-12-15 3:00',
                            '2020-12-15 6:00',
                            '2020-12-15 12:00',
                            '2020-12-16',
                            '2020-12-18',
                            '2020-12-24',
                            '2021-01-01',
                            '2021-01-15',
                            '2021-02-15',
                            '2021-03-15',
                            '2021-04-15',
                            '2021-05-15',
                            '2021-06-15',
                            '2021-07-01',
                            '2022-07-01',
                            '2023-07-01',
                            '2024-07-01',
                            '2025-07-01',
                            '2030-07-01',
                            '2035-07-01',
                            '2040-07-01',
                            '2080-07-01',
                            '2160-07-01'
                        ]
                    }],
                    layout: {
                        width: 1000,
                        xaxis: {
                            ticklabelmode: 'period',
                            range: t.range
                        }
                    }
                })
                .then(function() {
                    _assert('', t.positions, t.labels);
                })
                .then(done, done.fail);
            });
        });

        [
            {
                range: ['2020-12-14 08:00', '2022-12-14 08:00'],
                positions: ['2021-01-06 07:45', '2021-04-06 07:45', '2021-07-06 07:45', '2021-10-06 07:45', '2022-01-06 07:45', '2022-04-06 07:45', '2022-07-06 07:45', '2022-10-06 07:45'],
                labels: ['Jan 2021', 'Apr 2021', 'Jul 2021', 'Oct 2021', 'Jan 2022', 'Apr 2022', 'Jul 2022', 'Oct 2022']
            },
            {
                range: ['2020-12-14 08:00', '2021-08-14 08:00'],
                positions: ['2021-01-16 18:00', '2021-02-15 06:00', '2021-03-16 18:00', '2021-04-16 06:00', '2021-05-16 18:00', '2021-06-16 06:00', '2021-07-16 18:00', '2021-08-16 18:00'],
                labels: ['Jan 2021', 'Feb 2021', 'Mar 2021', 'Apr 2021', 'May 2021', 'Jun 2021', 'Jul 2021', '']
            },
            {
                range: ['2020-12-14 08:00', '2021-04-14 08:00'],
                positions: ['2020-12-21 12:00', '2021-01-04 12:00', '2021-01-18 12:00', '2021-02-01 12:00', '2021-02-15 12:00', '2021-03-01 12:00', '2021-03-15 12:00', '2021-03-29 12:00', '2021-04-12 12:00'],
                labels: ['Dec 21<br>2020', 'Jan 4<br>2021', 'Jan 18', 'Feb 1', 'Feb 15', 'Mar 1', 'Mar 15', 'Mar 29', 'Apr 12']
            },
            {
                range: ['2020-12-14 08:00', '2021-02-14 08:00'],
                positions: ['2020-12-21 12:00', '2020-12-28 12:00', '2021-01-04 12:00', '2021-01-11 12:00', '2021-01-18 12:00', '2021-01-25 12:00', '2021-02-01 12:00', '2021-02-08 12:00'],
                labels: ['Dec 21<br>2020', 'Dec 28', 'Jan 4<br>2021', 'Jan 11', 'Jan 18', 'Jan 25', 'Feb 1', 'Feb 8']
            },
            {
                range: ['2020-12-14 08:00', '2021-01-14 08:00'],
                positions: ['2020-12-21 12:00', '2020-12-28 12:00', '2021-01-04 12:00', '2021-01-11 12:00'],
                labels: ['Dec 21<br>2020', 'Dec 28', 'Jan 4<br>2021', 'Jan 11']
            },
            {
                range: ['2020-12-14 08:00', '2021-01-01 08:00'],
                positions: ['2020-12-16 12:00', '2020-12-18 12:00', '2020-12-22 12:00', '2020-12-24 12:00', '2020-12-28 12:00', '2020-12-30 12:00', '2021-01-01 12:00'],
                labels: ['Dec 16<br>2020', 'Dec 18', 'Dec 22', 'Dec 24', 'Dec 28', 'Dec 30', '']
            },
            {
                range: ['2020-12-14 08:00', '2020-12-22 08:00'],
                positions: ['2020-12-15 12:00', '2020-12-16 12:00', '2020-12-17 12:00', '2020-12-18 12:00', '2020-12-21 12:00', '2020-12-22 12:00'],
                labels: ['Dec 15<br>2020', 'Dec 16', 'Dec 17', 'Dec 18', 'Dec 21', '']
            },
            {
                range: ['2020-12-14 08:00', '2020-12-18 08:00'],
                positions: ['2020-12-14 12:00', '2020-12-15 06:00', '2020-12-15 12:00', '2020-12-16 06:00', '2020-12-16 12:00', '2020-12-17 06:00', '2020-12-17 12:00', '2020-12-18 06:00'],
                labels: ['12:00<br>Dec 14, 2020', '06:00<br>Dec 15, 2020', '12:00', '06:00<br>Dec 16, 2020', '12:00', '06:00<br>Dec 17, 2020', '12:00', '06:00<br>Dec 18, 2020']
            },
            {
                range: ['2020-12-14 08:00', '2020-12-16 08:00'],
                positions: ['2020-12-14 12:00', '2020-12-15 06:00', '2020-12-15 12:00', '2020-12-16 06:00'],
                labels: ['12:00<br>Dec 14, 2020', '06:00<br>Dec 15, 2020', '12:00', '06:00<br>Dec 16, 2020']
            }
        ].forEach(function(t) {
            it('should position auto labels with rangebreaks | range:' + t.range, function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        hovertemplate: hovertemplate,
                        x: [
                            '2020-12-14 08:00', '2020-12-14 12:00', '2020-12-14 16:00',
                            '2020-12-15 08:00', '2020-12-15 12:00', '2020-12-15 16:00',
                            '2020-12-16 08:00', '2020-12-16 12:00', '2020-12-16 16:00',
                            '2020-12-17 08:00', '2020-12-17 12:00', '2020-12-17 16:00',
                            '2020-12-18 08:00', '2020-12-18 12:00', '2020-12-18 16:00',

                            '2020-12-21 08:00', '2020-12-21 12:00', '2020-12-21 16:00',
                            '2020-12-22 08:00', '2020-12-22 12:00', '2020-12-22 16:00',
                            '2020-12-23 08:00', '2020-12-23 12:00', '2020-12-23 16:00',
                            '2020-12-24 08:00', '2020-12-24 12:00', '2020-12-24 16:00',
                            '2020-12-25 08:00', '2020-12-25 12:00', '2020-12-25 16:00',

                            '2020-12-28 08:00', '2020-12-28 12:00', '2020-12-28 16:00',
                            '2020-12-29 08:00', '2020-12-29 12:00', '2020-12-29 16:00',
                            '2020-12-30 08:00', '2020-12-30 12:00', '2020-12-30 16:00',
                            '2020-12-31 08:00', '2020-12-31 12:00', '2020-12-31 16:00',
                            '2021-01-01 08:00', '2021-01-01 12:00', '2021-01-01 16:00',

                            '2021-01-04 08:00', '2021-01-04 12:00', '2021-01-04 16:00',
                            '2021-01-05 08:00', '2021-01-05 12:00', '2021-01-05 16:00',
                            '2021-01-06 08:00', '2021-01-06 12:00', '2021-01-06 16:00',
                            '2021-01-07 08:00', '2021-01-07 12:00', '2021-01-07 16:00',
                            '2021-01-08 08:00', '2021-01-08 12:00', '2021-01-08 16:00',

                            '2021-01-11 08:00', '2021-01-11 12:00', '2021-01-11 16:00',
                            '2021-01-12 08:00', '2021-01-12 12:00', '2021-01-12 16:00',
                            '2021-01-13 08:00', '2021-01-13 12:00', '2021-01-13 16:00',
                            '2021-01-14 08:00', '2021-01-14 12:00', '2021-01-14 16:00',
                            '2021-01-15 08:00', '2021-01-15 12:00', '2021-01-15 16:00',
                        ]
                    }],
                    layout: {
                        width: 1000,
                        xaxis: {
                            rangebreaks: [{
                                bounds: ['sat', 'mon']
                            }, {
                                bounds: [18, 6],
                                pattern: 'hour'
                            }],
                            ticklabelmode: 'period',
                            range: t.range
                        }
                    }
                })
                .then(function() {
                    _assert('', t.positions, t.labels);
                })
                .then(done, done.fail);
            });
        });

        [undefined, '%U', '%V', '%W'].forEach(function(tickformat) {
            it('with ' + tickformat + ' tickformat, should default tick0 on a Sunday when dtick is a round number of weeks', function(done) {
                var fig = {
                    data: [
                        {
                            showlegend: false,
                            type: 'bar',
                            width: ONEWEEK,
                            xperiod: ONEWEEK,
                            x: [
                                '2020-09-16',
                                '2020-09-24',
                                '2020-09-30'
                            ],
                            y: [3, 2, 4]
                        }
                    ],
                    layout: {
                        xaxis: {
                            tickformat: tickformat,
                            dtick: ONEWEEK,
                            ticklabelmode: 'period',
                            showgrid: true,
                        }
                    }
                };

                Plotly.newPlot(gd, fig)
                .then(function() {
                    expect(gd._fullLayout.xaxis.tick0).toBe('2000-01-02');
                })
                .then(done, done.fail);
            });
        });
    });

    describe('minor ticks"', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function _assert(expPositions) {
            var ax = gd._fullLayout.xaxis;

            // minor positions
            var positions =
                ax._vals
                    .filter(function(d) { return d.minor; })
                    .map(function(d) { return d.x; });

            expect(positions).toEqual(expPositions);
        }

        function _assertClose(expPositions) {
            var ax = gd._fullLayout.xaxis;

            // minor positions
            var positions =
                ax._vals
                    .filter(function(d) { return d.minor; })
                    .map(function(d) { return d.x; });

            expect(positions).toBeCloseToArray(expPositions, 3);
        }

        it('minor tickvals', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [10, 100]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            tickvals: [12, 34, 56, 78],
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 12, 34, 56, 78 ]);
            })
            .then(done, done.fail);
        });

        it('linear auto', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [10, 100]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 5, 10, 15, 25, 30, 35, 45, 50, 55, 65, 70, 75, 85, 90, 95, 105 ]);
            })
            .then(done, done.fail);
        });

        it('linear auto with defined minor nticks: 2', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [10, 100]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            nticks: 2,
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 10, 30, 50, 70, 90 ]);
            })
            .then(done, done.fail);
        });

        it('linear auto with defined minor nticks: 7', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [10, 100]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            nticks: 7,
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 5, 10, 15, 25, 30, 35, 45, 50, 55, 65, 70, 75, 85, 90, 95, 105 ]);
            })
            .then(done, done.fail);
        });

        it('linear auto with defined minor nticks: 10', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [10, 100]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            nticks: 10,
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 6, 8, 10, 12, 14, 16, 18, 22, 24, 26, 28, 30, 32, 34, 36, 38, 42, 44, 46, 48, 50, 52, 54, 56, 58, 62, 64, 66, 68, 70, 72, 74, 76, 78, 82, 84, 86, 88, 90, 92, 94, 96, 98, 102, 104 ]);
            })
            .then(done, done.fail);
        });

        it('linear auto with defined minor dtick: 2.5', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [10, 100]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            dtick: 2.5,
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 5, 7.5, 10, 12.5, 15, 17.5, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 42.5, 45, 47.5, 50, 52.5, 55, 57.5, 62.5, 65, 67.5, 70, 72.5, 75, 77.5, 82.5, 85, 87.5, 90, 92.5, 95, 97.5, 102.5, 105 ]);
            })
            .then(done, done.fail);
        });

        it('linear auto with defined major dtick: 10', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [10, 100]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        dtick: 10,
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 6, 8, 12, 14, 16, 18, 22, 24, 26, 28, 32, 34, 36, 38, 42, 44, 46, 48, 52, 54, 56, 58, 62, 64, 66, 68, 72, 74, 76, 78, 82, 84, 86, 88, 92, 94, 96, 98, 102, 104 ]);
            })
            .then(done, done.fail);
        });

        it('linear with defined major & minor dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [10, 100]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        dtick: 10,
                        minor: {
                            dtick: 5,
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105 ]);
            })
            .then(done, done.fail);
        });

        it('log auto - case 1', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [1, 10e20]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        type: 'log',
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ -1, 1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22 ]);
            })
            .then(done, done.fail);
        });

        it('log auto - case 2', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [1, 10e10]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        type: 'log',
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 1, 3, 5, 7, 9, 11 ]);
            })
            .then(done, done.fail);
        });

        it('log auto - case 3', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [1, 10e3]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        type: 'log',
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assertClose([ -0.22184874961635648, -0.1549019599857433, -0.09691001300805657, -0.04575749056067513, 0.4771212547196623, 0.6020599913279623, 0.7781512503836435, 0.8450980400142567, 0.9030899869919434, 0.9542425094393249, 1.4771212547196624, 1.6020599913279623, 1.7781512503836434, 1.8450980400142567, 1.9030899869919433, 1.9542425094393248, 2.477121254719662, 2.6020599913279625, 2.7781512503836434, 2.845098040014257, 2.9030899869919433, 2.9542425094393248, 3.477121254719662, 3.6020599913279625, 3.7781512503836434, 3.845098040014257, 3.9030899869919433, 3.9542425094393248 ]);
            })
            .then(done, done.fail);
        });

        it('log auto - case 4', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [1, 10]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        type: 'log',
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([]);
            })
            .then(done, done.fail);
        });

        it('log auto - case 5', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [1, 2]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        type: 'log',
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assertClose([ -0.017728766960431602, -0.00877392430750515, 0.008600171761917567, 0.017033339298780367, 0.025305865264770258, 0.03342375548694973, 0.049218022670181646, 0.056904851336472634, 0.06445798922691853, 0.07188200730612543, 0.08635983067474828, 0.09342168516223513, 0.10037054511756296, 0.10720996964786844, 0.12057393120584996, 0.1271047983648077, 0.13353890837021762, 0.13987908640123659, 0.15228834438305658, 0.15836249209524975, 0.1643528557844372, 0.17026171539495752, 0.18184358794477265, 0.18752072083646318, 0.1931245983544617, 0.1986570869544227, 0.20951501454263102, 0.21484384804769796, 0.22010808804005513, 0.22530928172586287, 0.23552844690754896, 0.24054924828259974, 0.24551266781414988, 0.250420002308894, 0.2600713879850748, 0.2648178230095364, 0.26951294421791616, 0.2741578492636797, 0.28330122870354935, 0.2878017299302258, 0.29225607135647574, 0.29666519026153076, 0.30535136944662333, 0.3096301674258983, 0.31386722036915293, 0.31806333496276107 ]);
            })
            .then(done, done.fail);
        });

        it('log with defined minor dtick: D2', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [1, 10e6]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        type: 'log',
                        minor: {
                            dtick: 'D2',
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assertClose([ -0.30102999566398125, 0.30102999566398114, 0.6989700043360187, 1.3010299956639813, 1.6989700043360187, 2.3010299956639813, 2.6989700043360187, 3.3010299956639813, 3.6989700043360187, 4.301029995663981, 4.698970004336019, 5.301029995663981, 5.698970004336019, 6.301029995663981, 6.698970004336019, 7.301029995663981 ]);
            })
            .then(done, done.fail);
        });

        it('log with defined minor dtick: L0.5', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [1, 10]
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        type: 'log',
                        minor: {
                            dtick: 'L0.5',
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assertClose([ 0.17609125905568124, 0.3979400086720376, 0.5440680443502756, 0.6532125137753436, 0.7403626894942437, 0.8129133566428552, 0.8750612633916998, 0.9294189257142923, 0.9777236052888472, 1.0211892990699374, 1.0413926851582243, 1.0606978403536107 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 10 years major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2050-01']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 883612800000, 1009843200000, 1072915200000, 1136073600000, 1199145600000, 1325376000000, 1388534400000, 1451606400000, 1514764800000, 1640995200000, 1704067200000, 1767225600000, 1830297600000, 1956528000000, 2019686400000, 2082758400000, 2145916800000, 2272147200000, 2335219200000, 2398377600000, 2461449600000, 2587680000000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 5 years major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2020-01']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 915148800000, 978307200000, 1009843200000, 1041379200000, 1072915200000, 1136073600000, 1167609600000, 1199145600000, 1230768000000, 1293840000000, 1325376000000, 1356998400000, 1388534400000, 1451606400000, 1483228800000, 1514764800000, 1546300800000, 1609459200000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 2 years major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2010-01']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 930787200000, 962409600000, 978307200000, 993945600000, 1025481600000, 1041379200000, 1057017600000, 1088640000000, 1104537600000, 1120176000000, 1151712000000, 1167609600000, 1183248000000, 1214870400000, 1230768000000, 1246406400000, 1277942400000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 1 year major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2005-01']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 938736000000, 954547200000, 962409600000, 970358400000, 986083200000, 993945600000, 1001894400000, 1017619200000, 1025481600000, 1033430400000, 1049155200000, 1057017600000, 1064966400000, 1080777600000, 1088640000000, 1096588800000, 1112313600000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of M6 major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2003-01']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 941414400000, 951868800000, 957139200000, 967766400000, 973036800000, 983404800000, 988675200000, 999302400000, 1004572800000, 1014940800000, 1020211200000, 1030838400000, 1036108800000, 1046476800000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of M3 major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2002-01']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 944006400000, 949363200000, 951868800000, 957139200000, 959817600000, 965088000000, 967766400000, 973036800000, 975628800000, 980985600000, 983404800000, 988675200000, 991353600000, 996624000000, 999302400000, 1004572800000, 1007164800000, 1012521600000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of M2 major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2001-01']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 949363200000, 954547200000, 959817600000, 965088000000, 970358400000, 975628800000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of M1 major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2000-06']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 2 weeks major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2000-04']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 947376000000, 948585600000, 949795200000, 951004800000, 952214400000, 953424000000, 954633600000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 1 week major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2000-02']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 946598400000, 946684800000, 946857600000, 946944000000, 947030400000, 947116800000, 947203200000, 947289600000, 947462400000, 947548800000, 947635200000, 947721600000, 947808000000, 947894400000, 948067200000, 948153600000, 948240000000, 948326400000, 948412800000, 948499200000, 948672000000, 948758400000, 948844800000, 948931200000, 949017600000, 949104000000, 949276800000, 949363200000, 949449600000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 3 days major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01-01', '2000-01-21']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 946598400000, 946684800000, 946857600000, 946944000000, 947116800000, 947203200000, 947376000000, 947462400000, 947635200000, 947721600000, 947894400000, 947980800000, 948153600000, 948240000000, 948412800000, 948499200000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 2 days major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01-01', '2000-01-11']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 946641600000, 946684800000, 946728000000, 946814400000, 946857600000, 946900800000, 946987200000, 947030400000, 947073600000, 947160000000, 947203200000, 947246400000, 947332800000, 947376000000, 947419200000, 947505600000, 947548800000, 947592000000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 1 day major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01-01', '2000-01-06']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 946663200000, 946706400000, 946728000000, 946749600000, 946792800000, 946814400000, 946836000000, 946879200000, 946900800000, 946922400000, 946965600000, 946987200000, 947008800000, 947052000000, 947073600000, 947095200000, 947138400000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 12 hours major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01-01', '2000-01-03']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 946677600000, 946692000000, 946699200000, 946713600000, 946720800000, 946735200000, 946742400000, 946756800000, 946764000000, 946778400000, 946785600000, 946800000000, 946807200000, 946821600000, 946828800000, 946843200000, 946850400000, 946864800000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 6 hours major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01-01', '2000-01-02 12:00']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 946677600000, 946692000000, 946699200000, 946713600000, 946720800000, 946735200000, 946742400000, 946756800000, 946764000000, 946778400000, 946785600000, 946800000000, 946807200000, 946821600000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 3 hours major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01-01', '2000-01-02']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 946681200000, 946688400000, 946692000000, 946699200000, 946702800000, 946710000000, 946713600000, 946720800000, 946724400000, 946731600000, 946735200000, 946742400000, 946746000000, 946753200000, 946756800000, 946764000000, 946767600000, 946774800000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of 2 hours major dtick', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01-01', '2000-01-01 10:00']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 946683000000, 946686600000, 946688400000, 946690200000, 946693800000, 946695600000, 946697400000, 946701000000, 946702800000, 946704600000, 946708200000, 946710000000, 946711800000, 946715400000, 946717200000, 946719000000, 946722600000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of M1 major dtick with weekly minor', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2000-06']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            dtick: ONEWEEK,
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 946166400000, 946771200000, 947376000000, 947980800000, 948585600000, 949190400000, 949795200000, 950400000000, 951004800000, 951609600000, 952214400000, 952819200000, 953424000000, 954028800000, 954633600000, 955238400000, 955843200000, 956448000000, 957052800000, 957657600000, 958262400000, 958867200000, 959472000000, 960076800000 ]);
            })
            .then(done, done.fail);
        });

        it('date auto - case of M1 major dtick with weekly minor start on Sunday', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['2000-01', '2000-06']
                }],
                layout: {
                    width: 1000,
                    xaxis: {
                        minor: {
                            tick0: '2001-01-02',
                            dtick: ONEWEEK,
                            showgrid: true
                        }
                    }
                }
            })
            .then(function() {
                _assert([ 946339200000, 946944000000, 947548800000, 948153600000, 948758400000, 949968000000, 950572800000, 951177600000, 951782400000, 952387200000, 952992000000, 953596800000, 954201600000, 954806400000, 955411200000, 956016000000, 956620800000, 957225600000, 957830400000, 958435200000, 959040000000, 959644800000, 960249600000 ]);
            })
            .then(done, done.fail);
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
    return utcFormat(format);
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

    var mock = require('../../image/mocks/tickformatstops.json');

    var mockCopy, gd;

    beforeEach(function() {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'x';
    });

    afterEach(destroyGraphDiv);

    it('handles zooming-in until milliseconds zoom level', function(done) {
        var promise = Plotly.newPlot(gd, mockCopy.data, mockCopy.layout);

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
        var promise = Plotly.newPlot(gd, mockCopy.data, mockCopy.layout);

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

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
            Fx.hover(gd, evt, 'xy');

            var hoverTrace = gd._hoverdata[0];
            var formatter = getFormatter(Axes.getTickFormat(gd._fullLayout.xaxis));

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(3);
            expect(hoverTrace.x).toEqual('2005-04-01');
            expect(hoverTrace.y).toEqual(0);

            expect(d3SelectAll('g.axistext').size()).toEqual(1);
            expect(d3SelectAll('g.hovertext').size()).toEqual(1);
            expect(d3SelectAll('g.axistext').select('text').html()).toEqual(formatter(new Date(hoverTrace.x)));
            expect(d3SelectAll('g.hovertext').select('text').html()).toEqual('0');
        })
        .then(done, done.fail);
    });

    it('doesn\'t fail on bad input', function(done) {
        var promise = Plotly.newPlot(gd, mockCopy.data, mockCopy.layout);

        [1, {a: 1, b: 2}, 'boo'].forEach(function(v) {
            promise = promise.then(function() {
                return Plotly.relayout(gd, {'xaxis.tickformatstops': v});
            }).then(function() {
                expect(gd._fullLayout.xaxis.tickformatstops).toBeUndefined();
            });
        });

        promise
        .then(done, done.fail);
    });
});

describe('Test template:', function() {
    'use strict';

    var gd;
    beforeEach(function() {
        gd = createGraphDiv();
    });
    afterEach(destroyGraphDiv);

    it('apply axis *type*, *rangebreaks* and *tickformatstops* from template', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                x: [1e10, 2e10, 3e10, 4e10, 5e10, 6e10, 7e10],
                y: [1, 2, 3, 4, 5, 6, 7]
            }],
            layout: {
                template: {
                    layout: {
                        xaxis: {
                            type: 'date',
                            rangebreaks: [{
                                name: 'name1', // N.B. should provide name
                                bounds: ['sat', 'mon']
                            }],
                            tickformatstops: [{
                                name: 'name2', // N.B. should provide name
                                enabled: true,
                                dtickrange: [1000, 60000],
                                value: '%H:%M:%S s'
                            }]
                        }
                    }
                }
            }
        })
        .then(function() {
            var xaxis = gd._fullLayout.xaxis;
            expect(xaxis.type).toBe('date');
            expect(xaxis.rangebreaks).not.toBe(undefined, 'rangebreaks');
            expect(xaxis.rangebreaks.length).toBe(1);
            expect(xaxis.tickformatstops).not.toBe(undefined, 'tickformatstops');
            expect(xaxis.tickformatstops.length).toBe(1);
        })
        .then(done, done.fail);
    });
});

describe('more react tests', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should sort catgories on matching axes using react and relink using relayout', function(done) {
        var fig = {
            data: [{
                yaxis: 'y',
                xaxis: 'x',
                y: [0, 0],
                x: ['A', 'Z']
            }, {
                yaxis: 'y2',
                xaxis: 'x2',
                y: [0, 0],
                x: ['A', 'Z']
            }],
            layout: {
                width: 400,
                height: 300,
                showlegend: false,
                xaxis: {
                    matches: 'x2',
                    domain: [ 0, 1]
                },
                yaxis: {
                    domain: [0.6, 1],
                    anchor: 'x'
                },
                xaxis2: {
                    domain: [0, 1],
                    anchor: 'y2'
                },
                yaxis2: {
                    domain: [0, 0.4],
                    anchor: 'x2'
                }
            }
        };

        Plotly.newPlot(gd, fig)
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['A', 'Z']);
            expect(gd._fullLayout.xaxis2._categories).toEqual(['A', 'Z']);
            expect(gd._fullLayout.xaxis._categoriesMap).toEqual({A: 0, Z: 1});
            expect(gd._fullLayout.xaxis2._categoriesMap).toEqual({A: 0, Z: 1});
        })
        .then(function() {
            // flip order
            fig.data[0].x = ['Z', 'A'];
            fig.data[1].x = ['Z', 'A'];

            return Plotly.react(gd, fig);
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['Z', 'A']);
            expect(gd._fullLayout.xaxis2._categories).toEqual(['Z', 'A']);
            expect(gd._fullLayout.xaxis._categoriesMap).toEqual({Z: 0, A: 1});
            expect(gd._fullLayout.xaxis2._categoriesMap).toEqual({Z: 0, A: 1});
        })
        .then(function() {
            // should get the same order with newPlot
            return Plotly.newPlot(gd, fig);
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['Z', 'A']);
            expect(gd._fullLayout.xaxis2._categories).toEqual(['Z', 'A']);
            expect(gd._fullLayout.xaxis._categoriesMap).toEqual({Z: 0, A: 1});
            expect(gd._fullLayout.xaxis2._categoriesMap).toEqual({Z: 0, A: 1});
        })
        .then(function() {
            // add new category
            fig.data[0].x = ['Z', 0, 'A'];
            fig.data[1].x = ['Z', 0, 'A'];
            fig.data[0].y = [1, 2, 3];
            fig.data[1].y = [2, 4, 6];

            return Plotly.react(gd, fig);
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['Z', '0', 'A']);
            expect(gd._fullLayout.xaxis2._categories).toEqual(['Z', '0', 'A']);
            expect(gd._fullLayout.xaxis._categoriesMap).toEqual({Z: 0, 0: 1, A: 2});
            expect(gd._fullLayout.xaxis2._categoriesMap).toEqual({Z: 0, 0: 1, A: 2});
        })
        .then(function() {
            // should get the same order with newPlot
            return Plotly.newPlot(gd, fig);
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['Z', '0', 'A']);
            expect(gd._fullLayout.xaxis2._categories).toEqual(['Z', '0', 'A']);
            expect(gd._fullLayout.xaxis._categoriesMap).toEqual({Z: 0, 0: 1, A: 2});
            expect(gd._fullLayout.xaxis2._categoriesMap).toEqual({Z: 0, 0: 1, A: 2});
        })
        .then(function() {
            // change data
            fig.data[0].x = ['Z', 0, 'A'];
            fig.data[1].x = ['A', 'Z'];
            fig.data[0].y = [3, 2, 1];
            fig.data[1].y = [-1, 0];

            return Plotly.react(gd, fig);
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['Z', '0', 'A']);
            expect(gd._fullLayout.xaxis2._categories).toEqual(['Z', '0', 'A']);
            expect(gd._fullLayout.xaxis._categoriesMap).toEqual({Z: 0, 0: 1, A: 2});
            expect(gd._fullLayout.xaxis2._categoriesMap).toEqual({Z: 0, 0: 1, A: 2});
        })
        .then(function() {
            // should get the same order with newPlot
            return Plotly.newPlot(gd, fig);
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['Z', '0', 'A']);
            expect(gd._fullLayout.xaxis2._categories).toEqual(['Z', '0', 'A']);
            expect(gd._fullLayout.xaxis._categoriesMap).toEqual({Z: 0, 0: 1, A: 2});
            expect(gd._fullLayout.xaxis2._categoriesMap).toEqual({Z: 0, 0: 1, A: 2});
        })
        .then(function() {
            // should get the same order with relayout
            return Plotly.relayout(gd, 'width', 600);
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['Z', '0', 'A']);
            expect(gd._fullLayout.xaxis2._categories).toEqual(['Z', '0', 'A']);
            expect(gd._fullLayout.xaxis._categoriesMap).toEqual({Z: 0, 0: 1, A: 2});
            expect(gd._fullLayout.xaxis2._categoriesMap).toEqual({Z: 0, 0: 1, A: 2});
        })
        .then(done, done.fail);
    });

    it('insiderange react to new data', function(done) {
        var layout = {
            xaxis: {
                insiderange: [0, 2]
            },
            yaxis: {
                ticklabelposition: 'inside'
            },
            plot_bgcolor: 'lightgray',
            width: 600,
            height: 600
        };

        var data1 = [{
            y: [1, 3, 2]
        }];

        var data2 = [{
            y: [1000, 3000, 2000]
        }];

        var fig1 = {data: data1, layout: layout};
        var fig2 = {data: data2, layout: layout};

        Plotly.newPlot(gd, fig1)
        .then(function() {
            expect(gd._fullLayout.xaxis.range).toBeCloseToArray([-0.110, 2]);

            return Plotly.react(gd, fig2);
        }).then(function() {
            expect(gd._fullLayout.xaxis.range).toBeCloseToArray([-0.164, 2]);
        }).then(done, done.fail);
    });
});

describe('category preservation tests on gd passed to Plotly.react()', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function _hover(gd, opts) {
        Fx.hover(gd, opts);
        // needed for successive hover events
        Lib.clearThrottle();
    }

    it('should preserve categories and axis ticklabels', function(done) {
        var fig = {
            data: [{
                type: 'bar',
                y: [3, 5, 3, 2],
                x: ['a', 'b', 'c', 'd']
            }],
            layout: {
                hovermode: 'x',
                width: 500,
                height: 500
            }
        };

        Plotly.newPlot(gd, fig)
        .then(function(gd) {
            return Plotly.react(gd, fig);
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['a', 'b', 'c', 'd']);
            expect(gd._fullLayout.xaxis._categoriesMap).toEqual({a: 0, b: 1, c: 2, d: 3});
        })
        .then(function() {
            _hover(gd, { xval: fig.data[0].x.indexOf('a') });
            expect(d3SelectAll('g.axistext').select('text').html()).toEqual('a');
        })
        .then(function() {
            _hover(gd, { xval: fig.data[0].x.indexOf('b') });
            expect(d3SelectAll('g.axistext').select('text').html()).toEqual('b');
        })
        .then(function() {
            _hover(gd, { xval: fig.data[0].x.indexOf('c') });
            expect(d3SelectAll('g.axistext').select('text').html()).toEqual('c');
        })
        .then(function() {
            _hover(gd, { xval: fig.data[0].x.indexOf('d') });
            expect(d3SelectAll('g.axistext').select('text').html()).toEqual('d');
        })

        .then(done, done.fail);
    });
});

describe('more matching axes tests', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should bypass non-string id when matching ids', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                x: [0, 1],
                y: [0, 1]
            }, {
                x: [0, 1],
                y: [1, 2],
                yaxis: 'y2'
            }],
            layout: {
                xaxis: {
                    anchor: 'y'
                },
                yaxis: {
                    anchor: 'x'
                },
                yaxis2: {
                    anchor: [], // bad input
                    position: 0.1,
                    overlaying: 'y'
                }
            }
        })
        .then(done, done.fail);
    });
});

describe('shift tests', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    function checkLine(selector, position) {
        var path = d3Select(gd).select(selector);
        var pos = (path.split('d="M')[1]).split(',')[0];
        expect(Number(pos)).toBeCloseTo(position, 2);
    }

    afterEach(destroyGraphDiv);

    it('should set y-axis shifts correctly on first draw when shift=true', function() {
        var fig = require('../../image/mocks/mult-yaxes-simple.json');
        Plotly.newPlot(gd, fig).then(function() {
            checkLine('path.xy3-y.crisp', 550);
            checkLine('path.xy4-y.crisp', 691);
            expect(gd._fullLayout.yaxis3._shift).toBeCloseTo(97, 2);
            expect(gd._fullLayout.yaxis4._shift).toBeCloseTo(243, 2);
        });
    });

    it('should set y-axis shifts correctly on first draw when shift=<numeric>', function() {
        var fig = require('../../image/mocks/mult-yaxes-manual-shift.json');
        Plotly.newPlot(gd, fig).then(function() {
            checkLine('path.xy3-y.crisp', 97);
            checkLine('path.xy4-y.crisp', 616);
            expect(gd._fullLayout.yaxis3._shift).toBeCloseTo(-100, 2);
            expect(gd._fullLayout.yaxis4._shift).toBeCloseTo(100, 2);
        });
    });
});
describe('test tickmode calculator', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function generateTickConfig() {
        var standardConfig = {tickmode: 'array', ticks: 'inside', ticklen: 1, showticklabels: false};

        // Number of ticks will be random
        Lib.seedPseudoRandom();
        var n = (Lib.pseudoRandom() * 99) + 1;
        var tickVals = [];
        for(var i = 0; i <= n; i++) {
            tickVals.push(i);
        }
        standardConfig.tickvals = tickVals;
        standardConfig.ticktext = tickVals;
        return standardConfig;
    }
    var ticksOff = {tickmode: 'array', ticks: '', tickvals: [], ticktext: [], ticklen: 0, showticklabels: false};

    function _assert(expLength) {
        var ax = gd._fullLayout.xaxis;

        // all positions
        var positions =
            ax._vals
                .filter(function(d) { return d; })
                .map(function(d) { return d.x; });

        expect(positions.length).toEqual(expLength);
    }

    describe('arrayTicks', function() {
        it('should return the specified correct number of major ticks and minor ticks', function(done) {
            var xMajorConfig = ticksOff;
            var xMinorConfig = ticksOff;
            xMajorConfig = generateTickConfig();
            xMinorConfig = generateTickConfig();
            xMajorConfig.range = [0, 1000];
            xMajorConfig.minor = xMinorConfig;
            Plotly.newPlot(gd, {
                data: [{
                    x: [0, 1],
                    y: [0, 1]
                }],
                layout: {
                    width: 400,
                    height: 400,
                    margin: {
                        t: 40,
                        b: 40,
                        l: 40,
                        r: 40
                    },
                    xaxis: xMajorConfig,
                }
            }).then(function() {
                _assert(xMajorConfig.tickvals.length + xMinorConfig.tickvals.length);
            }).then(done, done.fail);
        });
    });
});
