var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('../../../lib/core');
var PlotlyHistogram2dContour = require('../../../lib/histogram2dcontour');
var PlotlyHistogram = require('../../../lib/histogram');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Bundle with histogram2dcontour and histogram', function() {
    'use strict';

    Plotly.register([PlotlyHistogram2dContour, PlotlyHistogram]);

    var mock = require('../../image/mocks/2dhistogram_contour_subplots.json');

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

    it('should graph histogram traces', function() {
        var nodes = d3SelectAll('g.bars');

        expect(nodes.size()).toEqual(2);
    });
});
