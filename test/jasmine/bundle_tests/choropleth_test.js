var d3 = require('d3');

var Plotly = require('@lib/core');
var PlotlyChoropleth = require('@lib/choropleth');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Bundle with choropleth', function() {
    'use strict';

    Plotly.register(PlotlyChoropleth);

    var mock = require('@mocks/geo_multiple-usa-choropleths.json');

    beforeEach(function(done) {
        Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should graph choropleth traces', function() {
        var nodes = d3.selectAll('g.trace.choropleth');

        expect(nodes.size()).toEqual(4);
    });
});
