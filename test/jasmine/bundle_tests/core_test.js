var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('@lib/core');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Bundle with core only', function() {
    'use strict';
    var gd;

    var mock = require('@mocks/bar_line.json');

    beforeEach(function(done) {
        gd = createGraphDiv();
        Plotly.newPlot(gd, mock.data, mock.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should graph scatter traces', function() {
        var nodes = d3SelectAll('g.trace.scatter');

        expect(nodes.size()).toEqual(mock.data.length);
    });

    it('should not graph bar traces', function() {
        var nodes = d3SelectAll('g.trace.bars');

        expect(nodes.size()).toEqual(0);
    });

    it('should not have calendar attributes', function() {
        // calendars is a register-able component that we have not registered
        expect(gd._fullLayout.calendar).toBeUndefined();
        expect(gd._fullLayout.xaxis.calendar).toBeUndefined();
        expect(gd._fullData[0].xcalendar).toBeUndefined();
    });
});
