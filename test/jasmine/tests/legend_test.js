var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var DBLCLICKDELAY = require('@src/plot_api/plot_config').dfltConfig.doubleClickDelay;

var Legend = require('@src/components/legend');
var getLegendData = require('@src/components/legend/get_legend_data');
var helpers = require('@src/components/legend/helpers');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var delay = require('../assets/delay');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var assertPlotSize = require('../assets/custom_assertions').assertPlotSize;

var mock = require('@mocks/legend_horizontal.json');

var Drawing = require('@src/components/drawing');

describe('legend defaults', function() {
    'use strict';

    var supplyLayoutDefaults = Legend.supplyLayoutDefaults;

    var layoutIn, layoutOut, fullData;

    beforeEach(function() {
        layoutIn = {
            showlegend: true
        };
        layoutOut = {
            font: Plots.layoutAttributes.font,
            bg_color: Plots.layoutAttributes.bg_color
        };
    });

    function allShown(fullData) {
        return fullData.map(function(trace) {
            return Lib.extendDeep({
                visible: true,
                showlegend: true,
                _dfltShowLegend: true,
                _input: {}
            }, trace);
        });
    }

    it('hides by default if there is only one legend item by default', function() {
        fullData = allShown([
            {type: 'scatter'},
            {type: 'scatter', visible: false}, // ignored
            {type: 'contour', _dfltShowLegend: false, showlegend: false} // hidden by default
        ]);

        supplyLayoutDefaults({}, layoutOut, fullData);
        expect(layoutOut.showlegend).toBe(false);
    });

    it('shows if there are two legend items by default but only one is shown', function() {
        fullData = allShown([
            {type: 'scatter'},
            {type: 'scatter', showlegend: false} // not shown but still triggers legend
        ]);

        supplyLayoutDefaults({}, layoutOut, fullData);
        expect(layoutOut.showlegend).toBe(true);
    });

    it('hides if no items are actually shown', function() {
        fullData = allShown([
            {type: 'scatter', showlegend: false},
            {type: 'scatter', showlegend: false}
        ]);

        supplyLayoutDefaults({}, layoutOut, fullData);
        expect(layoutOut.showlegend).toBe(false);
    });

    it('shows with one visible pie', function() {
        fullData = allShown([
            {type: 'pie'}
        ]);

        supplyLayoutDefaults({}, layoutOut, fullData);
        expect(layoutOut.showlegend).toBe(true);
    });

    it('does not show with a hidden pie', function() {
        fullData = allShown([
            {type: 'pie', showlegend: false}
        ]);

        supplyLayoutDefaults({}, layoutOut, fullData);
        expect(layoutOut.showlegend).toBe(false);
    });

    it('shows if even a default hidden single item is explicitly shown', function() {
        fullData = allShown([
            {type: 'contour', _dfltShowLegend: false, _input: {showlegend: true}}
        ]);

        supplyLayoutDefaults({}, layoutOut, fullData);
        expect(layoutOut.showlegend).toBe(true);
    });

    it('should default traceorder to reversed for stack bar charts', function() {
        fullData = allShown([
            {type: 'bar', visible: 'legendonly'},
            {type: 'bar', visible: 'legendonly'},
            {type: 'scatter'}
        ]);

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('normal');

        layoutOut.barmode = 'stack';

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('reversed');
    });

    it('should default traceorder to reversed for filled tonext scatter charts', function() {
        fullData = allShown([
            {type: 'scatter'},
            {type: 'scatter', fill: 'tonexty'}
        ]);

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('reversed');
    });

    it('should default traceorder to grouped when a group is present', function() {
        fullData = allShown([
            {type: 'scatter', legendgroup: 'group'},
            {type: 'scatter'}
        ]);

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('grouped');

        fullData[1].fill = 'tonextx';

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('grouped+reversed');
    });

    it('does not consider invisible traces for traceorder default', function() {
        fullData = allShown([
            {type: 'bar', visible: false},
            {type: 'bar', visible: false},
            {type: 'scatter'}
        ]);

        layoutOut.barmode = 'stack';

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('normal');

        fullData = allShown([
            {type: 'scatter', legendgroup: 'group', visible: false},
            {type: 'scatter'}
        ]);

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('normal');
    });

    it('should default orientation to vertical', function() {
        supplyLayoutDefaults(layoutIn, layoutOut, []);
        expect(layoutOut.legend.orientation).toEqual('v');
    });

    it('should not coerce `title.font` and `title.side` if the `title.text` is blank', function() {
        var layoutWithTitle = Lib.extendDeep({
            legend: {
                title: {
                    text: ''
                }
            }
        }, layoutIn);
        supplyLayoutDefaults(layoutWithTitle, layoutOut, []);
        expect(layoutOut.legend.title.font).toEqual(undefined);
        expect(layoutOut.legend.title.side).toEqual(undefined);
    });

    it('should default `title.side` to *top* for vertical legends', function() {
        var layoutWithTitle = Lib.extendDeep({
            legend: {
                title: {
                    text: 'Legend Title'
                }
            }
        }, layoutIn);
        supplyLayoutDefaults(layoutWithTitle, layoutOut, []);
        expect(layoutOut.legend.title.side).toEqual('top');
    });

    it('should default `title.side` to *left* for horizontal legends', function() {
        var layoutWithTitle = Lib.extendDeep({
            legend: {
                orientation: 'h',
                title: {
                    text: 'Legend Title'
                }
            }
        }, layoutIn);
        supplyLayoutDefaults(layoutWithTitle, layoutOut, []);
        expect(layoutOut.legend.title.side).toEqual('left');
    });

    describe('for horizontal legends', function() {
        var layoutInForHorizontalLegends;

        beforeEach(function() {
            layoutInForHorizontalLegends = Lib.extendDeep({
                legend: {
                    orientation: 'h'
                },
                xaxis: {
                    rangeslider: {
                        visible: false
                    }
                }
            }, layoutIn);
        });

        it('should default position to bottom left', function() {
            supplyLayoutDefaults(layoutInForHorizontalLegends, layoutOut, []);
            expect(layoutOut.legend.x).toEqual(0);
            expect(layoutOut.legend.xanchor).toEqual('left');
            expect(layoutOut.legend.y).toEqual(-0.1);
            expect(layoutOut.legend.yanchor).toEqual('top');
        });

        it('should default position to top left if a range slider present', function() {
            var mockLayoutIn = Lib.extendDeep({}, layoutInForHorizontalLegends);
            mockLayoutIn.xaxis.rangeslider.visible = true;

            supplyLayoutDefaults(mockLayoutIn, layoutOut, []);
            expect(layoutOut.legend.x).toEqual(0);
            expect(layoutOut.legend.xanchor).toEqual('left');
            expect(layoutOut.legend.y).toEqual(1.1);
            expect(layoutOut.legend.yanchor).toEqual('bottom');
        });
    });
});

