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

    it('should not register transforms anymore', function() {
        var transformModules = Object.keys(Plotly.Plots.transformsRegistry);

        expect(transformModules).toEqual([]);
    });

    it('should register the correct trace modules for the generated traces', function() {
        var traceModules = Object.keys(Plotly.Plots.modules);

        // scatter is registered no matter what
        // ohlc uses some parts of box by direct require but does not need to register it.
        expect(traceModules).toEqual(['scatter', 'ohlc', 'candlestick']);
    });

    it('should graph ohlc and candlestick traces', function(done) {

        Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(function() {
            var gSubplot = d3.select('g.cartesianlayer');

            expect(gSubplot.selectAll('g.trace.ohlc').size()).toEqual(1);
            expect(gSubplot.selectAll('g.trace.boxes').size()).toEqual(1);

            destroyGraphDiv();
            done();
        });

    });
});
