var Plotly = require('@lib/core');
var ohlc = require('@lib/ohlc');
var candlestick = require('@lib/candlestick');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('Bundle with finance trace type', function() {
    'use strict';

    Plotly.register([ohlc, candlestick]);

    var mock = require('@mocks/finance_style.json');

    it('should register the correct trace modules for the generated traces', function() {
        var transformModules = Object.keys(Plotly.Plots.transformsRegistry);

        expect(transformModules).toEqual(['ohlc', 'candlestick']);
    });

    it('should register the correct trace modules for the generated traces', function() {
        var traceModules = Object.keys(Plotly.Plots.modules);

        expect(traceModules).toEqual(['scatter', 'box', 'ohlc', 'candlestick']);
    });

    it('should graph ohlc and candlestick traces', function(done) {

        Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(function() {
            var gSubplot = d3.select('g.cartesianlayer');

            expect(gSubplot.selectAll('g.trace.scatter').size()).toEqual(2);
            expect(gSubplot.selectAll('g.trace.boxes').size()).toEqual(2);

            destroyGraphDiv();
            done();
        });

    });
});