describe('legend getLegendData', function() {
    'use strict';

    var calcdata, opts, legendData, expected;

    it('should group legendgroup traces', function() {
        calcdata = [
            [{trace: {
                type: 'scatter',
                visible: true,
                legendgroup: 'group',
                showlegend: true

            }}],
            [{trace: {
                type: 'bar',
                visible: 'legendonly',
                legendgroup: '',
                showlegend: true
            }}],
            [{trace: {
                type: 'scatter',
                visible: true,
                legendgroup: 'group',
                showlegend: true
            }}]
        ];
        opts = {
            traceorder: 'grouped'
        };

        legendData = getLegendData(calcdata, opts);

        expected = [
            [
                [{trace: {
                    type: 'scatter',
                    visible: true,
                    legendgroup: 'group',
                    showlegend: true

                }}],
                [{trace: {
                    type: 'scatter',
                    visible: true,
                    legendgroup: 'group',
                    showlegend: true
                }}]
            ],
            [
                [{trace: {
                    type: 'bar',
                    visible: 'legendonly',
                    legendgroup: '',
                    showlegend: true
                }}]
            ]
        ];

        expect(legendData).toEqual(expected);
        expect(opts._lgroupsLength).toEqual(2);
    });

    it('should collapse when data has only one group', function() {
        calcdata = [
            [{trace: {
                type: 'scatter',
                visible: true,
                legendgroup: '',
                showlegend: true

            }}],
            [{trace: {
                type: 'bar',
                visible: 'legendonly',
                legendgroup: '',
                showlegend: true
            }}],
            [{trace: {
                type: 'scatter',
                visible: true,
                legendgroup: '',
                showlegend: true
            }}]
        ];
        opts = {
            traceorder: 'grouped'
        };

        legendData = getLegendData(calcdata, opts);

        expected = [
            [
                [{trace: {
                    type: 'scatter',
                    visible: true,
                    legendgroup: '',
                    showlegend: true

                }}],
                [{trace: {
                    type: 'bar',
                    visible: 'legendonly',
                    legendgroup: '',
                    showlegend: true
                }}],
                [{trace: {
                    type: 'scatter',
                    visible: true,
                    legendgroup: '',
                    showlegend: true
                }}]
            ]
        ];

        expect(legendData).toEqual(expected);
        expect(opts._lgroupsLength).toEqual(1);
    });

    it('should return empty array when legend data has no traces', function() {
        calcdata = [
            [{trace: {
                type: 'histogram',
                visible: true,
                legendgroup: '',
                showlegend: false

            }}],
            [{trace: {
                type: 'box',
                visible: 'legendonly',
                legendgroup: '',
                showlegend: false
            }}],
            [{trace: {
                type: 'heatmap',
                visible: true,
                legendgroup: ''
            }}]
        ];
        opts = {
            _main: true,
            traceorder: 'normal'
        };

        legendData = getLegendData(calcdata, opts);
        expect(legendData).toEqual([]);
    });

    it('should reverse the order when legend.traceorder is set', function() {
        calcdata = [
            [{trace: {
                type: 'scatter',
                visible: true,
                legendgroup: '',
                showlegend: true

            }}],
            [{trace: {
                type: 'bar',
                visible: 'legendonly',
                legendgroup: '',
                showlegend: true
            }}],
            [{trace: {
                type: 'box',
                visible: true,
                legendgroup: '',
                showlegend: true
            }}]
        ];
        opts = {
            traceorder: 'reversed'
        };

        legendData = getLegendData(calcdata, opts);

        expected = [
            [
                [{trace: {
                    type: 'box',
                    visible: true,
                    legendgroup: '',
                    showlegend: true

                }}],
                [{trace: {
                    type: 'bar',
                    visible: 'legendonly',
                    legendgroup: '',
                    showlegend: true
                }}],
                [{trace: {
                    type: 'scatter',
                    visible: true,
                    legendgroup: '',
                    showlegend: true
                }}]
            ]
        ];

        expect(legendData).toEqual(expected);
        expect(opts._lgroupsLength).toEqual(1);
    });

    it('should reverse the trace order within groups when reversed+grouped', function() {
        calcdata = [
            [{trace: {
                type: 'scatter',
                visible: true,
                legendgroup: 'group',
                showlegend: true

            }}],
            [{trace: {
                type: 'bar',
                visible: 'legendonly',
                legendgroup: '',
                showlegend: true
            }}],
            [{trace: {
                type: 'box',
                visible: true,
                legendgroup: 'group',
                showlegend: true
            }}]
        ];
        opts = {
            traceorder: 'reversed+grouped'
        };

        legendData = getLegendData(calcdata, opts);

        expected = [
            [
                [{trace: {
                    type: 'box',
                    visible: true,
                    legendgroup: 'group',
                    showlegend: true

                }}],
                [{trace: {
                    type: 'scatter',
                    visible: true,
                    legendgroup: 'group',
                    showlegend: true
                }}]
            ],
            [
                [{trace: {
                    type: 'bar',
                    visible: 'legendonly',
                    legendgroup: '',
                    showlegend: true
                }}]
            ]
        ];

        expect(legendData).toEqual(expected);
        expect(opts._lgroupsLength).toEqual(2);
    });
});

describe('legend helpers:', function() {
    'use strict';

    describe('isGrouped', function() {
        var isGrouped = helpers.isGrouped;

        it('should return true when trace is visible and supports legend', function() {
            expect(isGrouped({ traceorder: 'normal' })).toBe(false);
            expect(isGrouped({ traceorder: 'grouped' })).toBe(true);
            expect(isGrouped({ traceorder: 'reversed+grouped' })).toBe(true);
            expect(isGrouped({ traceorder: 'grouped+reversed' })).toBe(true);
            expect(isGrouped({ traceorder: 'reversed' })).toBe(false);
        });
    });

    describe('isReversed', function() {
        var isReversed = helpers.isReversed;

        it('should return true when trace is visible and supports legend', function() {
            expect(isReversed({ traceorder: 'normal' })).toBe(false);
            expect(isReversed({ traceorder: 'grouped' })).toBe(false);
            expect(isReversed({ traceorder: 'reversed+grouped' })).toBe(true);
            expect(isReversed({ traceorder: 'grouped+reversed' })).toBe(true);
            expect(isReversed({ traceorder: 'reversed' })).toBe(true);
        });
    });
});

describe('legend anchor utils:', function() {
    'use strict';

    describe('isRightAnchor', function() {
        var isRightAnchor = Lib.isRightAnchor;
        var threshold = 2 / 3;

        it('should return true when \'xanchor\' is set to \'right\'', function() {
            expect(isRightAnchor({ xanchor: 'left' })).toBe(false);
            expect(isRightAnchor({ xanchor: 'center' })).toBe(false);
            expect(isRightAnchor({ xanchor: 'right' })).toBe(true);
        });

        it('should return true when \'xanchor\' is set to \'auto\' and \'x\' >= 2/3', function() {
            var opts = { xanchor: 'auto' };

            [0, 0.4, 0.7, 1].forEach(function(v) {
                opts.x = v;
                expect(isRightAnchor(opts))
                    .toBe(v > threshold, 'case ' + v);
            });
        });
    });

    describe('isCenterAnchor', function() {
        var isCenterAnchor = Lib.isCenterAnchor;
        var threshold0 = 1 / 3;
        var threshold1 = 2 / 3;

        it('should return true when \'xanchor\' is set to \'center\'', function() {
            expect(isCenterAnchor({ xanchor: 'left' })).toBe(false);
            expect(isCenterAnchor({ xanchor: 'center' })).toBe(true);
            expect(isCenterAnchor({ xanchor: 'right' })).toBe(false);
        });

        it('should return true when \'xanchor\' is set to \'auto\' and 1/3 < \'x\' < 2/3', function() {
            var opts = { xanchor: 'auto' };

            [0, 0.4, 0.7, 1].forEach(function(v) {
                opts.x = v;
                expect(isCenterAnchor(opts))
                    .toBe(v > threshold0 && v < threshold1, 'case ' + v);
            });
        });
    });

    describe('isBottomAnchor', function() {
        var isBottomAnchor = Lib.isBottomAnchor;
        var threshold = 1 / 3;

        it('should return true when \'yanchor\' is set to \'right\'', function() {
            expect(isBottomAnchor({ yanchor: 'top' })).toBe(false);
            expect(isBottomAnchor({ yanchor: 'middle' })).toBe(false);
            expect(isBottomAnchor({ yanchor: 'bottom' })).toBe(true);
        });

        it('should return true when \'yanchor\' is set to \'auto\' and \'y\' <= 1/3', function() {
            var opts = { yanchor: 'auto' };

            [0, 0.4, 0.7, 1].forEach(function(v) {
                opts.y = v;
                expect(isBottomAnchor(opts))
                    .toBe(v < threshold, 'case ' + v);
            });
        });
    });

    describe('isMiddleAnchor', function() {
        var isMiddleAnchor = Lib.isMiddleAnchor;
        var threshold0 = 1 / 3;
        var threshold1 = 2 / 3;

        it('should return true when \'yanchor\' is set to \'center\'', function() {
            expect(isMiddleAnchor({ yanchor: 'top' })).toBe(false);
            expect(isMiddleAnchor({ yanchor: 'middle' })).toBe(true);
            expect(isMiddleAnchor({ yanchor: 'bottom' })).toBe(false);
        });

        it('should return true when \'yanchor\' is set to \'auto\' and 1/3 < \'y\' < 2/3', function() {
            var opts = { yanchor: 'auto' };

            [0, 0.4, 0.7, 1].forEach(function(v) {
                opts.y = v;
                expect(isMiddleAnchor(opts))
                    .toBe(v > threshold0 && v < threshold1, 'case ' + v);
            });
        });
    });
});

