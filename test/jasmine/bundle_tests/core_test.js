var d3 = require('d3');

var Plotly = require('@lib/core');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Bundle with core only', function() {
    'use strict';

    var mock = require('@mocks/bar_line.json');

    beforeEach(function(done) {
        spyOn(console, 'warn');

        Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should graph scatter traces', function() {
        var nodes = d3.selectAll('g.trace.scatter');

        expect(nodes.size()).toEqual(mock.data.length);
    });

    it('should not graph bar traces', function() {
        var nodes = d3.selectAll('g.trace.bars');

        expect(nodes.size()).toEqual(0);
    });

    it('should warn users about unregistered bar trace type', function() {
        expect(console.warn).toHaveBeenCalled();
    });
});
