var Plotly = require('@lib/core');
var Contour = require('@lib/contour');

var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('Bundle with contour', function() {
    'use strict';

    Plotly.register(Contour);

    var mock = require('@mocks/contour_log.json');

    beforeEach(function(done) {
        Plotly.newPlot(createGraphDiv(), mock.data, mock.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should graph contour traces', function() {
        var nodes = d3SelectAll('g.contour');

        expect(nodes.size()).toEqual(4);
    });
});
