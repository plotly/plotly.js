var R = require('ramda');
var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('@assets/create_graph_div');
var destroyGraphDiv = require('@assets/destroy_graph_div');

Plotly.register([
    require('@assets/transforms/candlestick')
]);

describe('candlestick transform', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('supplyDataDefaults should apply the transform', function() {
        var dataIn = [{
            transforms: [
                {
                    type: 'candlestick',
                    // TODO: filter needs to be able to work here too
                    x: [1, 2],
                    o: [10, 20],
                    h: [100, 200],
                    l: [1000, 2000],
                    c: [19, 18]
                }
            ]
        }];

        var dataOut = [];
        Plots.supplyDataDefaults(dataIn, dataOut, {}, []);

        expect(dataOut[0].type).toEqual('box');
        expect(dataOut[1].type).toEqual('box');

        expect(dataOut[0].x).toEqual([2, 2, 2, 2, 2, 2]);
        expect(dataOut[0].y).toEqual([2000, 20, 18, 18, 18, 200]);

        expect(dataOut[1].x).toEqual([1, 1, 1, 1, 1, 1]);
        expect(dataOut[1].y).toEqual([1000, 10, 19, 19, 19, 100]);

        // default style keys
        expect(
            R.pick(['fillcolor', 'line', 'name', 'opacity'], dataOut[0])
        ).toEqual({
            name: 'high',
            opacity: 1,
            fillcolor: '#1A9B4E',
            line: {
                color: '#1A9B4E',
                width: 2
            }
        });

        expect(
            R.pick(['fillcolor', 'line', 'name', 'opacity'], dataOut[1])
        ).toEqual({
            name: 'low',
            opacity: 1,
            fillcolor: '#D74624',
            line: {
                color: '#D74624',
                width: 2
            }
        });

    });

});
