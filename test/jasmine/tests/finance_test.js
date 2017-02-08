var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

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

        Plots.supplyDefaults(gd);

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
        expect(out._fullData.length).toEqual(4);

        var directions = out._fullData.map(function(fullTrace) {
            return fullTrace.transforms[0].direction;
        });

        expect(directions).toEqual(['increasing', 'decreasing', 'increasing', 'decreasing']);
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
        expect(out._fullData.length).toEqual(4);

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

        // dummy 'ohlc' and 'candlestick' transforms are pushed at the end
        // of the 'transforms' array container

        expect(transformTypesOut).toEqual([
            ['filter', 'ohlc'], ['filter', 'ohlc'],
            ['filter', 'candlestick'], ['filter', 'candlestick']
        ]);
    });

    it('should slice data array according to minimum supplied length', function() {

        function assertDataLength(fullTrace, len) {
            expect(fullTrace.visible).toBe(true);

            expect(fullTrace.open.length).toEqual(len);
            expect(fullTrace.high.length).toEqual(len);
            expect(fullTrace.low.length).toEqual(len);
            expect(fullTrace.close.length).toEqual(len);
        }

        var trace0 = Lib.extendDeep({}, mock0, { type: 'ohlc' });
        trace0.open = [33.01, 33.31, 33.50, 32.06, 34.12];

        var trace1 = Lib.extendDeep({}, mock1, { type: 'candlestick' });
        trace1.x = ['2016-09-01', '2016-09-02', '2016-09-03', '2016-09-04'];

        var out = _supply([trace0, trace1]);

        assertDataLength(out._fullData[0], 5);
        assertDataLength(out._fullData[1], 5);
        assertDataLength(out._fullData[2], 4);
        assertDataLength(out._fullData[3], 4);

        expect(out._fullData[0]._fullInput.x).toBeUndefined();
        expect(out._fullData[1]._fullInput.x).toBeUndefined();
        expect(out._fullData[2]._fullInput.x.length).toEqual(4);
        expect(out._fullData[3]._fullInput.x.length).toEqual(4);
    });

    it('should set visible to *false* when minimum supplied length is 0', function() {
        var trace0 = Lib.extendDeep({}, mock0, { type: 'ohlc' });
        trace0.close = undefined;

        var trace1 = Lib.extendDeep({}, mock1, { type: 'candlestick' });
        trace1.high = null;

        var out = _supply([trace0, trace1]);

        expect(out.data.length).toEqual(2);
        expect(out._fullData.length).toEqual(4);

        var visibilities = out._fullData.map(function(fullTrace) {
            return fullTrace.visible;
        });

        expect(visibilities).toEqual([false, false, false, false]);
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

        expect(visibilities).toEqual([false, false, false, false]);
    });

    it('direction *name* should be inherited from trace-wide *name*', function() {
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
            'Company A - increasing',
            'Company A - decreasing',
            'B - UP',
            'B - DOWN'
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
            'trace 0 - increasing',
            'trace 0 - decreasing',
            'trace 1',
            'trace 2 - increasing',
            'trace 2 - decreasing',
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
        var fullInput = fullData.map(function(fullTrace) { return fullTrace._fullInput; });

        assertLine(fullInput[0].increasing, 1, 'dash');
        assertLine(fullInput[0].decreasing, 1, 'dot');
        assertLine(fullInput[2].increasing, 0);
        assertLine(fullInput[2].decreasing, 3);

        assertLine(fullData[0], 1, 'dash');
        assertLine(fullData[1], 1, 'dot');
        assertLine(fullData[2], 0);
        assertLine(fullData[3], 3);
    });

    it('trace-wide *visible* should be passed to generated traces', function() {
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

        expect(visibilities).toEqual(['legendonly', 'legendonly', false]);
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
            expect(fullTrace.xcalendar).toBe(i < 2 ? 'hebrew' : 'julian');
        });
    });

    it('should make empty candlestick traces autotype to *linear* (as opposed to real box traces)', function() {
        var trace0 = { type: 'candlestick' };
        var out = _supply([trace0], { xaxis: {} });

        expect(out._fullLayout.xaxis.type).toEqual('linear');
    });
});

