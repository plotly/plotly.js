var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

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

    it('unfortunately mutates user trace', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc'
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'candlestick'
        });

        var out = _supply([trace0, trace1]);
        expect(out.data[0].transforms).toEqual([{ type: 'ohlc', _ephemeral: true }]);
        expect(out.data[1].transforms).toEqual([{ type: 'candlestick', _ephemeral: true }]);

        // but at least in an idempotent way

        var out2 = _supply(out.data);
        expect(out2.data[0].transforms).toEqual([{ type: 'ohlc', _ephemeral: true }]);
        expect(out2.data[1].transforms).toEqual([{ type: 'candlestick', _ephemeral: true }]);
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

        var transformTypes = out._fullData.map(function(fullTrace) {
            return fullTrace.transforms.map(function(opts) {
                return opts.type;
            });
        });

        expect(transformTypes).toEqual([
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

    it('direction visibility should be inherited visibility from trace-wide visibility', function() {

    });

    it('direction visibility should be inherited visibility from trace-wide visibility', function() {

    });

    it('should add a few layout settings by default', function() {
        var trace0 = Lib.extendDeep({}, mock0, {
            type: 'ohlc'
        });

        var layout0 = {};

        var out0 = _supply([trace0], layout0);

        expect(out0.layout.hovermode).toEqual('closest');
        expect(out0._fullLayout.hovermode).toEqual('closest');
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

    function ms2DateTime(v) {
        return typeof v === 'number' ? Lib.ms2DateTime(v) : null;
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
            -0.05, 0, 0, 0, 0, 0.05, null,
            2.95, 3, 3, 3, 3, 3.05, null,
            4.95, 5, 5, 5, 5, 5.05, null,
            6.95, 7, 7, 7, 7, 7.05, null
        ]);
        expect(out[1].x).toEqual([
            0.95, 1, 1, 1, 1, 1.05, null,
            1.95, 2, 2, 2, 2, 2.05, null,
            3.95, 4, 4, 4, 4, 4.05, null,
            5.95, 6, 6, 6, 6, 6.05, null
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

    it('should work with *filter* transforms', function() {
        var trace0 = Lib.extendDeep({}, mock1, {
            type: 'ohlc',
            transforms: [{
                type: 'filter',
                operation: '>',
                filtersrc: 'open',
                value: 33
            }]
        });

        var trace1 = Lib.extendDeep({}, mock1, {
            type: 'candlestick',
            transforms: [{
                type: 'filter',
                operation: '{}',
                filtersrc: 'x',
                value: ['2016-09-01', '2016-09-10']
            }]
        });

        var out = _calc([trace0, trace1]);

        expect(out.length).toEqual(4);

        expect(out[0].x.map(ms2DateTime)).toEqual([
            '2016-08-31 22:48', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01 01:12', null,
            '2016-09-05 22:48', '2016-09-06', '2016-09-06', '2016-09-06', '2016-09-06', '2016-09-06 01:12', null,
            '2016-09-09 22:48', '2016-09-10', '2016-09-10', '2016-09-10', '2016-09-10', '2016-09-10 01:12', null
        ]);
        expect(out[0].y).toEqual([
            33.01, 33.01, 34.2, 31.7, 34.1, 34.1, null,
            33.05, 33.05, 33.25, 32.75, 33.1, 33.1, null,
            33.5, 33.5, 34.62, 32.87, 33.7, 33.7, null
        ]);
        expect(out[1].x.map(ms2DateTime)).toEqual([
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
            transforms: [opts]
        });

        var out = _calc([trace0]);

        expect(out[0].name).toEqual('increasing');
        expect(out[0].x.map(ms2DateTime)).toEqual([
            '2016-08-31 22:48', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01 01:12', null,
        ]);
        expect(out[0].y).toEqual([
            33.01, 33.01, 34.2, 31.7, 34.1, 34.1, null,
        ]);

        expect(out[1].name).toEqual('decreasing');
        expect(out[1].x.map(ms2DateTime)).toEqual([
            '2016-09-01 22:48', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02 01:12', null,
            '2016-09-02 22:48', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03 01:12', null
        ]);
        expect(out[1].y).toEqual([
            33.31, 33.31, 34.37, 30.75, 31.93, 31.93, null,
            33.5, 33.5, 33.62, 32.87, 33.37, 33.37, null
        ]);

        expect(out[2].name).toEqual('increasing');
        expect(out[2].x.map(ms2DateTime)).toEqual([
            '2016-09-03 23:59:59.999', '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04', null
        ]);
        expect(out[2].y).toEqual([
            32.06, 32.06, 34.25, 31.62, 33.18, 33.18, null
        ]);

        expect(out[3].name).toEqual('decreasing');
        expect(out[3].x.map(ms2DateTime)).toEqual([]);
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

        expect(out[0].name).toEqual('increasing');
        expect(out[0].x).toEqual([
            '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01', '2016-09-01',
            '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04', '2016-09-04'
        ]);
        expect(out[0].y).toEqual([
            31.7, 33.01, 34.1, 34.1, 34.1, 34.2,
            31.62, 32.06, 33.18, 33.18, 33.18, 34.25
        ]);

        expect(out[1].name).toEqual('decreasing');
        expect(out[1].x).toEqual([]);
        expect(out[1].y).toEqual([]);

        expect(out[2].name).toEqual('increasing');
        expect(out[2].x).toEqual([]);
        expect(out[2].y).toEqual([]);

        expect(out[3].name).toEqual('decreasing');
        expect(out[3].x).toEqual([
            '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02', '2016-09-02',
            '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03', '2016-09-03'
        ]);
        expect(out[3].y).toEqual([
            30.75, 33.31, 31.93, 31.93, 31.93, 34.37,
            32.87, 33.5, 33.37, 33.37, 33.37, 33.62
        ]);
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

    it('Plotly.restyle should work', function(done) {
        var trace0 = Lib.extendDeep({}, mock0, { type: 'ohlc' });

        Plotly.plot(gd, [trace0]).then(function() {

            // gotta test 'tickwidth' and 'whiskerwitdth'

            done();
        });

    });

    it('Plotly.relayout should work', function(done) {
        var trace0 = Lib.extendDeep({}, mock0, { type: 'ohlc' });

        Plotly.plot(gd, [trace0]).then(function() {

            done();
        });

    });

    it('Plotly.extendTraces should work', function(done) {

        done();
    });

    it('Plotly.deleteTraces should work', function(done) {
        done();
    });

    it('legend *editable: true* interactions should work', function(done) {

        done();
    });
});
