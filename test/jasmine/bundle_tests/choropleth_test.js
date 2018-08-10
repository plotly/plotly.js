var d3 = require('d3');

var Plotly = require('@lib/core');
var PlotlyChoropleth = require('@lib/choropleth');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

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
        Plotly.plot(gd, mock.data, mock.layout)
        .then(function() {
            var nodes = d3.selectAll('g.trace.choropleth');

            expect(nodes.size()).toEqual(4);
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);
});
