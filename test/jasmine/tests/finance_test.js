var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var supplyAllDefaults = require('../assets/supply_defaults');
var failTest = require('../assets/fail_test');

var mock0 = {
    open: [33.01, 33.31, 33.50, 32.06, 34.12, 33.05, 33.31, 33.50],
    high: [34.20, 34.37, 33.62, 34.25, 35.18, 33.25, 35.37, 34.62],
    low: [31.70, 30.75, 32.87, 31.62, 30.81, 32.75, 32.75, 32.87],
    close: [34.10, 31.93, 33.37, 33.18, 31.18, 33.10, 32.93, 33.70]
};

var mock1 = Lib.extendDeep({}, mock0, {
    x: [
        '2016-09-01', '2016-09-02', '2016-09-03', '2016-09-04',
        '2016-09-05', '2016-09-06', '2016-09-07', '2016-09-10'
    ]
});

describe('finance charts defaults:', function() {
    'use strict';

    function _supply(data, layout) {
        var gd = {
            data: data,
            layout: layout
        };

        supplyAllDefaults(gd);

        return gd;
    }

    it('should generated the correct number of full traces', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc'
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'candlestick'
        });

        var out = _supply([trace0, trace1]);

        expect(out.data.length).toEqual(2);
        // not sure this test is really necessary anymore, since these are real traces...
        expect(out._fullData.length).toEqual(2);
    });

    it('should not mutate user data', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc'
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'candlestick'
        });

        var out = _supply([trace0, trace1]);
        expect(out.data[0]).toBe(trace0);
        expect(out.data[0].transforms).toBeUndefined();
        expect(out.data[1]).toBe(trace1);
        expect(out.data[1].transforms).toBeUndefined();

        // ... and in an idempotent way

        var out2 = _supply(out.data);
        expect(out2.data[0]).toBe(trace0);
        expect(out2.data[0].transforms).toBeUndefined();
        expect(out2.data[1]).toBe(trace1);
        expect(out2.data[1].transforms).toBeUndefined();
    });

    it('should work with transforms', function() {
        var trace0 = Lib.extendDeep({}, mock1, {
            type: 'ohlc',
            transforms: [{
                type: 'filter'
            }]
        });

        var trace1 = Lib.extendDeep({}, mock0, {
            type: 'candlestick',
            transforms: [{
                type: 'filter'
            }]
        });

        var out = _supply([trace0, trace1]);

        expect(out.data.length).toEqual(2);
        expect(out._fullData.length).toEqual(2);

        var transformTypesIn = out.data.map(function(trace) {
            return trace.transforms.map(function(opts) {
                return opts.type;
            });
        });

        expect(transformTypesIn).toEqual([ ['filter'], ['filter'] ]);

        var transformTypesOut = out._fullData.map(function(fullTrace) {
            return fullTrace.transforms.map(function(opts) {
                return opts.type;
            });
        });

        expect(transformTypesOut).toEqual([ ['filter'], ['filter'] ]);
    });

    it('should not slice data arrays but record minimum supplied length', function() {

        function assertDataLength(trace, fullTrace, len) {
            expect(fullTrace.visible).toBe(true);

            expect(fullTrace._length).toBe(len);

            expect(fullTrace.open).toBe(trace.open);
            expect(fullTrace.close).toBe(trace.close);
            expect(fullTrace.high).toBe(trace.high);
            expect(fullTrace.low).toBe(trace.low);
        }

        var trace0 = Lib.extendDeep({}, mock0, { type: 'ohlc' });
        trace0.open = [33.01, 33.31, 33.50, 32.06, 34.12];

        var trace1 = Lib.extendDeep({}, mock1, { type: 'candlestick' });
        trace1.x = ['2016-09-01', '2016-09-02', '2016-09-03', '2016-09-04'];

        var out = _supply([trace0, trace1]);

        assertDataLength(trace0, out._fullData[0], 5);
        assertDataLength(trace1, out._fullData[1], 4);

        expect(out._fullData[0]._fullInput.x).toBeUndefined();
        expect(out._fullData[1]._fullInput.x).toBeDefined();
    });

    it('should set visible to *false* when a component (other than x) is missing', function() {
        var trace0 = Lib.extendDeep({}, mock0, { type: 'ohlc' });
        trace0.close = undefined;

        var trace1 = Lib.extendDeep({}, mock1, { type: 'candlestick' });
        trace1.high = null;

        var out = _supply([trace0, trace1]);

        expect(out.data.length).toEqual(2);
        expect(out._fullData.length).toEqual(2);

        var visibilities = out._fullData.map(function(fullTrace) {
            return fullTrace.visible;
        });

        expect(visibilities).toEqual([false, false]);
    });

    it('should return visible: false if any data component is empty', function() {
        ['ohlc', 'candlestick'].forEach(function(type) {
            ['open', 'high', 'low', 'close', 'x'].forEach(function(attr) {
                var trace = Lib.extendDeep({}, mock1, {type: type});
                trace[attr] = [];
                var out = _supply([trace]);
                expect(out._fullData[0].visible).toBe(false, type + ' - ' + attr);
            });
        });
    });

    it('direction *showlegend* should be inherited from trace-wide *showlegend*', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
            showlegend: false,
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'candlestick',
            showlegend: false,
            increasing: { showlegend: true },
            decreasing: { showlegend: true }
        });

        var out = _supply([trace0, trace1]);

        var visibilities = out._fullData.map(function(fullTrace) {
            return fullTrace.showlegend;
        });

        expect(visibilities).toEqual([false, false]);
    });

    it('direction *name* should be ignored if there\'s a trace-wide *name*', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
            name: 'Company A'
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'candlestick',
            name: 'Company B',
            increasing: { name: 'B - UP' },
            decreasing: { name: 'B - DOWN' }
        });

        var out = _supply([trace0, trace1]);

        var names = out._fullData.map(function(fullTrace) {
            return fullTrace.name;
        });

        expect(names).toEqual([
            'Company A',
            'Company B'
        ]);
    });

    it('trace *name* default should make reference to user data trace indices', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc'
        });

        var trace1 = { type: 'scatter' };

        var trace2 = Lib.extendDeep({}, mock1, {
            type: 'candlestick',
        });

        var trace3 = { type: 'bar' };

        var out = _supply([trace0, trace1, trace2, trace3]);

        var names = out._fullData.map(function(fullTrace) {
            return fullTrace.name;
        });

        expect(names).toEqual([
            'trace 0',
            'trace 1',
            'trace 2',
            'trace 3'
        ]);
    });

    it('trace-wide styling should set default for corresponding per-direction styling', function() {
        function assertLine(cont, width, dash) {
            expect(cont.line.width).toEqual(width);
            if(dash) expect(cont.line.dash).toEqual(dash);
        }

        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
            line: { width: 1, dash: 'dash' },
            decreasing: { line: { dash: 'dot' } }
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'candlestick',
            line: { width: 3 },
            increasing: { line: { width: 0 } }
        });

        var out = _supply([trace0, trace1]);

        var fullData = out._fullData;
        assertLine(fullData[0].increasing, 1, 'dash');
        assertLine(fullData[0].decreasing, 1, 'dot');
        assertLine(fullData[1].increasing, 0);
        assertLine(fullData[1].decreasing, 3);
    });

    it('trace-wide *visible* should work', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
            visible: 'legendonly'
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'candlestick',
            visible: false
        });

        var out = _supply([trace0, trace1]);

        var visibilities = out._fullData.map(function(fullTrace) {
            return fullTrace.visible;
        });

        // only three items here as visible: false traces are not transformed

        expect(visibilities).toEqual(['legendonly', false]);
    });

    it('should add a few layout settings by default', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc'
        });

        var layout0 = {};

        var out0 = _supply([trace0], layout0);

        expect(out0.layout.xaxis.rangeslider).toBeDefined();
        expect(out0._fullLayout.xaxis.rangeslider.visible).toBe(true);

        var trace1 = Lib.extendDeep({}, mock0, {
            type: 'candlestick'
        });

        var layout1 = {
            xaxis: { rangeslider: { visible: false }}
        };

        var out1 = _supply([trace1], layout1);

        expect(out1.layout.xaxis.rangeslider).toBeDefined();
        expect(out1._fullLayout.xaxis.rangeslider.visible).toBe(false);
    });

    it('pushes layout.calendar to all output traces', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc'
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'candlestick'
        });

        var out = _supply([trace0, trace1], {calendar: 'nanakshahi'});


        out._fullData.forEach(function(fullTrace) {
            expect(fullTrace.xcalendar).toBe('nanakshahi');
        });
    });

    it('accepts a calendar per input trace', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
            xcalendar: 'hebrew'
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'candlestick',
            xcalendar: 'julian'
        });

        var out = _supply([trace0, trace1], {calendar: 'nanakshahi'});


        out._fullData.forEach(function(fullTrace, i) {
            expect(fullTrace.xcalendar).toBe(i < 1 ? 'hebrew' : 'julian');
        });
    });

    it('should make empty candlestick traces autotype to *linear* (as opposed to real box traces)', function() {
        var trace0 = { type: 'candlestick' };
        var out = _supply([trace0], { xaxis: {} });

        expect(out._fullLayout.xaxis.type).toEqual('linear');
    });
});

