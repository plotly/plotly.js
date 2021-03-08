var Plotly = require('@lib/core');
var Scatter = require('@lib/scatter');
var Bar = require('@lib/bar');

var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('Bundle with bar', function() {
    'use strict';

    Plotly.register([Scatter, Bar]);

    var mock = require('@mocks/bar_line.json');

    beforeEach(function(done) {
        Plotly.newPlot(createGraphDiv(), mock.data, mock.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should graph scatter traces', function() {
        var nodes = d3SelectAll('g.trace.scatter');

        expect(nodes.size()).toEqual(1);
    });

    it('should graph bar traces', function() {
        var nodes = d3SelectAll('g.trace.bars');

        expect(nodes.size()).toEqual(1);
    });
});