describe('legend relayout update', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });
    afterEach(destroyGraphDiv);

    it('should hide and show the legend', function(done) {
        var mockCopy = Lib.extendDeep({}, require('@mocks/0.json'), {layout: {
            legend: {x: 1.1, xanchor: 'left'},
            margin: {l: 50, r: 50, pad: 0},
            width: 500
        }});

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
        .then(function() {
            expect(d3SelectAll('g.legend').size()).toBe(1);
            // check that the margins changed
            assertPlotSize({widthLessThan: 400});
            return Plotly.relayout(gd, {showlegend: false});
        })
        .then(function() {
            expect(d3SelectAll('g.legend').size()).toBe(0);
            assertPlotSize({width: 400});
            return Plotly.relayout(gd, {showlegend: true});
        })
        .then(function() {
            expect(d3SelectAll('g.legend').size()).toBe(1);
            assertPlotSize({widthLessThan: 400});
            return Plotly.relayout(gd, {'legend.x': 0.7});
        })
        .then(function() {
            expect(d3SelectAll('g.legend').size()).toBe(1);
            assertPlotSize({width: 400});
        })
        .then(done, done.fail);
    });

    it('should update border styling', function(done) {
        var mockCopy = Lib.extendDeep({}, require('@mocks/0.json'));

        function assertLegendStyle(bgColor, borderColor, borderWidth) {
            var node = d3Select('g.legend').select('rect').node();

            expect(node.style.fill).toEqual(bgColor);
            expect(node.style.stroke).toEqual(borderColor);
            expect(node.style.strokeWidth).toEqual(borderWidth + 'px');
        }

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
            assertLegendStyle('rgb(255, 255, 255)', 'rgb(0, 0, 0)', 1);

            return Plotly.relayout(gd, {
                'legend.bordercolor': 'red',
                'legend.bgcolor': 'blue'
            });
        }).then(function() {
            assertLegendStyle('rgb(0, 0, 255)', 'rgb(255, 0, 0)', 1);

            return Plotly.relayout(gd, 'legend.borderwidth', 10);
        }).then(function() {
            assertLegendStyle('rgb(0, 0, 255)', 'rgb(255, 0, 0)', 10);

            return Plotly.relayout(gd, 'legend.bgcolor', null);
        }).then(function() {
            assertLegendStyle('rgb(255, 255, 255)', 'rgb(255, 0, 0)', 10);

            return Plotly.relayout(gd, 'paper_bgcolor', 'blue');
        }).then(function() {
            assertLegendStyle('rgb(0, 0, 255)', 'rgb(255, 0, 0)', 10);
        })
        .then(done, done.fail);
    });

    describe('should update legend valign', function() {
        function markerOffsetY() {
            var translate = Drawing.getTranslate(d3Select('.legend .traces .layers'));
            return translate.y;
        }

        it('it should translate markers', function(done) {
            var mockCopy = Lib.extendDeep({}, require('@mocks/legend_valign_top.json'));

            var top, middle, bottom;
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
            .then(function() {
                top = markerOffsetY();
                return Plotly.relayout(gd, 'legend.valign', 'middle');
            })
            .then(function() {
                middle = markerOffsetY();
                expect(middle).toBeGreaterThan(top);
                return Plotly.relayout(gd, 'legend.valign', 'bottom');
            })
            .then(function() {
                bottom = markerOffsetY();
                expect(bottom).toBeGreaterThan(middle);
            })
            .then(done, done.fail);
        });
    });

    describe('with legendgroup', function() {
        it('changes the margin size to fit tracegroupgap', function(done) {
            var mockCopy = Lib.extendDeep({}, require('@mocks/legendgroup_horizontal_wrapping.json'));
            Plotly.newPlot(gd, mockCopy)
            .then(function() {
                expect(gd._fullLayout._size.b).toBe(113);
                return Plotly.relayout(gd, 'legend.tracegroupgap', 70);
            })
            .then(function() {
                expect(gd._fullLayout._size.b).toBe(167);
                return Plotly.relayout(gd, 'legend.tracegroupgap', 10);
            })
            .then(function() {
                expect(gd._fullLayout._size.b).toBe(113);
            })
            .then(done, done.fail);
        });
    });

    it('should make legend fit in graph viewport', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/legend_negative_x.json'));

        function _assert(msg, xy, wh) {
            return function() {
                var fullLayout = gd._fullLayout;
                var legend3 = d3Select('g.legend');
                var bg3 = legend3.select('rect.bg');
                var translate = Drawing.getTranslate(legend3);
                var x = translate.x;
                var y = translate.y;
                var w = +bg3.attr('width');
                var h = +bg3.attr('height');
                expect([x, y]).toBeWithinArray(xy, 25, msg + '| legend x,y');
                expect([w, h]).toBeWithinArray(wh, 25, msg + '| legend w,h');
                expect(x + w <= fullLayout.width).toBe(true, msg + '| fits in x');
                expect(y + h <= fullLayout.height).toBe(true, msg + '| fits in y');
            };
        }

        Plotly.newPlot(gd, fig)
        .then(_assert('base', [5, 4.4], [512, 29]))
        .then(function() { return Plotly.relayout(gd, 'legend.x', 0.8); })
        .then(_assert('after relayout almost to right edge', [188, 4.4], [512, 29]))
        .then(done, done.fail);
    });

    it('should fit in graph viewport when changing legend.title.side', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/0.json'));
        fig.layout.legend = {
            title: {
                text: 'legend title'
            }
        };

        function _assert(msg, xy, wh) {
            return function() {
                var fullLayout = gd._fullLayout;
                var legend3 = d3Select('g.legend');
                var bg3 = legend3.select('rect.bg');
                var translate = Drawing.getTranslate(legend3);
                var x = translate.x;
                var y = translate.y;
                var w = +bg3.attr('width');
                var h = +bg3.attr('height');

                expect([x, y]).toBeWithinArray(xy, 25, msg + '| legend x,y');
                expect([w, h]).toBeWithinArray(wh, 25, msg + '| legend w,h');
                expect(x + w <= fullLayout.width).toBe(true, msg + '| fits in x');
                expect(y + h <= fullLayout.height).toBe(true, msg + '| fits in y');
            };
        }

        Plotly.newPlot(gd, fig)
        .then(_assert('base', [667.72, 60], [120, 83]))
        .then(function() { return Plotly.relayout(gd, 'legend.title.side', 'left'); })
        .then(_assert('after relayout to *left*', [607.54, 60], [180, 67]))
        .then(function() { return Plotly.relayout(gd, 'legend.title.side', 'top'); })
        .then(_assert('after relayout to *top*', [667.72, 60], [120, 83]))
        .then(done, done.fail);
    });

    it('should be able to clear legend title using react', function(done) {
        var data = [{
            type: 'scatter',
            x: [0, 1],
            y: [1, 0]
        }];

        Plotly.newPlot(gd, {
            data: data,
            layout: {
                showlegend: true,
                legend: {
                    title: {
                        text: 'legend<br>title'
                    }
                }
            }
        })
        .then(function() {
            expect(d3SelectAll('.legendtitletext')[0].length).toBe(1);
        })
        .then(function() {
            return Plotly.react(gd, {
                data: data,
                layout: {
                    showlegend: true
                }
            });
        })
        .then(function() {
            expect(d3SelectAll('.legendtitletext')[0].length).toBe(0);
        })
        .then(done, done.fail);
    });
});

