var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test shapes:', function() {
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

    function countShapePaths() {
        return d3.selectAll('.shapelayer > path').size();
    }

    describe('DOM', function() {
        it('has one *shapelayer* node', function() {
            expect(countShapeLayers()).toEqual(1);
        });

        it('has as many *path* nodes as there are shapes', function() {
            expect(countShapePaths()).toEqual(mock.layout.shapes.length);
        });

        it('should be able to get relayout', function(done) {
            expect(countShapeLayers()).toEqual(1);
            expect(countShapePaths()).toEqual(mock.layout.shapes.length);

            Plotly.relayout(gd, {height: 200, width: 400}).then(function() {
                expect(countShapeLayers()).toEqual(1);
                expect(countShapePaths()).toEqual(mock.layout.shapes.length);
            }).then(done);
        });
    });

    function countShapes(gd) {
        return gd.layout.shapes ?
            gd.layout.shapes.length :
            0;
    }

    function getLastShape(gd) {
        return gd.layout.shapes ?
            gd.layout.shapes[gd.layout.shapes.length - 1] :
            null;
    }

    function getRandomShape() {
        return {
            x0: Math.random(),
            y0: Math.random(),
            x1: Math.random(),
            y1: Math.random()
        };
    }

    describe('Plotly.relayout', function() {
        it('should be able to add a shape', function(done) {
            var index = countShapes(gd);
            var shape = getRandomShape();

            Plotly.relayout(gd, 'shapes[' + index + ']', shape).then(function() {
                expect(getLastShape(gd)).toEqual(shape);
                expect(countShapes(gd)).toEqual(index + 1);
            }).then(done);
        });

        it('should be able to remove a shape', function(done) {
            var index = countShapes(gd);
            var shape = getRandomShape();

            Plotly.relayout(gd, 'shapes[' + index + ']', shape).then(function() {
                expect(getLastShape(gd)).toEqual(shape);
                expect(countShapes(gd)).toEqual(index + 1);
            }).then(function() {
                Plotly.relayout(gd, 'shapes[' + index + ']', 'remove');
            }).then(function() {
                expect(countShapes(gd)).toEqual(index);
            }).then(done);
        });
    });
});
