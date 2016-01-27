var d3 = require('d3');

var Plotly = require('@lib/core');
var PlotlyContour = require('@lib/contour');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Bundle with contour', function() {
    'use strict';

    Plotly.register(PlotlyContour);

    var mock = require('@mocks/contour_scatter.json');

    beforeEach(function(done) {
        Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should graph scatter traces', function() {
        var nodes = d3.selectAll('g.trace.scatter');

        expect(nodes.size()).toEqual(1);
    });

    it('should graph contour traces', function() {
        var nodes = d3.selectAll('g.contour');

        expect(nodes.size()).toEqual(1);
    });
});