describe('legend orientation change:', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('should update plot background', function(done) {
        var mock = require('@mocks/legend_horizontal_autowrap.json');
        var gd = createGraphDiv();
        var initialLegendBGColor;

        Plotly.newPlot(gd, mock.data, mock.layout).then(function() {
            initialLegendBGColor = gd._fullLayout.legend.bgcolor;
            return Plotly.relayout(gd, 'legend.bgcolor', '#000000');
        }).then(function() {
            expect(gd._fullLayout.legend.bgcolor).toBe('#000000');
            return Plotly.relayout(gd, 'legend.bgcolor', initialLegendBGColor);
        }).then(function() {
            expect(gd._fullLayout.legend.bgcolor).toBe(initialLegendBGColor);
        })
        .then(done, done.fail);
    });
});

describe('legend restyle update', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('should update trace toggle background rectangle', function(done) {
        var mock = require('@mocks/0.json');
        var mockCopy = Lib.extendDeep({}, mock);
        var gd = createGraphDiv();

        mockCopy.data[0].visible = false;
        mockCopy.data[0].showlegend = false;
        mockCopy.data[1].visible = false;
        mockCopy.data[1].showlegend = false;

        function countLegendItems() {
            return d3Select(gd).selectAll('rect.legendtoggle').size();
        }

        function assertTraceToggleRect() {
            var nodes = d3SelectAll('rect.legendtoggle');

            nodes.each(function() {
                var node = d3Select(this);

                expect(node.attr('x')).toEqual('0');
                expect(node.attr('y')).toEqual('-9.5');
                expect(node.attr('height')).toEqual('19');

                var w = +node.attr('width');
                expect(w).toBeWithin(113, 10);
            });
        }

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
            expect(countLegendItems()).toEqual(1);
            assertTraceToggleRect();

            return Plotly.restyle(gd, 'visible', [true, false, false]);
        }).then(function() {
            expect(countLegendItems()).toEqual(0);

            return Plotly.restyle(gd, 'showlegend', [true, false, false]);
        }).then(function() {
            expect(countLegendItems()).toEqual(1);
            assertTraceToggleRect();
        })
        .then(done, done.fail);
    });
});

