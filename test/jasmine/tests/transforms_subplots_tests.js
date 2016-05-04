var R = require('ramda');
var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('@assets/create_graph_div');
var destroyGraphDiv = require('@assets/destroy_graph_div');

Plotly.register([
    require('@assets/transforms/subplots')
]);

describe('subplots transform', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('supplyDataDefaults should apply the transform', function() {

        var dataIn = [
            {
                x: [1, 2, 10, 20],
                y: [1, 2, 10, 20],
                transforms: [
                    {
                        type: 'groupby',
                        groups: ['a', 'a', 'b', 'b'],
                        groupColors: { a: 'red', b: 'blue' }
                    },
                    {
                        type: 'subplots',
                        orientation: 'rows' // columns, wrapped
                    }
                ]
            }
        ];

        var layout = {};
        var dataOut = [];
        Plots.supplyDataDefaults(dataIn, dataOut, layout, []);

        expect(
            R.pick(['x', 'xaxis', 'yaxis'], dataOut[0])
        ).toEqual({
            x: [1, 2],
            xaxis: 'x',
            yaxis: 'y'
        });

        expect(
            R.pick(['x', 'xaxis', 'yaxis'], dataOut[1])
        ).toEqual({
            x: [10, 20],
            xaxis: 'x2',
            yaxis: 'y2'
        });

        expect(R.pick(['domain'], layout.xaxis1)).toEqual({
            domain: [0, 1]
        });
        expect(R.pick(['domain'], layout.xaxis2)).toEqual({
            domain: [0, 1]
        });
        expect(R.pick(['domain'], layout.yaxis1)).toEqual({
            domain: [0, 0.45]
        });
        expect(R.pick(['domain'], layout.yaxis2)).toEqual({
            domain: [0.55, 1]
        });

    });

});