describe('finance charts calc', function() {
    'use strict';

    function calcDatatoTrace(calcTrace) {
        return calcTrace[0].trace;
    }

    function _calcGd(data, layout) {
        var gd = {
            data: data,
            layout: layout || {}
        };

        supplyAllDefaults(gd);
        Plots.doCalcdata(gd);
        gd.calcdata.forEach(function(cd) {
            // fill in some stuff that happens during crossTraceCalc or plot
            if(cd[0].trace.type === 'candlestick') {
                var diff = cd[1].pos - cd[0].pos;
                cd[0].t.wHover = diff / 2;
                cd[0].t.bdPos = diff / 4;
            }
        });
        return gd;
    }

    function _calcRaw(data, layout) {
        return _calcGd(data, layout).calcdata;
    }

    function _calc(data, layout) {
        return _calcRaw(data, layout).map(calcDatatoTrace);
    }

    // add some points that shouldn't make it into calcdata because
    // one of o, h, l, c is not numeric
    function addJunk(trace) {
        // x filtering happens in other ways
        if(trace.x) trace.x.push(1, 1, 1, 1);

        trace.open.push('', 1, 1, 1);
        trace.high.push(1, null, 1, 1);
        trace.low.push(1, 1, [1], 1);
        trace.close.push(1, 1, 1, 'close');
    }

    function mapGet(array, attr) {
        return array.map(function(di) { return di[attr]; });
    }

    it('should fill when *x* is not present', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
        });
        addJunk(trace0);

        var trace1 = Lib.extendDeep({}, mock0, {
            type: 'candlestick',
        });
        addJunk(trace1);

        var out = _calcRaw([trace0, trace1]);
        var indices = [0, 1, 2, 3, 4, 5, 6, 7];
        var i = 'increasing';
        var d = 'decreasing';
        var directions = [i, d, d, i, d, i, d, i];

        expect(mapGet(out[0], 'pos')).toEqual(indices);
        expect(mapGet(out[0], 'dir')).toEqual(directions);
        expect(mapGet(out[1], 'pos')).toEqual(indices);
        expect(mapGet(out[1], 'dir')).toEqual(directions);
    });

    it('should work with *filter* transforms', function() {
        var trace0 = Lib.extendDeep({}, mock1, {
            type: 'ohlc',
            tickwidth: 0.05,
            transforms: [{
                type: 'filter',
                operation: '>',
                target: 'open',
                value: 33
            }]
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'candlestick',
            transforms: [{
                type: 'filter',
                operation: '{}',
                target: 'x',
                value: ['2016-09-01', '2016-09-10']
            }]
        });

        var out = _calc([trace0, trace1]);

        expect(out.length).toEqual(2);

        expect(out[0].x).toEqual([
            '2016-09-01', '2016-09-02', '2016-09-03', '2016-09-05', '2016-09-06', '2016-09-07', '2016-09-10'
        ]);
        expect(out[0].open).toEqual([
            33.01, 33.31, 33.50, 34.12, 33.05, 33.31, 33.50
        ]);

        expect(out[1].x).toEqual([
            '2016-09-01', '2016-09-10'
        ]);
        expect(out[1].close).toEqual([
            34.10, 33.70
        ]);
    });

    it('should work with *groupby* transforms (ohlc)', function() {
        var opts = {
            type: 'groupby',
            groups: ['b', 'b', 'b', 'a'],
        };

        var trace0 = Lib.extendDeep({}, mock1, {
            type: 'ohlc',
            tickwidth: 0.05,
            transforms: [opts]
        });

        var out = _calc([trace0]);

        expect(out.length).toBe(2);

        expect(out[0].name).toBe('b');
        expect(out[0].x).toEqual([
            '2016-09-01', '2016-09-02', '2016-09-03'
        ]);
        expect(out[0].open).toEqual([
            33.01, 33.31, 33.5
        ]);

        expect(out[1].name).toBe('a');
        expect(out[1].x).toEqual([
            '2016-09-04'
        ]);
        expect(out[1].open).toEqual([
            32.06
        ]);
    });

    it('should work with *groupby* transforms (candlestick)', function() {
        var opts = {
            type: 'groupby',
            groups: ['a', 'b', 'b', 'a'],
        };

        var trace0 = Lib.extendDeep({}, mock1, {
            type: 'candlestick',
            transforms: [opts]
        });

        var out = _calc([trace0]);

        expect(out[0].name).toEqual('a');
        expect(out[0].x).toEqual([
            '2016-09-01', '2016-09-04'
        ]);
        expect(out[0].open).toEqual([
            33.01, 32.06
        ]);

        expect(out[1].name).toEqual('b');
        expect(out[1].x).toEqual([
            '2016-09-02', '2016-09-03'
        ]);
        expect(out[1].open).toEqual([
            33.31, 33.5
        ]);
    });

    it('should use the smallest trace minimum x difference to convert *tickwidth* to data coords for all traces attached to a given x-axis', function() {
        var trace0 = Lib.extendDeep({}, mock1, {
            type: 'ohlc'
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'ohlc',
            // shift time coordinates by 10 hours
            x: mock1.x.map(function(d) { return d + ' 10:00'; })
        });

        var out = _calcRaw([trace0, trace1]);

        var oneDay = 1000 * 3600 * 24;
        expect(out[0][0].t.tickLen).toBeCloseTo(oneDay * 0.3, 0);
        expect(out[0][0].t.wHover).toBeCloseTo(oneDay * 0.5, 0);
        expect(out[1][0].t.tickLen).toBe(out[0][0].t.tickLen);
        expect(out[1][0].t.wHover).toBe(out[0][0].t.wHover);
    });

    it('works with category x data', function() {
        // see https://github.com/plotly/plotly.js/issues/2004
        // fixed automatically as part of the refactor to a non-transform trace
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
            x: ['a', 'b', 'c', 'd', 'e']
        });

        var out = _calcRaw([trace0]);

        expect(out[0][0].t.tickLen).toBeCloseTo(0.3, 5);
        expect(out[0][0].t.wHover).toBeCloseTo(0.5, 5);
    });

    it('should fallback to a spacing of 1 in one-item traces', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
            x: ['2016-01-01']
        });

        var trace1 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
            x: [10],
            xaxis: 'x2'
        });

        var out = _calcRaw([trace0, trace1]);
        expect(out[0][0].t.tickLen).toBeCloseTo(0.3, 5);
        expect(out[0][0].t.wHover).toBeCloseTo(0.5, 5);
        expect(out[1][0].t.tickLen).toBeCloseTo(0.3, 5);
        expect(out[1][0].t.wHover).toBeCloseTo(0.5, 5);
    });

    it('should handle cases where \'open\' and \'close\' entries are equal', function() {
        var out = _calcRaw([{
            type: 'ohlc',
            open: [0, 1, 0, 2, 1, 1, 2, 2],
            high: [3, 3, 3, 3, 3, 3, 3, 3],
            low: [-1, -1, -1, -1, -1, -1, -1, -1],
            close: [0, 2, 0, 1, 1, 1, 2, 2],
            tickwidth: 0
        }, {
            type: 'candlestick',
            open: [0, 2, 0, 1],
            high: [3, 3, 3, 3],
            low: [-1, -1, -1, -1],
            close: [0, 1, 0, 2]
        }]);

        expect(mapGet(out[0], 'dir')).toEqual([
            'increasing', 'increasing', 'decreasing', 'decreasing',
            'decreasing', 'decreasing', 'increasing', 'increasing'
        ]);

        expect(mapGet(out[1], 'dir')).toEqual([
            'increasing', 'decreasing', 'decreasing', 'increasing'
        ]);
    });

    it('should include finance hover labels prefix in calcdata', function() {
        ['candlestick', 'ohlc'].forEach(function(type) {
            var trace0 = Lib.extendDeep({}, mock0, {
                type: type,
            });
            var out = _calcRaw([trace0]);

            expect(out[0][0].t.labels).toEqual({
                open: 'open: ',
                high: 'high: ',
                low: 'low: ',
                close: 'close: '
            });
        });
    });
});

