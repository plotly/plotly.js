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

    function countShapesInLowerLayer() {
        return gd._fullLayout.shapes.filter(isShapeInLowerLayer).length;
    }

    function countShapesInUpperLayer() {
        return gd._fullLayout.shapes.filter(isShapeInUpperLayer).length;
    }

    function countShapesInSubplots() {
        return gd._fullLayout.shapes.filter(isShapeInSubplot).length;
    }

    function isShapeInUpperLayer(shape) {
        return shape.layer !== 'below';
    }

    function isShapeInLowerLayer(shape) {
        return (shape.xref === 'paper' && shape.yref === 'paper') &&
            !isShapeInUpperLayer(shape);
    }

    function isShapeInSubplot(shape) {
        return !isShapeInUpperLayer(shape) && !isShapeInLowerLayer(shape);
    }

    function countShapeLowerLayerNodes() {
        return d3.selectAll('.shapelayer-below').size();
    }

    function countShapeUpperLayerNodes() {
        return d3.selectAll('.shapelayer-above').size();
    }

    function countShapeLayerNodesInSubplots() {
        return d3.selectAll('.shapelayer-subplot').size();
    }

    function countSubplots(gd) {
        return Object.keys(gd._fullLayout._plots || {}).length;
    }

    function countShapePathsInLowerLayer() {
        return d3.selectAll('.shapelayer-below > path').size();
    }

    function countShapePathsInUpperLayer() {
        return d3.selectAll('.shapelayer-above > path').size();
    }

    function countShapePathsInSubplots() {
        return d3.selectAll('.shapelayer-subplot > path').size();
    }

    describe('*shapeLowerLayer*', function() {
        it('has one node', function() {
            expect(countShapeLowerLayerNodes()).toEqual(1);
        });

        it('has as many *path* nodes as shapes in the lower layer', function() {
            expect(countShapePathsInLowerLayer())
                .toEqual(countShapesInLowerLayer());
        });

        it('should be able to get relayout', function(done) {
            Plotly.relayout(gd, {height: 200, width: 400}).then(function() {
                expect(countShapeLowerLayerNodes()).toEqual(1);
                expect(countShapePathsInLowerLayer())
                    .toEqual(countShapesInLowerLayer());
            }).then(done);
        });
    });

    describe('*shapeUpperLayer*', function() {
        it('has one node', function() {
            expect(countShapeUpperLayerNodes()).toEqual(1);
        });

        it('has as many *path* nodes as shapes in the upper layer', function() {
            expect(countShapePathsInUpperLayer())
                .toEqual(countShapesInUpperLayer());
        });

        it('should be able to get relayout', function(done) {
            Plotly.relayout(gd, {height: 200, width: 400}).then(function() {
                expect(countShapeUpperLayerNodes()).toEqual(1);
                expect(countShapePathsInUpperLayer())
                    .toEqual(countShapesInUpperLayer());
            }).then(done);
        });
    });

    describe('each *subplot*', function() {
        it('has one *shapelayer*', function() {
            expect(countShapeLayerNodesInSubplots())
                .toEqual(countSubplots(gd));
        });

        it('has as many *path* nodes as shapes in the subplot', function() {
            expect(countShapePathsInSubplots())
                .toEqual(countShapesInSubplots());
        });

        it('should be able to get relayout', function(done) {
            Plotly.relayout(gd, {height: 200, width: 400}).then(function() {
                expect(countShapeLayerNodesInSubplots())
                    .toEqual(countSubplots(gd));
                expect(countShapePathsInSubplots())
                    .toEqual(countShapesInSubplots());
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
            var pathCount = countShapePathsInUpperLayer();
            var index = countShapes(gd);
            var shape = getRandomShape();

            Plotly.relayout(gd, 'shapes[' + index + ']', shape).then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(pathCount + 1);
                expect(getLastShape(gd)).toEqual(shape);
                expect(countShapes(gd)).toEqual(index + 1);
            }).then(done);
        });

        it('should be able to remove a shape', function(done) {
            var pathCount = countShapePathsInUpperLayer();
            var index = countShapes(gd);
            var shape = getRandomShape();

            Plotly.relayout(gd, 'shapes[' + index + ']', shape).then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(pathCount + 1);
                expect(getLastShape(gd)).toEqual(shape);
                expect(countShapes(gd)).toEqual(index + 1);
            }).then(function() {
                Plotly.relayout(gd, 'shapes[' + index + ']', 'remove');
            }).then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(pathCount);
                expect(countShapes(gd)).toEqual(index);
            }).then(done);
        });

        it('should be able to remove all shapes', function(done) {
            Plotly.relayout(gd, { shapes: [] }).then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(0);
                expect(countShapePathsInLowerLayer()).toEqual(0);
                expect(countShapePathsInSubplots()).toEqual(0);
            }).then(done);
        });

        it('should be able to update a shape layer', function(done) {
            var index = countShapes(gd),
                astr = 'shapes[' + index + ']',
                shape = getRandomShape(),
                shapesInLowerLayer = countShapePathsInLowerLayer(),
                shapesInUpperLayer = countShapePathsInUpperLayer();

            shape.xref = 'paper';
            shape.yref = 'paper';

            Plotly.relayout(gd, astr, shape).then(function() {
                expect(countShapePathsInLowerLayer())
                    .toEqual(shapesInLowerLayer);
                expect(countShapePathsInUpperLayer())
                    .toEqual(shapesInUpperLayer + 1);
                expect(getLastShape(gd)).toEqual(shape);
                expect(countShapes(gd)).toEqual(index + 1);
            }).then(function() {
                shape.layer = 'below';
                Plotly.relayout(gd, astr + '.layer', shape.layer);
            }).then(function() {
                expect(countShapePathsInLowerLayer())
                    .toEqual(shapesInLowerLayer + 1);
                expect(countShapePathsInUpperLayer())
                    .toEqual(shapesInUpperLayer);
                expect(getLastShape(gd)).toEqual(shape);
                expect(countShapes(gd)).toEqual(index + 1);
            }).then(function() {
                shape.layer = 'above';
                Plotly.relayout(gd, astr + '.layer', shape.layer);
            }).then(function() {
                expect(countShapePathsInLowerLayer())
                    .toEqual(shapesInLowerLayer);
                expect(countShapePathsInUpperLayer())
                    .toEqual(shapesInUpperLayer + 1);
                expect(getLastShape(gd)).toEqual(shape);
                expect(countShapes(gd)).toEqual(index + 1);
            }).then(done);
        });
    });
});
