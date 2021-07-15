var Plotly = require('@lib/core');
var Bar = require('@lib/bar');

var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('Bundle with bar', function() {
    'use strict';

    Plotly.register(Bar);

    var mock = require('@mocks/0.json');

    beforeEach(function(done) {
        Plotly.newPlot(createGraphDiv(), mock.data, mock.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should graph bar traces', function() {
        var nodes = d3SelectAll('g.trace.bars');

        expect(nodes.size()).toEqual(3);
    });
});