describe('legend interaction', function() {
    'use strict';

    describe('pie chart', function() {
        var mockCopy, gd, legendItems, legendItem, legendLabels, legendLabel;
        var testEntry = 2;

        beforeAll(function(done) {
            var mock = require('@mocks/pie_simple.json');
            mockCopy = Lib.extendDeep({}, mock);
            gd = createGraphDiv();

            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
                legendItems = d3SelectAll('rect.legendtoggle')[0];
                legendLabels = d3SelectAll('text.legendtext')[0];
                legendItem = legendItems[testEntry];
                legendLabel = legendLabels[testEntry].innerHTML;
                done();
            });
        });

        afterAll(destroyGraphDiv);

        describe('single click', function() {
            it('should hide slice', function(done) {
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                setTimeout(function() {
                    expect(gd._fullLayout.hiddenlabels.length).toBe(1);
                    expect(gd._fullLayout.hiddenlabels[0]).toBe(legendLabel);
                    done();
                }, DBLCLICKDELAY + 20);
            });

            it('should fade legend item', function() {
                expect(+legendItem.parentNode.style.opacity).toBeLessThan(1);
            });

            it('should unhide slice', function(done) {
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                setTimeout(function() {
                    expect(gd._fullLayout.hiddenlabels.length).toBe(0);
                    done();
                }, DBLCLICKDELAY + 20);
            });

            it('should unfade legend item', function() {
                expect(+legendItem.parentNode.style.opacity).toBe(1);
            });
        });

        describe('double click', function() {
            it('should hide other slices', function(done) {
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                setTimeout(function() {
                    expect(gd._fullLayout.hiddenlabels.length).toBe((legendItems.length - 1));
                    expect(gd._fullLayout.hiddenlabels.indexOf(legendLabel)).toBe(-1);
                    done();
                }, 20);
            });

            it('should fade other legend items', function() {
                var legendItemi;
                for(var i = 0; i < legendItems.length; i++) {
                    legendItemi = legendItems[i];
                    if(i === testEntry) {
                        expect(+legendItemi.parentNode.style.opacity).toBe(1);
                    } else {
                        expect(+legendItemi.parentNode.style.opacity).toBeLessThan(1);
                    }
                }
            });

            it('should unhide all slices', function(done) {
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                setTimeout(function() {
                    expect(gd._fullLayout.hiddenlabels.length).toBe(0);
                    done();
                }, 20);
            });

            it('should unfade legend items', function() {
                var legendItemi;
                for(var i = 0; i < legendItems.length; i++) {
                    legendItemi = legendItems[i];
                    expect(+legendItemi.parentNode.style.opacity).toBe(1);
                }
            });
        });
    });

    describe('non-pie chart', function() {
        var mockCopy, gd, legendItems, legendItem;
        var testEntry = 2;

        beforeAll(function(done) {
            var mock = require('@mocks/29.json');
            mockCopy = Lib.extendDeep({}, mock);
            gd = createGraphDiv();

            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
                legendItems = d3SelectAll('rect.legendtoggle')[0];
                legendItem = legendItems[testEntry];
                done();
            });
        });

        afterAll(destroyGraphDiv);

        describe('single click', function() {
            it('should hide series', function(done) {
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                setTimeout(function() {
                    expect(gd.data[2].visible).toBe('legendonly');
                    done();
                }, DBLCLICKDELAY + 20);
            });

            it('should fade legend item', function() {
                expect(+legendItem.parentNode.style.opacity).toBeLessThan(1);
            });

            it('should unhide series', function(done) {
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                setTimeout(function() {
                    expect(gd.data[2].visible).toBe(true);
                    done();
                }, DBLCLICKDELAY + 20);
            });

            it('should unfade legend item', function() {
                expect(+legendItem.parentNode.style.opacity).toBe(1);
            });
        });

        describe('double click', function() {
            it('should hide series', function(done) {
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                setTimeout(function() {
                    for(var i = 0; i < legendItems.length; i++) {
                        if(i === testEntry) {
                            expect(gd.data[i].visible).toBe(true);
                        } else {
                            expect(gd.data[i].visible).toBe('legendonly');
                        }
                    }
                    done();
                }, 20);
            });

            it('should fade legend item', function() {
                var legendItemi;
                for(var i = 0; i < legendItems.length; i++) {
                    legendItemi = legendItems[i];
                    if(i === testEntry) {
                        expect(+legendItemi.parentNode.style.opacity).toBe(1);
                    } else {
                        expect(+legendItemi.parentNode.style.opacity).toBeLessThan(1);
                    }
                }
            });

            it('should unhide series', function(done) {
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                legendItem.dispatchEvent(new MouseEvent('mousedown'));
                legendItem.dispatchEvent(new MouseEvent('mouseup'));
                setTimeout(function() {
                    for(var i = 0; i < legendItems.length; i++) {
                        expect(gd.data[i].visible).toBe(true);
                    }
                    done();
                }, 20);
            });

            it('should unfade legend items', function() {
                var legendItemi;
                for(var i = 0; i < legendItems.length; i++) {
                    legendItemi = legendItems[i];
                    expect(+legendItemi.parentNode.style.opacity).toBe(1);
                }
            });
        });
    });

    describe('carpet plots', function() {
        afterAll(destroyGraphDiv);

        function _click(index) {
            return function() {
                var item = d3SelectAll('rect.legendtoggle')[0][index || 0];
                return new Promise(function(resolve) {
                    item.dispatchEvent(new MouseEvent('mousedown'));
                    item.dispatchEvent(new MouseEvent('mouseup'));
                    setTimeout(resolve, DBLCLICKDELAY + 20);
                });
            };
        }

        function _dblclick(index) {
            return function() {
                var item = d3SelectAll('rect.legendtoggle')[0][index || 0];
                return new Promise(function(resolve) {
                    item.dispatchEvent(new MouseEvent('mousedown'));
                    item.dispatchEvent(new MouseEvent('mouseup'));
                    item.dispatchEvent(new MouseEvent('mousedown'));
                    item.dispatchEvent(new MouseEvent('mouseup'));
                    setTimeout(resolve, 20);
                });
            };
        }

        function assertVisible(gd, expectation) {
            var actual = gd._fullData.map(function(trace) { return trace.visible; });
            expect(actual).toEqual(expectation);
        }

        it('should ignore carpet traces when toggling', function(done) {
            var _mock = Lib.extendDeep({}, require('@mocks/cheater.json'));
            var gd = createGraphDiv();

            Plotly.newPlot(gd, _mock).then(function() {
                assertVisible(gd, [true, true, true, true]);
            })
            .then(_click(0))
            .then(function() {
                assertVisible(gd, [true, 'legendonly', true, true]);
            })
            .then(_click(0))
            .then(function() {
                assertVisible(gd, [true, true, true, true]);
            })
            .then(_dblclick(0))
            .then(function() {
                assertVisible(gd, [true, true, 'legendonly', 'legendonly']);
            })
            .then(_dblclick(0))
            .then(function() {
                assertVisible(gd, [true, true, true, true]);
            })
            .then(done, done.fail);
        });
    });

    describe('editable mode interactions', function() {
        var gd;

        var mock = {
            data: [{
                x: [1, 2, 3],
                y: [5, 4, 3]
            }, {
                x: [1, 2, 3, 4, 5, 6, 7, 8],
                y: [1, 3, 2, 4, 3, 5, 4, 6],
                transforms: [{
                    type: 'groupby',
                    groups: [1, 2, 1, 2, 3, 4, 3, 4]
                }]
            }],
            config: {editable: true}
        };

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.newPlot(gd, Lib.extendDeep({}, mock)).then(done);
        });

        afterEach(destroyGraphDiv);

        function _setValue(index, str) {
            var item = d3SelectAll('text.legendtext')[0][index || 0];
            item.dispatchEvent(new MouseEvent('click'));
            return delay(20)().then(function() {
                var input = d3Select('.plugin-editable.editable');
                input.text(str);
                input.node().dispatchEvent(new KeyboardEvent('blur'));
            }).then(delay(20));
        }

        function assertLabels(expected) {
            var labels = [];
            d3SelectAll('text.legendtext').each(function() {
                labels.push(this.textContent);
            });
            expect(labels).toEqual(expected);
        }

        it('sets and unsets trace group names', function(done) {
            assertLabels(['trace 0', '1 (trace 1)', '2 (trace 1)', '3 (trace 1)', '4 (trace 1)']);
            // Set the name of the first trace:
            _setValue(0, 'foo').then(function() {
                expect(gd.data[0].name).toEqual('foo');
                // labels shorter than half the longest get padded with spaces to match the longest length
                assertLabels(['foo        ', '1 (trace 1)', '2 (trace 1)', '3 (trace 1)', '4 (trace 1)']);

                // Set the name of the third legend item:
                return _setValue(3, 'barbar');
            }).then(function() {
                expect(gd.data[1].transforms[0].styles).toEqual([
                    {value: {name: 'barbar'}, target: 3}
                ]);
                assertLabels(['foo        ', '1 (trace 1)', '2 (trace 1)', 'barbar', '4 (trace 1)']);

                return _setValue(2, 'asdf');
            }).then(function() {
                expect(gd.data[1].transforms[0].styles).toEqual([
                    {value: {name: 'barbar'}, target: 3},
                    {value: {name: 'asdf'}, target: 2}
                ]);
                assertLabels(['foo        ', '1 (trace 1)', 'asdf       ', 'barbar', '4 (trace 1)']);

                // Clear the group names:
                return _setValue(3, '');
            }).then(function() {
                assertLabels(['foo        ', '1 (trace 1)', 'asdf       ', '           ', '4 (trace 1)']);
                return _setValue(2, '');
            }).then(function() {
                // Verify the group names have been cleared:
                expect(gd.data[1].transforms[0].styles).toEqual([
                    {target: 3, value: {name: ''}},
                    {target: 2, value: {name: ''}}
                ]);
                assertLabels(['foo        ', '1 (trace 1)', '           ', '           ', '4 (trace 1)']);

                return _setValue(0, '');
            }).then(function() {
                expect(gd.data[0].name).toEqual('');
                assertLabels(['           ', '1 (trace 1)', '           ', '           ', '4 (trace 1)']);

                return _setValue(0, 'boo~~~');
            }).then(function() {
                expect(gd.data[0].name).toEqual('boo~~~');
                assertLabels(['boo~~~', '1 (trace 1)', '           ', '           ', '4 (trace 1)']);

                return _setValue(2, 'hoo');
            }).then(function() {
                expect(gd.data[1].transforms[0].styles).toEqual([
                    {target: 3, value: {name: ''}},
                    {target: 2, value: {name: 'hoo'}}
                ]);
                assertLabels(['boo~~~', '1 (trace 1)', 'hoo        ', '           ', '4 (trace 1)']);
            }).then(done, done.fail);
        });
    });

    describe('staticPlot', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function toggleTrace() {
            var toggle = d3Select('.legendtoggle').node();
            expect(toggle).not.toEqual(null);

            toggle.dispatchEvent(new MouseEvent('mousedown'));
            toggle.dispatchEvent(new MouseEvent('mouseup'));

            // Delay needs to be long enough for Plotly to react
            return delay(300)();
        }

        function assertToggled(toggled) {
            return function() {
                var container = d3Select('g.traces').node();
                expect(container).not.toEqual(null);
                expect(container.style.opacity).toBe(toggled ? '0.5' : '1');
            };
        }

        it('should prevent toggling if set', function(done) {
            var data = [{ x: [0, 1], y: [0, 1], type: 'scatter' }];
            var layout = { showlegend: true };
            var config = { staticPlot: true };

            Plotly.newPlot(gd, data, layout, config)
                .then(toggleTrace)
                .then(assertToggled(false))
                .then(done, done.fail);
        });
    });

    describe('visible toggle', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        var data = [
            {y: [1, 2, 1]},
            {y: [2, 1, 2]},
            {y: [2, 3, 4]}
        ];

        // we need to click on the drag cover to truly test this,
        function clickAt(p) {
            return function() {
                return new Promise(function(resolve) {
                    var el = d3Select('g.legend').node();
                    var opts = {element: el};
                    mouseEvent('mousedown', p[0], p[1], opts);
                    mouseEvent('mouseup', p[0], p[1], opts);
                    setTimeout(resolve, DBLCLICKDELAY + 20);
                });
            };
        }

        function assertVisible(expectation) {
            return function() {
                var actual = gd._fullData.map(function(t) { return t.visible; });
                expect(actual).toEqual(expectation);
            };
        }

        var specs = [{
            orientation: 'h',
            edits: {legendPosition: true},
            clickPos: [[118, 469], [212, 469], [295, 469]]
        }, {
            orientation: 'h',
            edits: {legendPosition: true, legendText: true},
            clickPos: [[118, 469], [212, 469], [295, 469]]
        }, {
            orientation: 'v',
            edits: {legendPosition: true},
            clickPos: [[430, 114], [430, 131], [430, 153]]
        }, {
            orientation: 'v',
            edits: {legendPosition: true, legendText: true},
            clickPos: [[430, 114], [430, 131], [430, 153]]
        }];

        specs.forEach(function(s) {
            var msg = s.orientation + ' - ' + JSON.stringify(s.edits);

            it('should find correct bounding box (case ' + msg + ')', function(done) {
                Plotly.newPlot(gd,
                    Lib.extendDeep([], data),
                    {legend: {orientation: s.orientation}, width: 500, height: 500},
                    {edits: s.edits}
                )
                .then(assertVisible([true, true, true]))
                .then(clickAt(s.clickPos[0]))
                .then(assertVisible(['legendonly', true, true]))
                .then(clickAt(s.clickPos[1]))
                .then(assertVisible(['legendonly', 'legendonly', true]))
                .then(clickAt(s.clickPos[2]))
                .then(assertVisible(['legendonly', 'legendonly', 'legendonly']))
                .then(done, done.fail);
            });
        });
    });

    describe('legend visibility interactions', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function click(index, clicks) {
            return function() {
                return new Promise(function(resolve) {
                    var item = d3SelectAll('rect.legendtoggle')[0][index || 0];
                    for(var i = 0; i < (clicks || 1); i++) {
                        item.dispatchEvent(new MouseEvent('mousedown'));
                        item.dispatchEvent(new MouseEvent('mouseup'));
                    }
                    setTimeout(resolve, DBLCLICKDELAY + 100);
                });
            };
        }

        function extractVisibilities(data) {
            return data.map(function(trace) { return trace.visible; });
        }

        function assertVisible(expectation) {
            return function() {
                var actual = extractVisibilities(gd._fullData);
                expect(actual).toEqual(expectation);
            };
        }

        describe('for regular traces', function() {
            beforeEach(function(done) {
                Plotly.newPlot(gd, [
                    {x: [1, 2], y: [0, 1], visible: false},
                    {x: [1, 2], y: [1, 2], visible: 'legendonly'},
                    {x: [1, 2], y: [2, 3]}
                ]).then(done);
            });

            it('clicking once toggles legendonly -> true', function(done) {
                Promise.resolve()
                    .then(assertVisible([false, 'legendonly', true]))
                    .then(click(0))
                    .then(assertVisible([false, true, true]))
                    .then(done, done.fail);
            });

            it('clicking once toggles true -> legendonly', function(done) {
                Promise.resolve()
                    .then(assertVisible([false, 'legendonly', true]))
                    .then(click(1))
                    .then(assertVisible([false, 'legendonly', 'legendonly']))
                    .then(done, done.fail);
            });

            it('double-clicking isolates a visible trace ', function(done) {
                Promise.resolve()
                    .then(click(0))
                    .then(assertVisible([false, true, true]))
                    .then(click(0, 2))
                    .then(assertVisible([false, true, 'legendonly']))
                    .then(done, done.fail);
            });

            it('double-clicking an isolated trace shows all non-hidden traces', function(done) {
                Promise.resolve()
                    .then(click(0, 2))
                    .then(assertVisible([false, true, true]))
                    .then(done, done.fail);
            });
        });

        describe('legendgroup visibility', function() {
            beforeEach(function(done) {
                Plotly.newPlot(gd, [{
                    x: [1, 2],
                    y: [3, 4],
                    visible: false
                }, {
                    x: [1, 2, 3, 4],
                    y: [0, 1, 2, 3],
                    legendgroup: 'foo'
                }, {
                    x: [1, 2, 3, 4],
                    y: [1, 3, 2, 4],
                }, {
                    x: [1, 2, 3, 4],
                    y: [1, 3, 2, 4],
                    legendgroup: 'foo'
                }]).then(done);
            });

            it('toggles the visibility of legendgroups as a whole', function(done) {
                Promise.resolve()
                    .then(click(1))
                    .then(assertVisible([false, 'legendonly', true, 'legendonly']))
                    .then(click(1))
                    .then(assertVisible([false, true, true, true]))
                    .then(done, done.fail);
            });

            it('isolates legendgroups as a whole', function(done) {
                Promise.resolve()
                    .then(click(1, 2))
                    .then(assertVisible([false, true, 'legendonly', true]))
                    .then(click(1, 2))
                    .then(assertVisible([false, true, true, true]))
                    .then(done, done.fail);
            });
        });

        describe('legend visibility toggles with groupby', function() {
            beforeEach(function(done) {
                Plotly.newPlot(gd, [{
                    x: [1, 2],
                    y: [3, 4],
                    visible: false
                }, {
                    x: [1, 2, 3, 4],
                    y: [0, 1, 2, 3]
                }, {
                    x: [1, 2, 3, 4],
                    y: [1, 3, 2, 4],
                    transforms: [{
                        type: 'groupby',
                        groups: ['a', 'b', 'c', 'c']
                    }]
                }, {
                    x: [1, 2, 3, 4],
                    y: [1, 3, 2, 4],
                    transforms: [{
                        type: 'groupby',
                        groups: ['a', 'b', 'c', 'c']
                    }]
                }]).then(done);
            });

            it('computes the initial visibility correctly', function(done) {
                Promise.resolve()
                    .then(assertVisible([false, true, true, true, true, true, true, true]))
                    .then(done, done.fail);
            });

            it('toggles the visibility of a non-groupby trace in the presence of groupby traces', function(done) {
                Promise.resolve()
                    .then(click(1))
                    .then(assertVisible([false, true, 'legendonly', true, true, true, true, true]))
                    .then(click(1))
                    .then(assertVisible([false, true, true, true, true, true, true, true]))
                    .then(done, done.fail);
            });

            it('toggles the visibility of the first group in a groupby trace', function(done) {
                Promise.resolve()
                    .then(click(0))
                    .then(assertVisible([false, 'legendonly', true, true, true, true, true, true]))
                    .then(click(0))
                    .then(assertVisible([false, true, true, true, true, true, true, true]))
                    .then(done, done.fail);
            });

            it('toggles the visibility of the third group in a groupby trace', function(done) {
                Promise.resolve()
                    .then(click(3))
                    .then(assertVisible([false, true, true, true, 'legendonly', true, true, true]))
                    .then(click(3))
                    .then(assertVisible([false, true, true, true, true, true, true, true]))
                    .then(done, done.fail);
            });

            it('double-clicking isolates a non-groupby trace', function(done) {
                Promise.resolve()
                    .then(click(0, 2))
                    .then(assertVisible([false, true, 'legendonly', 'legendonly', 'legendonly', 'legendonly', 'legendonly', 'legendonly']))
                    .then(click(0, 2))
                    .then(assertVisible([false, true, true, true, true, true, true, true]))
                    .then(done, done.fail);
            });

            it('double-clicking isolates a groupby trace', function(done) {
                Promise.resolve()
                    .then(click(1, 2))
                    .then(assertVisible([false, 'legendonly', true, 'legendonly', 'legendonly', 'legendonly', 'legendonly', 'legendonly']))
                    .then(click(1, 2))
                    .then(assertVisible([false, true, true, true, true, true, true, true]))
                    .then(done, done.fail);
            });
        });

        describe('legend visibility with *showlegend:false* traces', function() {
            beforeEach(function(done) {
                Plotly.newPlot(gd, [
                    {y: [1, 2, 3]},
                    {y: [2, 3, 1]},
                    {type: 'heatmap', z: [[1, 2], [3, 4]], showscale: false}
                ])
                .then(done);
            });

            it('isolate trace in legend, ignore trace that is not in legend', function(done) {
                Promise.resolve()
                    .then(click(0, 2))
                    .then(assertVisible([true, 'legendonly', true]))
                    .then(click(0, 2))
                    .then(assertVisible([true, true, true]))
                    .then(done, done.fail);
            });

            it('isolate trace in legend, ignore trace that is not in legend (2)', function(done) {
                Promise.resolve()
                    .then(click(1, 2))
                    .then(assertVisible(['legendonly', true, true]))
                    .then(click(1, 2))
                    .then(assertVisible([true, true, true]))
                    .then(done, done.fail);
            });

            it('isolate trace in legend AND trace in associated legendgroup', function(done) {
                Plotly.restyle(gd, 'legendgroup', ['group', '', 'group'])
                    .then(click(0, 2))
                    .then(assertVisible([true, 'legendonly', true]))
                    .then(click(0, 2))
                    .then(assertVisible([true, true, true]))
                    .then(done, done.fail);
            });

            it('isolate trace in legend, hide trace not in legend that has set legendgroup', function(done) {
                Plotly.restyle(gd, 'legendgroup', ['group', '', 'group'])
                    .then(click(1, 2))
                    .then(assertVisible(['legendonly', true, 'legendonly']))
                    .then(click(1, 2))
                    .then(assertVisible([true, true, true]))
                    .then(done, done.fail);
            });
        });

        describe('custom legend click/doubleclick handlers', function() {
            var fig, to;

            beforeEach(function() {
                fig = Lib.extendDeep({}, require('@mocks/0.json'));
            });

            afterEach(function() {
                clearTimeout(to);
            });

            function setupFail() {
                to = setTimeout(function() {
                    fail('did not trigger plotly_legendclick');
                }, 2 * DBLCLICKDELAY);
            }

            it('should call custom click handler before default handler', function(done) {
                Plotly.newPlot(gd, fig).then(function() {
                    var gotCalled = false;

                    gd.on('plotly_legendclick', function(d) {
                        gotCalled = true;
                        expect(extractVisibilities(d.fullData)).toEqual([true, true, true]);
                        expect(extractVisibilities(gd._fullData)).toEqual([true, true, true]);
                    });
                    gd.on('plotly_restyle', function() {
                        expect(extractVisibilities(gd._fullData)).toEqual([true, 'legendonly', true]);
                        if(gotCalled) done();
                    });
                    setupFail();
                })
                .then(click(1, 1))
                .catch(failTest);
            });

            it('should call custom doubleclick handler before default handler', function(done) {
                Plotly.newPlot(gd, fig).then(function() {
                    var gotCalled = false;

                    gd.on('plotly_legenddoubleclick', function(d) {
                        gotCalled = true;
                        expect(extractVisibilities(d.fullData)).toEqual([true, true, true]);
                        expect(extractVisibilities(gd._fullData)).toEqual([true, true, true]);
                    });
                    gd.on('plotly_restyle', function() {
                        expect(extractVisibilities(gd._fullData)).toEqual(['legendonly', true, 'legendonly']);
                        if(gotCalled) done();
                    });
                    setupFail();
                })
                .then(click(1, 2))
                .catch(failTest);
            });

            it('should not call default click handler if custom handler return *false*', function(done) {
                Plotly.newPlot(gd, fig).then(function() {
                    gd.on('plotly_legendclick', function(d) {
                        Plotly.relayout(gd, 'title', 'just clicked on trace #' + d.curveNumber);
                        return false;
                    });
                    gd.on('plotly_relayout', function(d) {
                        expect(typeof d).toBe('object');
                        expect(d.title).toBe('just clicked on trace #2');
                        done();
                    });
                    gd.on('plotly_restyle', function() {
                        fail('should not have triggered plotly_restyle');
                    });
                    setupFail();
                })
                .then(click(2, 1))
                .catch(failTest);
            });

            it('should not call default doubleclick handle if custom handler return *false*', function(done) {
                Plotly.newPlot(gd, fig).then(function() {
                    gd.on('plotly_legenddoubleclick', function(d) {
                        Plotly.relayout(gd, 'title', 'just double clicked on trace #' + d.curveNumber);
                        return false;
                    });
                    gd.on('plotly_relayout', function(d) {
                        expect(typeof d).toBe('object');
                        expect(d.title).toBe('just double clicked on trace #0');
                        done();
                    });
                    gd.on('plotly_restyle', function() {
                        fail('should not have triggered plotly_restyle');
                    });
                    setupFail();
                })
                .then(click(0, 2))
                .catch(failTest);
            });
        });

        describe('legend click/doubleclick event data', function() {
            function _assert(act, exp) {
                for(var k in exp) {
                    if(k === 'event' || k === 'node') {
                        expect(act[k]).toBeDefined();
                    } else if(k === 'group') {
                        expect(act[k]).toEqual(exp[k]);
                    } else {
                        expect(act[k]).toBe(exp[k], 'key ' + k);
                    }
                }

                expect(Object.keys(act).length)
                    .toBe(Object.keys(exp).length, '# of keys');
            }

            function clickAndCheck(clickArg, exp) {
                Lib.extendFlat(exp, {
                    event: true,
                    node: true,
                    data: gd.data,
                    layout: gd.layout,
                    frames: gd._transitionData._frames,
                    config: gd._context,
                    fullData: gd._fullData,
                    fullLayout: gd._fullLayout
                });

                var evtName = {
                    1: 'plotly_legendclick',
                    2: 'plotly_legenddoubleclick'
                }[clickArg[1]];

                return new Promise(function(resolve, reject) {
                    var hasBeenCalled = false;

                    var to = setTimeout(function() {
                        reject('did not trigger ' + evtName);
                    }, 2 * DBLCLICKDELAY);

                    function done() {
                        if(hasBeenCalled) {
                            clearTimeout(to);
                            resolve();
                        }
                    }

                    gd.once(evtName, function(d) {
                        hasBeenCalled = true;
                        _assert(d, exp);
                    });

                    gd.once('plotly_restyle', done);
                    gd.once('plotly_relayout', done);

                    click(clickArg[0], clickArg[1])();
                });
            }

            it('should have correct keys (base case)', function(done) {
                Plotly.newPlot(gd, [{
                    x: [1, 2, 3, 4, 5],
                    y: [1, 2, 1, 2, 3]
                }], {
                    showlegend: true
                })
                .then(function() {
                    return clickAndCheck([0, 1], {
                        curveNumber: 0,
                        expandedIndex: 0
                    });
                })
                .then(function() {
                    return clickAndCheck([0, 2], {
                        curveNumber: 0,
                        expandedIndex: 0
                    });
                })
                .then(done, done.fail);
            });

            it('should have correct keys (groupby case)', function(done) {
                Plotly.newPlot(gd, [{
                    x: [1, 2, 3, 4, 5],
                    y: [1, 2, 1, 2, 3],
                    transforms: [{
                        type: 'groupby',
                        groups: ['a', 'b', 'b', 'a', 'b']
                    }]
                }, {
                    x: [1, 2, 3, 4, 5],
                    y: [1, 2, 1, 2, 3],
                }])
                .then(function() {
                    return clickAndCheck([1, 1], {
                        curveNumber: 0,
                        expandedIndex: 1,
                        group: 'b'
                    });
                })
                .then(function() {
                    return clickAndCheck([2, 2], {
                        curveNumber: 1,
                        expandedIndex: 2
                    });
                })
                .then(done, done.fail);
            });

            it('should have correct keys (pie case)', function(done) {
                Plotly.newPlot(gd, [{
                    type: 'pie',
                    labels: ['A', 'B', 'C', 'D'],
                    values: [1, 2, 1, 3]
                }])
                .then(function() {
                    return clickAndCheck([0, 1], {
                        curveNumber: 0,
                        expandedIndex: 0,
                        label: 'D'
                    });
                })
                .then(function() {
                    return clickAndCheck([2, 2], {
                        curveNumber: 0,
                        expandedIndex: 0,
                        label: 'A'
                    });
                })
                .then(done, done.fail);
            });
        });

        describe('should honor *itemclick* and *itemdoubleclick* settings', function() {
            var _assert;

            function run() {
                return Promise.resolve()
                    .then(click(0, 1)).then(_assert(['legendonly', true, true]))
                    .then(click(0, 1)).then(_assert([true, true, true]))
                    .then(click(0, 2)).then(_assert([true, 'legendonly', 'legendonly']))
                    .then(click(0, 2)).then(_assert([true, true, true]))
                    .then(function() {
                        return Plotly.relayout(gd, {
                            'legend.itemclick': false,
                            'legend.itemdoubleclick': false
                        });
                    })
                    .then(delay(100))
                    .then(click(0, 1)).then(_assert([true, true, true]))
                    .then(click(0, 2)).then(_assert([true, true, true]))
                    .then(function() {
                        return Plotly.relayout(gd, {
                            'legend.itemclick': 'toggleothers',
                            'legend.itemdoubleclick': 'toggle'
                        });
                    })
                    .then(delay(100))
                    .then(click(0, 1)).then(_assert([true, 'legendonly', 'legendonly']))
                    .then(click(0, 1)).then(_assert([true, true, true]))
                    .then(click(0, 2)).then(_assert(['legendonly', true, true]))
                    .then(click(0, 2)).then(_assert([true, true, true]));
            }

            it('- regular trace case', function(done) {
                _assert = assertVisible;

                Plotly.newPlot(gd, [
                    { y: [1, 2, 1] },
                    { y: [2, 1, 2] },
                    { y: [3, 5, 0] }
                ])
                .then(run)
                .then(done, done.fail);
            }, 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

            it('- pie case', function(done) {
                _assert = function(_exp) {
                    return function() {
                        var exp = [];
                        if(_exp[0] === 'legendonly') exp.push('C');
                        if(_exp[1] === 'legendonly') exp.push('B');
                        if(_exp[2] === 'legendonly') exp.push('A');
                        expect(gd._fullLayout.hiddenlabels || []).toEqual(exp);
                    };
                };

                Plotly.newPlot(gd, [{
                    type: 'pie',
                    labels: ['A', 'B', 'C'],
                    values: [1, 2, 3]
                }])
                .then(run)
                .then(done, done.fail);
            }, 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);
        });
    });
});

