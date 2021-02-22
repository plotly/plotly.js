var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('@lib/core');
var PlotlyContour = require('@lib/contour');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Bundle with contour', function() {
    'use strict';

    Plotly.register(PlotlyContour);

    var mock = require('@mocks/contour_scatter.json');

    beforeEach(function(done) {
        Plotly.newPlot(createGraphDiv(), mock.data, mock.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should graph scatter traces', function() {
        var nodes = d3SelectAll('g.trace.scatter');

        expect(nodes.size()).toEqual(1);
    });

    it('should graph contour traces', function() {
        var nodes = d3SelectAll('g.contour');

        expect(nodes.size()).toEqual(1);
    });
});
