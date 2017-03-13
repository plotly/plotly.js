var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var DBLCLICKDELAY = require('@src/constants/interactions').DBLCLICKDELAY;

var Legend = require('@src/components/legend');
var getLegendData = require('@src/components/legend/get_legend_data');
var helpers = require('@src/components/legend/helpers');
var anchorUtils = require('@src/components/legend/anchor_utils');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customMatchers = require('../assets/custom_matchers');


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

    it('should default traceorder to reversed for stack bar charts', function() {
        fullData = [
            { type: 'bar' },
            { type: 'bar' },
            { type: 'scatter' }
        ];

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('normal');

        layoutOut.barmode = 'stack';

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('reversed');
    });

    it('should default traceorder to reversed for filled tonext scatter charts', function() {
        fullData = [
            { type: 'scatter' },
            { type: 'scatter', fill: 'tonexty' }
        ];

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('reversed');
    });

    it('should default traceorder to grouped when a group is present', function() {
        fullData = [
            { type: 'scatter', legendgroup: 'group' },
            { type: 'scatter'}
        ];

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('grouped');

        fullData[1].fill = 'tonextx';

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.legend.traceorder).toEqual('grouped+reversed');
    });

    it('should default orientation to vertical', function() {
        supplyLayoutDefaults(layoutIn, layoutOut, []);
        expect(layoutOut.legend.orientation).toEqual('v');
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

    describe('legendGetsTraces', function() {
        var legendGetsTrace = helpers.legendGetsTrace;

        it('should return true when trace is visible and supports legend', function() {
            expect(legendGetsTrace({ visible: true, type: 'bar' })).toBe(true);
            expect(legendGetsTrace({ visible: false, type: 'bar' })).toBe(false);
            expect(legendGetsTrace({ visible: true, type: 'contour' })).toBe(false);
            expect(legendGetsTrace({ visible: false, type: 'contour' })).toBe(false);
        });
    });

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
        var isRightAnchor = anchorUtils.isRightAnchor;
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
        var isCenterAnchor = anchorUtils.isCenterAnchor;
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
        var isBottomAnchor = anchorUtils.isBottomAnchor;
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
        var isMiddleAnchor = anchorUtils.isMiddleAnchor;
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
    'use strict';

    afterEach(destroyGraphDiv);

    it('should update border styling', function(done) {
        var mock = require('@mocks/0.json'),
            mockCopy = Lib.extendDeep({}, mock),
            gd = createGraphDiv();

        function assertLegendStyle(bgColor, borderColor, borderWidth) {
            var node = d3.select('g.legend').select('rect');

            expect(node.style('fill')).toEqual(bgColor);
            expect(node.style('stroke')).toEqual(borderColor);
            expect(node.style('stroke-width')).toEqual(borderWidth + 'px');
        }

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
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

            done();
        });
    });
});

describe('legend orientation change:', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('should update plot background', function(done) {
        var mock = require('@mocks/legend_horizontal_autowrap.json'),
            gd = createGraphDiv(),
            initialLegendBGColor;

        Plotly.plot(gd, mock.data, mock.layout).then(function() {
            initialLegendBGColor = gd._fullLayout.legend.bgcolor;
            return Plotly.relayout(gd, 'legend.bgcolor', '#000000');
        }).then(function() {
            expect(gd._fullLayout.legend.bgcolor).toBe('#000000');
            return Plotly.relayout(gd, 'legend.bgcolor', initialLegendBGColor);
        }).then(function() {
            expect(gd._fullLayout.legend.bgcolor).toBe(initialLegendBGColor);
            done();
        });
    });
});

describe('legend restyle update', function() {
    'use strict';

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    afterEach(destroyGraphDiv);

    it('should update trace toggle background rectangle', function(done) {
        var mock = require('@mocks/0.json'),
            mockCopy = Lib.extendDeep({}, mock),
            gd = createGraphDiv();

        mockCopy.data[0].visible = false;
        mockCopy.data[0].showlegend = false;
        mockCopy.data[1].visible = false;
        mockCopy.data[1].showlegend = false;

        function countLegendItems() {
            return d3.select(gd).selectAll('rect.legendtoggle').size();
        }

        function assertTraceToggleRect() {
            var nodes = d3.selectAll('rect.legendtoggle');

            nodes.each(function() {
                var node = d3.select(this);

                expect(node.attr('x')).toEqual('0');
                expect(node.attr('y')).toEqual('-9.5');
                expect(node.attr('height')).toEqual('19');

                var w = +node.attr('width');
                expect(Math.abs(w - 160)).toBeLessThan(10);
            });
        }

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            expect(countLegendItems()).toEqual(1);
            assertTraceToggleRect();

            return Plotly.restyle(gd, 'visible', [true, false, false]);
        }).then(function() {
            expect(countLegendItems()).toEqual(0);

            return Plotly.restyle(gd, 'showlegend', [true, false, false]);
        }).then(function() {
            expect(countLegendItems()).toEqual(1);
            assertTraceToggleRect();

            done();
        });
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

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                legendItems = d3.selectAll('rect.legendtoggle')[0];
                legendLabels = d3.selectAll('text.legendtext')[0];
                legendItem = legendItems[testEntry];
                legendLabel = legendLabels[testEntry].innerHTML;
                done();
            });
        });
        afterAll(function() {
            destroyGraphDiv();
        });
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

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                legendItems = d3.selectAll('rect.legendtoggle')[0];
                legendItem = legendItems[testEntry];
                done();
            });
        });
        afterAll(function() {
            destroyGraphDiv();
        });

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
});
