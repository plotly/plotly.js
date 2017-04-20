var d3 = require('d3');

var Plotly = require('@lib/index');
var Fx = require('@src/components/fx');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('spikeline', function() {
    'use strict';

    var mock = require('@mocks/19.json');

    afterEach(destroyGraphDiv);

    describe('hover', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.layout.xaxis.showspikes = true;
        mockCopy.layout.xaxis.spikemode = 'toaxis';
        mockCopy.layout.yaxis.showspikes = true;
        mockCopy.layout.yaxis.spikemode = 'toaxis+marker';
        mockCopy.layout.xaxis2.showspikes = true;
        mockCopy.layout.xaxis2.spikemode = 'toaxis';
        mockCopy.layout.hovermode = 'closest';
        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('draws lines and markers on enabled axes', function() {
            Fx.hover('graph', {xval: 2, yval: 3}, 'xy');
            expect(d3.selectAll('line.spikeline').size()).toEqual(4);
            expect(d3.selectAll('circle.spikeline').size()).toEqual(1);
        });

        it('doesn\'t draw lines and markers on disabled axes', function() {
            Fx.hover('graph', {xval: 30, yval: 40}, 'x2y2');
            expect(d3.selectAll('line.spikeline').size()).toEqual(2);
            expect(d3.selectAll('circle.spikeline').size()).toEqual(0);
        });
    });
});
