var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test shapes nodes', function() {
    'use strict';

    var mock = require('@mocks/shapes.json');
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockData = Lib.extendDeep([], mock.data),
            mockLayout = Lib.extendDeep({}, mock.layout);

        Plotly.plot(gd, mockData, mockLayout).then(done);
    });

    afterEach(destroyGraphDiv);

    function countShapeLayers() {
        return d3.selectAll('.shapelayer').size();
    }

    function countPaths() {
        return d3.selectAll('.shapelayer > path').size();
    }

    it('has one *shapelayer* node', function() {
        expect(countShapeLayers()).toEqual(1);
    });

    it('has as many *path* nodes as there are shapes', function() {
        expect(countPaths()).toEqual(mock.layout.shapes.length);
    });

    it('should be able to get relayout', function(done) {
        expect(countShapeLayers()).toEqual(1);
        expect(countPaths()).toEqual(mock.layout.shapes.length);

        Plotly.relayout(gd, {height: 200, width: 400}).then(function() {
            expect(countShapeLayers()).toEqual(1);
            expect(countPaths()).toEqual(mock.layout.shapes.length);
            done();
        });
    });
});