describe('finance charts updates:', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function countOHLCTraces() {
        return d3.select('g.cartesianlayer').selectAll('g.trace.ohlc').size();
    }

    function countBoxTraces() {
        return d3.select('g.cartesianlayer').selectAll('g.trace.boxes').size();
    }

    function countRangeSliders() {
        return d3.select('g.rangeslider-rangeplot').size();
    }

    it('Plotly.restyle should work', function(done) {
        var trace0 = Lib.extendDeep({}, mock0, { type: 'ohlc' });

        var path0;

        Plotly.plot(gd, [trace0]).then(function() {
            expect(gd.calcdata[0][0].t.tickLen).toBeCloseTo(0.3, 5);
            expect(gd.calcdata[0][0].o).toEqual(33.01);

            return Plotly.restyle(gd, 'tickwidth', 0.5);
        })
        .then(function() {
            expect(gd.calcdata[0][0].t.tickLen).toBeCloseTo(0.5, 5);

            return Plotly.restyle(gd, 'open', [[0, 30.75, 32.87, 31.62, 30.81, 32.75, 32.75, 32.87]]);
        })
        .then(function() {
            expect(gd.calcdata[0][0].o).toEqual(0);

            return Plotly.restyle(gd, {
                type: 'candlestick',
                open: [[33.01, 33.31, 33.50, 32.06, 34.12, 33.05, 33.31, 33.50]]
            });
        })
        .then(function() {
            path0 = d3.select('path.box').attr('d');
            expect(path0).toBeDefined();

            return Plotly.restyle(gd, 'whiskerwidth', 0.2);
        })
        .then(function() {
            expect(d3.select('path.box').attr('d')).not.toEqual(path0);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to toggle visibility', function(done) {
        var data = [
            Lib.extendDeep({}, mock0, { type: 'ohlc' }),
            Lib.extendDeep({}, mock0, { type: 'candlestick' }),
        ];

        Plotly.plot(gd, data).then(function() {
            expect(countOHLCTraces()).toEqual(1);
            expect(countBoxTraces()).toEqual(1);

            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(0);

            return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(0);

            return Plotly.restyle(gd, 'visible', true, [1]);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(1);

            return Plotly.restyle(gd, 'visible', true, [0]);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(1);
            expect(countBoxTraces()).toEqual(1);

            return Plotly.restyle(gd, 'visible', 'legendonly', [0]);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(1);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(1);
            expect(countBoxTraces()).toEqual(1);
        })
        .catch(failTest)
        .then(done);
    });

    it('Plotly.relayout should work', function(done) {
        var trace0 = Lib.extendDeep({}, mock0, { type: 'ohlc' });

        Plotly.plot(gd, [trace0]).then(function() {
            expect(countRangeSliders()).toEqual(1);

            return Plotly.relayout(gd, 'xaxis.rangeslider.visible', false);
        })
        .then(function() {
            expect(countRangeSliders()).toEqual(0);
        })
        .catch(failTest)
        .then(done);

    });

    it('Plotly.extendTraces should work', function(done) {
        var data = [
            Lib.extendDeep({}, mock0, { type: 'ohlc' }),
            Lib.extendDeep({}, mock0, { type: 'candlestick' }),
        ];

        Plotly.plot(gd, data).then(function() {
            expect(gd.calcdata[0].length).toEqual(8);
            expect(gd.calcdata[1].length).toEqual(8);

            return Plotly.extendTraces(gd, {
                open: [[ 34, 35 ]],
                high: [[ 40, 41 ]],
                low: [[ 32, 33 ]],
                close: [[ 38, 39 ]]
            }, [1]);
        })
        .then(function() {
            expect(gd.calcdata[0].length).toEqual(8);
            expect(gd.calcdata[1].length).toEqual(10);

            return Plotly.extendTraces(gd, {
                open: [[ 34, 35 ]],
                high: [[ 40, 41 ]],
                low: [[ 32, 33 ]],
                close: [[ 38, 39 ]]
            }, [0]);
        })
        .then(function() {
            expect(gd.calcdata[0].length).toEqual(10);
            expect(gd.calcdata[1].length).toEqual(10);
        })
        .catch(failTest)
        .then(done);
    });

    it('Plotly.deleteTraces / addTraces should work', function(done) {
        var data = [
            Lib.extendDeep({}, mock0, { type: 'ohlc' }),
            Lib.extendDeep({}, mock0, { type: 'candlestick' }),
        ];

        Plotly.plot(gd, data).then(function() {
            expect(countOHLCTraces()).toEqual(1);
            expect(countBoxTraces()).toEqual(1);

            return Plotly.deleteTraces(gd, [1]);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(1);
            expect(countBoxTraces()).toEqual(0);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(0);

            var trace = Lib.extendDeep({}, mock0, { type: 'candlestick' });

            return Plotly.addTraces(gd, [trace]);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(1);

            var trace = Lib.extendDeep({}, mock0, { type: 'ohlc' });

            return Plotly.addTraces(gd, [trace]);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(1);
            expect(countBoxTraces()).toEqual(1);
        })
        .catch(failTest)
        .then(done);
    });

    it('Plotly.addTraces + Plotly.relayout should update candlestick box position values', function(done) {

        function assertBoxPosFields(bPos) {
            expect(gd.calcdata.length).toEqual(bPos.length);

            gd.calcdata.forEach(function(calcTrace, i) {
                expect(calcTrace[0].t.bPos).toBeCloseTo(bPos[i], 0);
            });
        }

        var trace0 = {
            type: 'candlestick',
            x: ['2011-01-01', '2011-01-02'],
            open: [1, 2],
            high: [3, 4],
            low: [0, 1],
            close: [2, 3]
        };

        Plotly.plot(gd, [trace0], {boxmode: 'group'})
        .then(function() {
            assertBoxPosFields([0]);

            return Plotly.addTraces(gd, [Lib.extendDeep({}, trace0)]);

        })
        .then(function() {
            assertBoxPosFields([-15120000, 15120000]);

            var update = {
                type: 'candlestick',
                x: [['2011-01-01', '2011-01-05'], ['2011-01-01', '2011-01-03']],
                open: [[1, 0]],
                high: [[3, 2]],
                low: [[0, -1]],
                close: [[2, 1]]
            };

            return Plotly.restyle(gd, update);
        })
        .then(function() {
            assertBoxPosFields([-30240000, 30240000]);
        })
        .catch(failTest)
        .then(done);
    });

    it('Plotly.plot with data-less trace and adding with Plotly.restyle', function(done) {
        var data = [
            { type: 'candlestick' },
            { type: 'ohlc' },
            { type: 'bar', y: [2, 1, 2] }
        ];

        Plotly.plot(gd, data).then(function() {
            expect(countOHLCTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(0);
            expect(countRangeSliders()).toEqual(0);

            return Plotly.restyle(gd, {
                open: [mock0.open],
                high: [mock0.high],
                low: [mock0.low],
                close: [mock0.close]
            }, [0]);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(1);
            expect(countRangeSliders()).toEqual(1);

            return Plotly.restyle(gd, {
                open: [mock0.open],
                high: [mock0.high],
                low: [mock0.low],
                close: [mock0.close]
            }, [1]);
        })
        .then(function() {
            expect(countOHLCTraces()).toEqual(1);
            expect(countBoxTraces()).toEqual(1);
            expect(countRangeSliders()).toEqual(1);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to update ohlc tickwidth', function(done) {
        var trace0 = Lib.extendDeep({}, mock0, {type: 'ohlc'});

        function _assert(msg, exp) {
            var tickLen = gd.calcdata[0][0].t.tickLen;
            expect(tickLen)
                .toBe(exp.tickLen, 'tickLen val in calcdata - ' + msg);
            var pathd = d3.select(gd).select('.ohlc > path').attr('d');
            expect(pathd)
                .toBe(exp.pathd, 'path d attr - ' + msg);
        }

        Plotly.plot(gd, [trace0], {
            xaxis: { rangeslider: {visible: false} }
        })
        .then(function() {
            _assert('auto rng / base tickwidth', {
                tickLen: 0.3,
                pathd: 'M13.5,137.63H33.75M33.75,75.04V206.53M54,80.3H33.75'
            });
            return Plotly.restyle(gd, 'tickwidth', 0);
        })
        .then(function() {
            _assert('auto rng / no tickwidth', {
                tickLen: 0,
                pathd: 'M33.75,137.63H33.75M33.75,75.04V206.53M33.75,80.3H33.75'
            });

            return Plotly.update(gd, {
                tickwidth: null
            }, {
                'xaxis.range': [0, 8],
                'yaxis.range': [30, 36]
            });
        })
        .then(function() {
            _assert('set rng / base tickwidth', {
                tickLen: 0.3,
                pathd: 'M-20.25,134.55H0M0,81V193.5M20.25,85.5H0'
            });
            return Plotly.restyle(gd, 'tickwidth', 0);
        })
        .then(function() {
            _assert('set rng / no tickwidth', {
                tickLen: 0,
                pathd: 'M0,134.55H0M0,81V193.5M0,85.5H0'
            });
        })
        .catch(failTest)
        .then(done);
    });

});

describe('finance charts *special* handlers:', function() {
    // not special anymore - just test that they work as normal

    afterEach(destroyGraphDiv);

    it('`editable: true` handlers should work', function(done) {

        var gd = createGraphDiv();

        function editText(itemNumber, newText) {
            var textNode = d3.selectAll('text.legendtext')
                .filter(function(_, i) { return i === itemNumber; }).node();
            textNode.dispatchEvent(new window.MouseEvent('click'));

            var editNode = d3.select('.plugin-editable.editable').node();
            editNode.dispatchEvent(new window.FocusEvent('focus'));

            editNode.textContent = newText;
            editNode.dispatchEvent(new window.FocusEvent('focus'));
            editNode.dispatchEvent(new window.FocusEvent('blur'));
        }

        // makeEditable in svg_text_utils clears the edit <div> in
        // a 0-second transition, so push the resolve call at the back
        // of the rendering queue to make sure the edit <div> is properly
        // cleared after each mocked text edits.
        function delayedResolve(resolve) {
            setTimeout(function() { return resolve(gd); }, 0);
        }

        Plotly.plot(gd, [
            Lib.extendDeep({}, mock0, { type: 'ohlc' }),
            Lib.extendDeep({}, mock0, { type: 'candlestick' })
        ], {}, {
            editable: true
        })
        .then(function(gd) {
            return new Promise(function(resolve) {
                gd.once('plotly_restyle', function(eventData) {
                    expect(eventData[0].name).toEqual('0');
                    expect(eventData[1]).toEqual([0]);
                    delayedResolve(resolve);
                });

                editText(0, '0');
            });
        })
        .then(function(gd) {
            return new Promise(function(resolve) {
                gd.once('plotly_restyle', function(eventData) {
                    expect(eventData[0].name).toEqual('1');
                    expect(eventData[1]).toEqual([1]);
                    delayedResolve(resolve);
                });

                editText(1, '1');
            });
        })
        .catch(failTest)
        .then(done);
    });

});