describe('legend DOM', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('draws `legendtoggle` last to make sure it is unobstructed', function(done) {
        var gd = createGraphDiv();
        Plotly.newPlot(gd, mock)
        .then(function() {
            // Find legend in figure
            var legend = document.getElementsByClassName('legend')[0];

            // For each legend item
            var legendItems = legend.getElementsByClassName('traces');
            Array.prototype.slice.call(legendItems).forEach(function(legendItem) {
                // Check that the last element is our `legendtoggle`
                var lastEl = legendItem.children[legendItem.children.length - 1];
                expect(lastEl.getAttribute('class')).toBe('legendtoggle');
            });
        })
        .then(done, done.fail);
    });
});

describe('legend with custom doubleClickDelay', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function click(index) {
        return function() {
            var item = d3SelectAll('rect.legendtoggle')[0][index];
            item.dispatchEvent(new MouseEvent('mousedown'));
            item.dispatchEvent(new MouseEvent('mouseup'));
        };
    }

    it('should differentiate clicks and double-clicks according *doubleClickDelay* config', function(done) {
        var tLong = 1.5 * DBLCLICKDELAY;
        var tShort = 0.75 * DBLCLICKDELAY;

        var clickCnt = 0;
        var dblClickCnt = 0;
        var newPlot = function(fig) {
            return Plotly.newPlot(gd, fig).then(function() {
                gd.on('plotly_legendclick', function() { clickCnt++; });
                gd.on('plotly_legenddoubleclick', function() { dblClickCnt++; });
            });
        };

        function _assert(msg, _clickCnt, _dblClickCnt) {
            return function() {
                expect(clickCnt).toBe(_clickCnt, msg + '| clickCnt');
                expect(dblClickCnt).toBe(_dblClickCnt, msg + '| dblClickCnt');
                clickCnt = 0;
                dblClickCnt = 0;
            };
        }

        newPlot({
            data: [
                {y: [1, 2, 1]},
                {y: [2, 1, 2]}
            ],
            layout: {},
            config: {
                doubleClickDelay: tLong
            }
        })
        .then(click(0)).then(delay(tLong / 2))
        .then(_assert('[long] after click + (t/2) delay', 1, 0))
        .then(delay(tLong + 10))
        .then(click(0)).then(delay(DBLCLICKDELAY + 1)).then(click(0))
        .then(_assert('[long] after click + (DBLCLICKDELAY+1) delay + click', 2, 1))
        .then(delay(tLong + 10))
        .then(click(0)).then(delay(1.1 * tLong)).then(click(0))
        .then(_assert('[long] after click + (1.1*t) delay + click', 2, 0))
        .then(delay(tLong + 10))
        .then(function() {
            return newPlot({
                data: gd.data,
                layout: gd.layout,
                config: {doubleClickDelay: tShort}
            });
        })
        .then(click(0)).then(delay(tShort / 2))
        .then(_assert('[short] after click + (t/2) delay', 1, 0))
        .then(delay(tShort + 10))
        .then(click(0)).then(delay(DBLCLICKDELAY + 1)).then(click(0))
        .then(_assert('[short] after click + (DBLCLICKDELAY+1) delay + click', 2, 0))
        .then(delay(tShort + 10))
        .then(click(0)).then(delay(1.1 * tShort)).then(click(0))
        .then(_assert('[short] after click + (1.1*t) delay + click', 2, 0))
        .then(done, done.fail);
    }, 3 * jasmine.DEFAULT_TIMEOUT_INTERVAL);
});