describe('finance charts calc transforms:', function() {
    'use strict';

    function calcDatatoTrace(calcTrace) {
        return calcTrace[0].trace;
    }

    function _calc(data, layout) {
        var gd = {
            data: data,
            layout: layout || {}
        };

        Plots.supplyDefaults(gd);
        Plots.doCalcdata(gd);

        return gd.calcdata.map(calcDatatoTrace);
    }

    it('should fill when *x* is not present', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
        });

        var trace1 = Lib.extendDeep({}, mock0, {
            type: 'candlestick',
        });

        var out = _calc([trace0, trace1]);

        expect(out[0].x).toEqual([
            -0.3, 0, 0, 0, 0, 0.3, null,
            2.7, 3, 3, 3, 3, 3.3, null,
            4.7, 5, 5, 5, 5, 5.3, null,
            6.7, 7, 7, 7, 7, 7.3, null
        ]);
        expect(out[1].x).toEqual([
            0.7, 1, 1, 1, 1, 1.3, null,
            1.7, 2, 2, 2, 2, 2.3, null,
            3.7, 4, 4, 4, 4, 4.3, null,
            5.7, 6, 6, 6, 6, 6.3, null
        ]);
        expect(out[2].x).toEqual([
            0, 0, 0, 0, 0, 0,
            3, 3, 3, 3, 3, 3,
            5, 5, 5, 5, 5, 5,
            7, 7, 7, 7, 7, 7
        ]);
        expect(out[3].x).toEqual([
            1, 1, 1, 1, 1, 1,
            2, 2, 2, 2, 2, 2,
            4, 4, 4, 4, 4, 4,
            6, 6, 6, 6, 6, 6
        ]);
    });

    it('should fill *text* for OHLC hover labels', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
            text: ['A', 'B', 'C', 'D']
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'ohlc',
            text: 'IMPORTANT',
            hoverinfo: 'x+text',
            xaxis: 'x2'
        });

        var trace2 = Lib.extendDeep({}, mock1, {
            type: 'ohlc',
            hoverinfo: 'y',
            xaxis: 'x2'
        });

        var trace3 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
            hoverinfo: 'x',
        });

        var out = _calc([trace0, trace1, trace2, trace3]);

        expect(out[0].hoverinfo).toEqual('x+text+name');
        expect(out[0].text[0])
            .toEqual('Open: 33.01<br>High: 34.2<br>Low: 31.7<br>Close: 34.1<br>A');
        expect(out[0].hoverinfo).toEqual('x+text+name');
        expect(out[1].text[0])
            .toEqual('Open: 33.31<br>High: 34.37<br>Low: 30.75<br>Close: 31.93<br>B');

        expect(out[2].hoverinfo).toEqual('x+text');
        expect(out[2].text[0]).toEqual('IMPORTANT');

        expect(out[3].hoverinfo).toEqual('x+text');
        expect(out[3].text[0]).toEqual('IMPORTANT');

        expect(out[4].hoverinfo).toEqual('text');
        expect(out[4].text[0])
            .toEqual('Open: 33.01<br>High: 34.2<br>Low: 31.7<br>Close: 34.1');
        expect(out[5].hoverinfo).toEqual('text');
        expect(out[5].text[0])
            .toEqual('Open: 33.31<br>High: 34.37<br>Low: 30.75<br>Close: 31.93');

        expect(out[6].hoverinfo).toEqual('x');
        expect(out[6].text[0]).toEqual('');
        expect(out[7].hoverinfo).toEqual('x');
        expect(out[7].text[0]).toEqual('');
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

        expect(out.length).toEqual(4);

        expect(out[0].x).toEqual([
            '2016-08-31 22:48', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01 01:12', null,
            '2016-09-05 22:48', '2016-09-06', '2016-09-06', '2016-09-06', '2016-09-06', '2016-09-06 01:12', null,
            '2016-09-09 22:48', '2016-09-10', '2016-09-10', '2016-09-10', '2016-09-10', '2016-09-10 01:12', null
        ]);
        expect(out[0].y).toEqual([
            33.01, 33.01, 34.2, 31.7, 34.1, 34.1, null,
            33.05, 33.05, 33.25, 32.75, 33.1, 33.1, null,
            33.5, 33.5, 34.62, 32.87, 33.7, 33.7, null
        ]);
        expect(out[1].x).toEqual([
            '2016-09-01 22:48', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02 01:12', null,
            '2016-09-02 22:48', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03 01:12', null,
            '2016-09-04 22:48', '2016-09-05', '2016-09-05', '2016-09-05', '2016-09-05', '2016-09-05 01:12', null,
            '2016-09-06 22:48', '2016-09-07', '2016-09-07', '2016-09-07', '2016-09-07', '2016-09-07 01:12', null
        ]);
        expect(out[1].y).toEqual([
            33.31, 33.31, 34.37, 30.75, 31.93, 31.93, null,
            33.5, 33.5, 33.62, 32.87, 33.37, 33.37, null,
            34.12, 34.12, 35.18, 30.81, 31.18, 31.18, null,
            33.31, 33.31, 35.37, 32.75, 32.93, 32.93, null
        ]);

        expect(out[2].x).toEqual([
            '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01',
            '2016-09-10', '2016-09-10', '2016-09-10', '2016-09-10', '2016-09-10', '2016-09-10'
        ]);
        expect(out[2].y).toEqual([
            31.7, 33.01, 34.1, 34.1, 34.1, 34.2,
            32.87, 33.5, 33.7, 33.7, 33.7, 34.62
        ]);

        expect(out[3].x).toEqual([]);
        expect(out[3].y).toEqual([]);
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

        expect(out[0].name).toEqual('trace 0 - increasing');
        expect(out[0].x).toEqual([
            '2016-08-31 22:48', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01 01:12', null
        ]);
        expect(out[0].y).toEqual([
            33.01, 33.01, 34.2, 31.7, 34.1, 34.1, null,
        ]);

        expect(out[1].name).toEqual('trace 0 - decreasing');
        expect(out[1].x).toEqual([
            '2016-09-01 22:48', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02 01:12', null,
            '2016-09-02 22:48', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03 01:12', null
        ]);
        expect(out[1].y).toEqual([
            33.31, 33.31, 34.37, 30.75, 31.93, 31.93, null,
            33.5, 33.5, 33.62, 32.87, 33.37, 33.37, null
        ]);

        expect(out[2].name).toEqual('trace 0 - increasing');
        expect(out[2].x).toEqual([
            '2016-09-03 22:48', '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04 01:12', null
        ]);
        expect(out[2].y).toEqual([
            32.06, 32.06, 34.25, 31.62, 33.18, 33.18, null
        ]);

        expect(out[3].name).toEqual('trace 0 - decreasing');
        expect(out[3].x).toEqual([]);
        expect(out[3].y).toEqual([]);
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

        expect(out[0].name).toEqual('trace 0 - increasing');
        expect(out[0].x).toEqual([
            '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01',
            '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04'
        ]);
        expect(out[0].y).toEqual([
            31.7, 33.01, 34.1, 34.1, 34.1, 34.2,
            31.62, 32.06, 33.18, 33.18, 33.18, 34.25
        ]);

        expect(out[1].name).toEqual('trace 0 - decreasing');
        expect(out[1].x).toEqual([]);
        expect(out[1].y).toEqual([]);

        expect(out[2].name).toEqual('trace 0 - increasing');
        expect(out[2].x).toEqual([]);
        expect(out[2].y).toEqual([]);

        expect(out[3].name).toEqual('trace 0 - decreasing');
        expect(out[3].x).toEqual([
            '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02',
            '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03'
        ]);
        expect(out[3].y).toEqual([
            30.75, 33.31, 31.93, 31.93, 31.93, 34.37,
            32.87, 33.5, 33.37, 33.37, 33.37, 33.62
        ]);
    });

    it('should use the smallest trace minimum x difference to convert *tickwidth* to data coords for all traces attached to a given x-axis', function() {
        var trace0 = Lib.extendDeep({}, mock1, {
            type: 'ohlc',
            tickwidth: 0.5
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'ohlc',
            tickwidth: 0.5
        });

        // shift time coordinates by 10 hours
        trace1.x = trace1.x.map(function(d) {
            return d + ' 10:00';
        });

        var out = _calc([trace0, trace1]);

        expect(out[0].x).toEqual([
            '2016-08-31 12:00', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01 12:00', null,
            '2016-09-03 12:00', '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04 12:00', null,
            '2016-09-05 12:00', '2016-09-06', '2016-09-06', '2016-09-06', '2016-09-06', '2016-09-06 12:00', null,
            '2016-09-09 12:00', '2016-09-10', '2016-09-10', '2016-09-10', '2016-09-10', '2016-09-10 12:00', null
        ]);

        expect(out[1].x).toEqual([
            '2016-09-01 12:00', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02 12:00', null,
            '2016-09-02 12:00', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03 12:00', null,
            '2016-09-04 12:00', '2016-09-05', '2016-09-05', '2016-09-05', '2016-09-05', '2016-09-05 12:00', null,
            '2016-09-06 12:00', '2016-09-07', '2016-09-07', '2016-09-07', '2016-09-07', '2016-09-07 12:00', null
        ]);

        expect(out[2].x).toEqual([
            '2016-08-31 22:00', '2016-09-01 10:00', '2016-09-01 10:00', '2016-09-01 10:00', '2016-09-01 10:00', '2016-09-01 22:00', null,
            '2016-09-03 22:00', '2016-09-04 10:00', '2016-09-04 10:00', '2016-09-04 10:00', '2016-09-04 10:00', '2016-09-04 22:00', null,
            '2016-09-05 22:00', '2016-09-06 10:00', '2016-09-06 10:00', '2016-09-06 10:00', '2016-09-06 10:00', '2016-09-06 22:00', null,
            '2016-09-09 22:00', '2016-09-10 10:00', '2016-09-10 10:00', '2016-09-10 10:00', '2016-09-10 10:00', '2016-09-10 22:00', null
        ]);

        expect(out[3].x).toEqual([
            '2016-09-01 22:00', '2016-09-02 10:00', '2016-09-02 10:00', '2016-09-02 10:00', '2016-09-02 10:00', '2016-09-02 22:00', null,
            '2016-09-02 22:00', '2016-09-03 10:00', '2016-09-03 10:00', '2016-09-03 10:00', '2016-09-03 10:00', '2016-09-03 22:00', null,
            '2016-09-04 22:00', '2016-09-05 10:00', '2016-09-05 10:00', '2016-09-05 10:00', '2016-09-05 10:00', '2016-09-05 22:00', null,
            '2016-09-06 22:00', '2016-09-07 10:00', '2016-09-07 10:00', '2016-09-07 10:00', '2016-09-07 10:00', '2016-09-07 22:00', null
        ]);
    });

    it('should fallback to a minimum x difference of 0.5 in one-item traces', function() {
        var trace0 = Lib.extendDeep({}, mock1, {
            type: 'ohlc',
            tickwidth: 0.5
        });
        trace0.x = [ '2016-01-01' ];

        var trace1 = Lib.extendDeep({}, mock0, {
            type: 'ohlc',
            tickwidth: 0.5
        });
        trace1.x = [ 10 ];

        var out = _calc([trace0, trace1]);

        var x0 = Lib.simpleMap(out[0].x, Lib.dateTime2ms);
        expect(x0[x0.length - 2] - x0[0]).toEqual(1);

        var x2 = Lib.simpleMap(out[2].x, Lib.dateTime2ms);
        expect(x2[x2.length - 2] - x2[0]).toEqual(1);

        expect(out[1].x).toEqual([]);
        expect(out[3].x).toEqual([]);
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

    function countScatterTraces() {
        return d3.select('g.cartesianlayer').selectAll('g.trace.scatter').size();
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
            expect(gd.calcdata[0][0].x).toEqual(-0.3);
            expect(gd.calcdata[0][0].y).toEqual(33.01);

            return Plotly.restyle(gd, 'tickwidth', 0.5);
        })
        .then(function() {
            expect(gd.calcdata[0][0].x).toEqual(-0.5);

            return Plotly.restyle(gd, 'open', [[0, 30.75, 32.87, 31.62, 30.81, 32.75, 32.75, 32.87]]);
        })
        .then(function() {
            expect(gd.calcdata[0][0].y).toEqual(0);

            return Plotly.restyle(gd, {
                type: 'candlestick',
                open: [[33.01, 33.31, 33.50, 32.06, 34.12, 33.05, 33.31, 33.50]]
            });
        })
        .then(function() {
            path0 = d3.select('path.box').attr('d');

            return Plotly.restyle(gd, 'whiskerwidth', 0.2);
        })
        .then(function() {
            expect(d3.select('path.box').attr('d')).not.toEqual(path0);

            done();
        });

    });

    it('should be able to toggle visibility', function(done) {
        var data = [
            Lib.extendDeep({}, mock0, { type: 'ohlc' }),
            Lib.extendDeep({}, mock0, { type: 'candlestick' }),
        ];

        Plotly.plot(gd, data).then(function() {
            expect(countScatterTraces()).toEqual(2);
            expect(countBoxTraces()).toEqual(2);

            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            expect(countScatterTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(0);

            return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
        })
        .then(function() {
            expect(countScatterTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(0);

            return Plotly.restyle(gd, 'visible', true, [1]);
        })
        .then(function() {
            expect(countScatterTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(2);

            return Plotly.restyle(gd, 'visible', true, [0]);
        })
        .then(function() {
            expect(countScatterTraces()).toEqual(2);
            expect(countBoxTraces()).toEqual(2);

            return Plotly.restyle(gd, 'visible', 'legendonly', [0]);
        })
        .then(function() {
            expect(countScatterTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(2);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            expect(countScatterTraces()).toEqual(2);
            expect(countBoxTraces()).toEqual(2);

            done();
        });
    });

    it('Plotly.relayout should work', function(done) {
        var trace0 = Lib.extendDeep({}, mock0, { type: 'ohlc' });

        Plotly.plot(gd, [trace0]).then(function() {
            expect(countRangeSliders()).toEqual(1);

            return Plotly.relayout(gd, 'xaxis.rangeslider.visible', false);
        })
        .then(function() {
            expect(countRangeSliders()).toEqual(0);

            done();
        });

    });

    it('Plotly.extendTraces should work', function(done) {
        var data = [
            Lib.extendDeep({}, mock0, { type: 'ohlc' }),
            Lib.extendDeep({}, mock0, { type: 'candlestick' }),
        ];

        // ohlc have 7 calc pts per 'x' coords

        Plotly.plot(gd, data).then(function() {
            expect(gd.calcdata[0].length).toEqual(28);
            expect(gd.calcdata[1].length).toEqual(28);
            expect(gd.calcdata[2].length).toEqual(4);
            expect(gd.calcdata[3].length).toEqual(4);

            return Plotly.extendTraces(gd, {
                open: [[ 34, 35 ]],
                high: [[ 40, 41 ]],
                low: [[ 32, 33 ]],
                close: [[ 38, 39 ]]
            }, [1]);
        })
        .then(function() {
            expect(gd.calcdata[0].length).toEqual(28);
            expect(gd.calcdata[1].length).toEqual(28);
            expect(gd.calcdata[2].length).toEqual(6);
            expect(gd.calcdata[3].length).toEqual(4);

            return Plotly.extendTraces(gd, {
                open: [[ 34, 35 ]],
                high: [[ 40, 41 ]],
                low: [[ 32, 33 ]],
                close: [[ 38, 39 ]]
            }, [0]);
        })
        .then(function() {
            expect(gd.calcdata[0].length).toEqual(42);
            expect(gd.calcdata[1].length).toEqual(28);
            expect(gd.calcdata[2].length).toEqual(6);
            expect(gd.calcdata[3].length).toEqual(4);

            done();
        });
    });

    it('Plotly.deleteTraces / addTraces should work', function(done) {
        var data = [
            Lib.extendDeep({}, mock0, { type: 'ohlc' }),
            Lib.extendDeep({}, mock0, { type: 'candlestick' }),
        ];

        Plotly.plot(gd, data).then(function() {
            expect(countScatterTraces()).toEqual(2);
            expect(countBoxTraces()).toEqual(2);

            return Plotly.deleteTraces(gd, [1]);
        })
        .then(function() {
            expect(countScatterTraces()).toEqual(2);
            expect(countBoxTraces()).toEqual(0);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            expect(countScatterTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(0);

            var trace = Lib.extendDeep({}, mock0, { type: 'candlestick' });

            return Plotly.addTraces(gd, [trace]);
        })
        .then(function() {
            expect(countScatterTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(2);

            var trace = Lib.extendDeep({}, mock0, { type: 'ohlc' });

            return Plotly.addTraces(gd, [trace]);
        })
        .then(function() {
            expect(countScatterTraces()).toEqual(2);
            expect(countBoxTraces()).toEqual(2);

            done();
        });
    });

    it('Plotly.addTraces + Plotly.relayout should update candlestick box position values', function(done) {

        function assertBoxPosFields(dPos) {
            expect(gd.calcdata.length).toEqual(dPos.length);

            gd.calcdata.forEach(function(calcTrace, i) {
                if(dPos[i] === undefined) {
                    expect(calcTrace[0].t.dPos).toBeUndefined();
                }
                else {
                    expect(calcTrace[0].t.dPos).toEqual(dPos[i]);
                }
            });
        }

        var trace0 = {
            type: 'candlestick',
            x: ['2011-01-01'],
            open: [0],
            high: [3],
            low: [1],
            close: [3]
        };

        Plotly.plot(gd, [trace0]).then(function() {
            assertBoxPosFields([0.5, undefined]);

            return Plotly.addTraces(gd, {});

        })
        .then(function() {
            var update = {
                type: 'candlestick',
                x: [['2011-02-02']],
                open: [[0]],
                high: [[3]],
                low: [[1]],
                close: [[3]]
            };

            return Plotly.restyle(gd, update);
        })
        .then(function() {
            assertBoxPosFields([0.5, undefined, 0.5, undefined]);

            done();
        });
    });

    it('Plotly.plot with data-less trace and adding with Plotly.restyle', function(done) {
        var data = [
            { type: 'candlestick' },
            { type: 'ohlc' },
            { type: 'bar', y: [2, 1, 2] }
        ];

        Plotly.plot(gd, data).then(function() {
            expect(countScatterTraces()).toEqual(0);
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
            expect(countScatterTraces()).toEqual(0);
            expect(countBoxTraces()).toEqual(2);
            expect(countRangeSliders()).toEqual(1);

            return Plotly.restyle(gd, {
                open: [mock0.open],
                high: [mock0.high],
                low: [mock0.low],
                close: [mock0.close]
            }, [1]);
        })
        .then(function() {
            expect(countScatterTraces()).toEqual(2);
            expect(countBoxTraces()).toEqual(2);
            expect(countRangeSliders()).toEqual(1);
        })
        .then(done);
    });

});

describe('finance charts *special* handlers:', function() {

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
                    expect(eventData[0]['increasing.name']).toEqual('0');
                    expect(eventData[1]).toEqual([0]);
                    delayedResolve(resolve);
                });

                editText(0, '0');
            });
        })
        .then(function(gd) {
            return new Promise(function(resolve) {
                gd.once('plotly_restyle', function(eventData) {
                    expect(eventData[0]['decreasing.name']).toEqual('1');
                    expect(eventData[1]).toEqual([0]);
                    delayedResolve(resolve);
                });

                editText(1, '1');
            });
        })
        .then(function(gd) {
            return new Promise(function(resolve) {
                gd.once('plotly_restyle', function(eventData) {
                    expect(eventData[0]['decreasing.name']).toEqual('2');
                    expect(eventData[1]).toEqual([1]);
                    delayedResolve(resolve);
                });

                editText(3, '2');
            });
        })
        .then(function(gd) {
            return new Promise(function(resolve) {
                gd.once('plotly_restyle', function(eventData) {
                    expect(eventData[0]['increasing.name']).toEqual('3');
                    expect(eventData[1]).toEqual([1]);
                    delayedResolve(resolve);
                });

                editText(2, '3');
            });
        })
        .then(done);
    });

});
