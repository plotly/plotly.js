var Legend = require('@src/components/legend');
var Plots = require('@src/plots/plots');

var helpers = require('@src/components/legend/helpers');
describe('Test legend:', function() {
    'use strict';

    describe('supplyLayoutDefaults', function() {
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

    });

    describe('getLegendData', function() {
        var getLegendData = Legend.getLegendData;

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

    describe('legendGetsTraces helper', function() {
        var legendGetsTrace = helpers.legendGetsTrace;

        it('should return true when trace is visible and supports legend', function() {
            expect(legendGetsTrace({ visible: true, type: 'bar' })).toBe(true);
            expect(legendGetsTrace({ visible: false, type: 'bar' })).toBe(false);
            expect(legendGetsTrace({ visible: true, type: 'contour' })).toBe(false);
            expect(legendGetsTrace({ visible: false, type: 'contour' })).toBe(false);
        });
    });

    describe('isGrouped helper', function() {
        var isGrouped = helpers.isGrouped;

        it('should return true when trace is visible and supports legend', function() {
            expect(isGrouped({ traceorder: 'normal' })).toBe(false);
            expect(isGrouped({ traceorder: 'grouped' })).toBe(true);
            expect(isGrouped({ traceorder: 'reversed+grouped' })).toBe(true);
            expect(isGrouped({ traceorder: 'grouped+reversed' })).toBe(true);
            expect(isGrouped({ traceorder: 'reversed' })).toBe(false);
        });
    });

    describe('isReversed helper', function() {
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
