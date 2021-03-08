var Plotly = require('@lib/core');
var Scatter = require('@lib/scatter');
var Histogram2dContour = require('@lib/histogram2dcontour');
var Histogram = require('@lib/histogram');

var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('Bundle with histogram2dcontour and histogram', function() {
    'use strict';

    Plotly.register([Scatter, Histogram2dContour, Histogram]);

    var mock = require('@mocks/2dhistogram_contour_subplots.json');

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
