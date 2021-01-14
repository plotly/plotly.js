var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('@lib/core');
var PlotlyChoropleth = require('@lib/choropleth');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


var LONG_TIMEOUT_INTERVAL = 5 * jasmine.DEFAULT_TIMEOUT_INTERVAL;


describe('Bundle with choropleth', function() {
    'use strict';

    Plotly.register(PlotlyChoropleth);

    var gd;

    var mock = require('@mocks/geo_multiple-usa-choropleths.json');

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should graph choropleth traces', function(done) {
        Plotly.newPlot(gd, mock.data, mock.layout)
        .then(function() {
            var nodes = d3SelectAll('g.trace.choropleth');

            expect(nodes.size()).toEqual(4);
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);
});
