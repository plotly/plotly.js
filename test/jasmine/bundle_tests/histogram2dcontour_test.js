var d3 = require('d3');

var Plotly = require('@lib/core');
var PlotlyHistogram2dContour = require('@lib/histogram2dcontour');
var PlotlyHistogram = require('@lib/histogram');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Bundle with histogram2dcontour and histogram', function() {
    'use strict';

    Plotly.register([PlotlyHistogram2dContour, PlotlyHistogram]);

    var mock = require('@mocks/2dhistogram_contour_subplots.json');

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

    it('should graph histogram traces', function() {
        var nodes = d3.selectAll('g.bars');

        expect(nodes.size()).toEqual(2);
    });
});
