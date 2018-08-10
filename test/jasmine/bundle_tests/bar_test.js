var d3 = require('d3');

var Plotly = require('@lib/core');
var PlotlyBar = require('@lib/bar');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Bundle with bar', function() {
    'use strict';

    Plotly.register(PlotlyBar);

    var mock = require('@mocks/bar_line.json');

    beforeEach(function(done) {
        Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should graph scatter traces', function() {
        var nodes = d3.selectAll('g.trace.scatter');

        expect(nodes.size()).toEqual(1);
    });

    it('should graph bar traces', function() {
        var nodes = d3.selectAll('g.trace.bars');

        expect(nodes.size()).toEqual(1);
    });
});
