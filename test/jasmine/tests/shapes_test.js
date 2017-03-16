var Shapes = require('@src/components/shapes');
var helpers = require('@src/components/shapes/helpers');
var constants = require('@src/components/shapes/constants');

var Plotly = require('@lib/index');
var PlotlyInternal = require('@src/plotly');
var Lib = require('@src/lib');

var Plots = PlotlyInternal.Plots;
var Axes = PlotlyInternal.Axes;

var d3 = require('d3');
var customMatchers = require('../assets/custom_matchers');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var drag = require('../assets/drag');


describe('Test shapes defaults:', function() {
    'use strict';

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    function _supply(layoutIn, layoutOut) {
        layoutOut = layoutOut || {};
        layoutOut._has = Plots._hasPlotType.bind(layoutOut);

        Shapes.supplyLayoutDefaults(layoutIn, layoutOut);

        return layoutOut.shapes;
    }

    it('should skip non-array containers', function() {
        [null, undefined, {}, 'str', 0, false, true].forEach(function(cont) {
            var msg = '- ' + JSON.stringify(cont);
            var layoutIn = { shapes: cont };
            var out = _supply(layoutIn);

            expect(layoutIn.shapes).toBe(cont, msg);
            expect(out).toEqual([], msg);
        });
    });

    it('should make non-object item visible: false', function() {
        var shapes = [null, undefined, [], 'str', 0, false, true];
        var layoutIn = { shapes: shapes };
        var out = _supply(layoutIn);

        expect(layoutIn.shapes).toEqual(shapes);

        out.forEach(function(item, i) {
            expect(item).toEqual({
                visible: false,
                _input: {},
                _index: i
            });
        });
    });

    it('should provide the right defaults on all axis types', function() {
        var fullLayout = {
            xaxis: {type: 'linear', range: [0, 20]},
            yaxis: {type: 'log', range: [1, 5]},
            xaxis2: {type: 'date', range: ['2006-06-05', '2006-06-09']},
            yaxis2: {type: 'category', range: [-0.5, 7.5]}
        };

        Axes.setConvert(fullLayout.xaxis);
        Axes.setConvert(fullLayout.yaxis);
        Axes.setConvert(fullLayout.xaxis2);
        Axes.setConvert(fullLayout.yaxis2);

        var shape1In = {type: 'rect'},
            shape2In = {type: 'circle', xref: 'x2', yref: 'y2'};

        var layoutIn = {
            shapes: [shape1In, shape2In]
        };

        _supply(layoutIn, fullLayout);

        var shape1Out = fullLayout.shapes[0],
            shape2Out = fullLayout.shapes[1];

        // default positions are 1/4 and 3/4 of the full range of that axis
        expect(shape1Out.x0).toBe(5);
        expect(shape1Out.x1).toBe(15);

        // shapes use data values for log axes (like everyone will in V2.0)
        expect(shape1Out.y0).toBeWithin(100, 0.001);
        expect(shape1Out.y1).toBeWithin(10000, 0.001);

        // date strings also interpolate
        expect(shape2Out.x0).toBe('2006-06-06');
        expect(shape2Out.x1).toBe('2006-06-08');

        // categories must use serial numbers to get continuous values
        expect(shape2Out.y0).toBeWithin(1.5, 0.001);
        expect(shape2Out.y1).toBeWithin(5.5, 0.001);
    });
});

function countShapesInLowerLayer(gd) {
    return gd._fullLayout.shapes.filter(isShapeInLowerLayer).length;
}

function countShapesInUpperLayer(gd) {
    return gd._fullLayout.shapes.filter(isShapeInUpperLayer).length;
}

function countShapesInSubplots(gd) {
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
    return d3.selectAll('.layer-below > .shapelayer').size();
}

function countShapeUpperLayerNodes() {
    return d3.selectAll('.layer-above > .shapelayer').size();
}

function countShapeLayerNodesInSubplots() {
    return d3.selectAll('.layer-subplot').size();
}

function countSubplots(gd) {
    return Object.keys(gd._fullLayout._plots || {}).length;
}

function countShapePathsInLowerLayer() {
    return d3.selectAll('.layer-below > .shapelayer > path').size();
}

function countShapePathsInUpperLayer() {
    return d3.selectAll('.layer-above > .shapelayer > path').size();
}

function countShapePathsInSubplots() {
    return d3.selectAll('.layer-subplot > .shapelayer > path').size();
}

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

    describe('*shapeLowerLayer*', function() {
        it('has one node', function() {
            expect(countShapeLowerLayerNodes()).toEqual(1);
        });

        it('has as many *path* nodes as shapes in the lower layer', function() {
            expect(countShapePathsInLowerLayer())
                .toEqual(countShapesInLowerLayer(gd));
        });

        it('should be able to get relayout', function(done) {
            Plotly.relayout(gd, {height: 200, width: 400}).then(function() {
                expect(countShapeLowerLayerNodes()).toEqual(1);
                expect(countShapePathsInLowerLayer())
                    .toEqual(countShapesInLowerLayer(gd));
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('*shapeUpperLayer*', function() {
        it('has one node', function() {
            expect(countShapeUpperLayerNodes()).toEqual(1);
        });

        it('has as many *path* nodes as shapes in the upper layer', function() {
            expect(countShapePathsInUpperLayer())
                .toEqual(countShapesInUpperLayer(gd));
        });

        it('should be able to get relayout', function(done) {
            Plotly.relayout(gd, {height: 200, width: 400}).then(function() {
                expect(countShapeUpperLayerNodes()).toEqual(1);
                expect(countShapePathsInUpperLayer())
                    .toEqual(countShapesInUpperLayer(gd));
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('each *subplot*', function() {
        it('has one *shapelayer*', function() {
            expect(countShapeLayerNodesInSubplots())
                .toEqual(countSubplots(gd));
        });

        it('has as many *path* nodes as shapes in the subplot', function() {
            expect(countShapePathsInSubplots())
                .toEqual(countShapesInSubplots(gd));
        });

        it('should be able to get relayout', function(done) {
            Plotly.relayout(gd, {height: 200, width: 400}).then(function() {
                expect(countShapeLayerNodesInSubplots())
                    .toEqual(countSubplots(gd));
                expect(countShapePathsInSubplots())
                    .toEqual(countShapesInSubplots(gd));
            })
            .catch(failTest)
            .then(done);
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

                // add a shape not at the end of the array
                return Plotly.relayout(gd, 'shapes[0]', getRandomShape());
            })
            .then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(pathCount + 2);
                expect(getLastShape(gd)).toEqual(shape);
                expect(countShapes(gd)).toEqual(index + 2);
            })
            .catch(failTest)
            .then(done);
        });

        it('should be able to remove a shape', function(done) {
            var pathCount = countShapePathsInUpperLayer();
            var index = countShapes(gd);
            var shape = getRandomShape();

            Plotly.relayout(gd, 'shapes[' + index + ']', shape).then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(pathCount + 1);
                expect(getLastShape(gd)).toEqual(shape);
                expect(countShapes(gd)).toEqual(index + 1);

                return Plotly.relayout(gd, 'shapes[' + index + ']', 'remove');
            })
            .then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(pathCount);
                expect(countShapes(gd)).toEqual(index);

                return Plotly.relayout(gd, 'shapes[2].visible', false);
            })
            .then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(pathCount - 1);
                expect(countShapes(gd)).toEqual(index);

                return Plotly.relayout(gd, 'shapes[1]', null);
            })
            .then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(pathCount - 2);
                expect(countShapes(gd)).toEqual(index - 1);
            })
            .catch(failTest)
            .then(done);
        });

        it('should be able to remove all shapes', function(done) {
            Plotly.relayout(gd, { shapes: null }).then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(0);
                expect(countShapePathsInLowerLayer()).toEqual(0);
                expect(countShapePathsInSubplots()).toEqual(0);
            })
            .then(function() {
                return Plotly.relayout(gd, {'shapes[0]': getRandomShape()});
            })
            .then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(1);
                expect(countShapePathsInLowerLayer()).toEqual(0);
                expect(countShapePathsInSubplots()).toEqual(0);
                expect(gd.layout.shapes.length).toBe(1);

                return Plotly.relayout(gd, {'shapes[0]': null});
            })
            .then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(0);
                expect(countShapePathsInLowerLayer()).toEqual(0);
                expect(countShapePathsInSubplots()).toEqual(0);
                expect(gd.layout.shapes).toBeUndefined();
            })
            .catch(failTest)
            .then(done);
        });

        it('can replace the shapes array', function(done) {
            Plotly.relayout(gd, { shapes: [
                getRandomShape(),
                getRandomShape()
            ]}).then(function() {
                expect(countShapePathsInUpperLayer()).toEqual(2);
                expect(countShapePathsInLowerLayer()).toEqual(0);
                expect(countShapePathsInSubplots()).toEqual(0);
                expect(gd.layout.shapes.length).toBe(2);
            })
            .catch(failTest)
            .then(done);
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
            })
            .catch(failTest)
            .then(done);
        });
    });
});

describe('shapes axis reference changes', function() {
    'use strict';

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        Plotly.plot(gd, [
            {y: [1, 2, 3]},
            {y: [1, 2, 3], yaxis: 'y2'}
        ], {
            yaxis: {domain: [0, 0.4]},
            yaxis2: {domain: [0.6, 1]},
            shapes: [{
                xref: 'x', yref: 'paper', type: 'rect',
                x0: 0.8, x1: 1.2, y0: 0, y1: 1,
                fillcolor: '#eee', layer: 'below'
            }]
        }).then(done);
    });

    afterEach(destroyGraphDiv);

    function getShape(index) {
        var s = d3.selectAll('path[data-index="' + index + '"]');
        expect(s.size()).toBe(1);
        return s;
    }

    it('draws the right number of objects and updates clip-path correctly', function(done) {

        expect(getShape(0).attr('clip-path') || '').toMatch(/x\)$/);

        Plotly.relayout(gd, {
            'shapes[0].xref': 'paper',
            'shapes[0].x0': 0.2,
            'shapes[0].x1': 0.6
        })
        .then(function() {
            expect(getShape(0).attr('clip-path')).toBe(null);

            return Plotly.relayout(gd, {
                'shapes[0].yref': 'y2',
                'shapes[0].y0': 1.8,
                'shapes[0].y1': 2.2,
            });
        })
        .then(function() {
            expect(getShape(0).attr('clip-path') || '').toMatch(/^[^x]+y2\)$/);

            return Plotly.relayout(gd, {
                'shapes[0].xref': 'x',
                'shapes[0].x0': 1.5,
                'shapes[0].x1': 20
            });
        })
        .then(function() {
            expect(getShape(0).attr('clip-path') || '').toMatch(/xy2\)$/);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('shapes edge cases', function() {
    'use strict';

    var gd;

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    it('falls back on shapeLowerLayer for below missing subplots', function(done) {
        Plotly.newPlot(gd, [
            {x: [1, 3], y: [1, 3]},
            {x: [1, 3], y: [1, 3], xaxis: 'x2', yaxis: 'y2'}
        ], {
            xaxis: {domain: [0, 0.5]},
            yaxis: {domain: [0, 0.5]},
            xaxis2: {domain: [0.5, 1], anchor: 'y2'},
            yaxis2: {domain: [0.5, 1], anchor: 'x2'},
            shapes: [{
                x0: 1, x1: 2, y0: 1, y1: 2, type: 'circle',
                layer: 'below',
                xref: 'x',
                yref: 'y2'
            }, {
                x0: 1, x1: 2, y0: 1, y1: 2, type: 'circle',
                layer: 'below',
                xref: 'x2',
                yref: 'y'
            }]
        }).then(function() {
            expect(countShapePathsInLowerLayer()).toBe(2);
            expect(countShapePathsInUpperLayer()).toBe(0);
            expect(countShapePathsInSubplots()).toBe(0);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('shapes autosize', function() {
    'use strict';

    var gd;

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    afterEach(destroyGraphDiv);

    it('should adapt to relayout calls', function(done) {
        gd = createGraphDiv();

        var mock = {
            data: [{}],
            layout: {
                shapes: [{
                    type: 'line',
                    x0: 0,
                    y0: 0,
                    x1: 1,
                    y1: 1
                }, {
                    type: 'line',
                    x0: 0,
                    y0: 0,
                    x1: 2,
                    y1: 2
                }]
            }
        };

        function assertRanges(x, y) {
            var fullLayout = gd._fullLayout;
            var PREC = 1;

            expect(fullLayout.xaxis.range).toBeCloseToArray(x, PREC, '- xaxis');
            expect(fullLayout.yaxis.range).toBeCloseToArray(y, PREC, '- yaxis');
        }

        Plotly.plot(gd, mock).then(function() {
            assertRanges([0, 2], [0, 2]);

            return Plotly.relayout(gd, { 'shapes[1].visible': false });
        })
        .then(function() {
            assertRanges([0, 1], [0, 1]);

            return Plotly.relayout(gd, { 'shapes[1].visible': true });
        })
        .then(function() {
            assertRanges([0, 2], [0, 2]);

            return Plotly.relayout(gd, { 'shapes[0].x1': 3 });
        })
        .then(function() {
            assertRanges([0, 3], [0, 2]);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Test shapes: a plot with shapes and an overlaid axis', function() {
    'use strict';

    var gd, data, layout;

    beforeEach(function() {
        gd = createGraphDiv();

        data = [{
            'y': [1934.5, 1932.3, 1930.3],
            'x': ['1947-01-01', '1947-04-01', '1948-07-01'],
            'type': 'scatter'
        }];

        layout = {
            'yaxis': {
                'type': 'linear'
            },
            'xaxis': {
                'type': 'date'
            },
            'yaxis2': {
                'side': 'right',
                'overlaying': 'y'
            },
            'shapes': [{
                'fillcolor': '#ccc',
                'type': 'rect',
                'x0': '1947-01-01',
                'x1': '1947-04-01',
                'xref': 'x',
                'y0': 0,
                'y1': 1,
                'yref': 'paper',
                'layer': 'below'
            }]
        };
    });

    afterEach(destroyGraphDiv);

    it('should not throw an exception', function(done) {
        Plotly.plot(gd, data, layout)
        .catch(failTest)
        .then(done);
    });
});

describe('Test shapes', function() {
    'use strict';

    var gd, data, layout, config;

    beforeEach(function() {
        gd = createGraphDiv();
        data = [{}];
        layout = {};
        config = {
            editable: true,
            displayModeBar: false
        };
    });

    afterEach(destroyGraphDiv);

    var testCases = [
        // xref: 'paper', yref: 'paper'
        {
            title: 'linked to paper'
        },

        // xaxis.type: 'linear', yaxis.type: 'log'
        {
            title: 'linked to linear and log axes',
            xaxis: { type: 'linear', range: [0, 10] },
            yaxis: { type: 'log', range: [Math.log10(1), Math.log10(1000)] }
        },

        // xaxis.type: 'date', yaxis.type: 'category'
        {
            title: 'linked to date and category axes',
            xaxis: {
                type: 'date',
                range: ['2000-01-01', '2000-02-02']
            },
            yaxis: { type: 'category', range: ['a', 'b'] }
        }
    ];

    testCases.forEach(function(testCase) {
        it(testCase.title + 'should be draggable', function(done) {
            setupLayout(testCase);
            testDragEachShape(done);
        });
    });

    testCases.forEach(function(testCase) {
        ['n', 's', 'w', 'e', 'nw', 'se', 'ne', 'sw'].forEach(function(direction) {
            var testTitle = testCase.title +
                'should be resizeable over direction ' +
                direction;
            it(testTitle, function(done) {
                setupLayout(testCase);
                testResizeEachShape(direction, done);
            });
        });
    });

    function setupLayout(testCase) {
        Lib.extendDeep(layout, testCase);

        var xrange = testCase.xaxis ? testCase.xaxis.range : [0.25, 0.75],
            yrange = testCase.yaxis ? testCase.yaxis.range : [0.25, 0.75],
            xref = testCase.xaxis ? 'x' : 'paper',
            yref = testCase.yaxis ? 'y' : 'paper',
            x0 = xrange[0],
            x1 = xrange[1],
            y0 = yrange[0],
            y1 = yrange[1];

        if(testCase.xaxis && testCase.xaxis.type === 'log') {
            x0 = Math.pow(10, x0);
            x1 = Math.pow(10, x1);
        }

        if(testCase.yaxis && testCase.yaxis.type === 'log') {
            y0 = Math.pow(10, y0);
            y1 = Math.pow(10, y1);
        }

        if(testCase.xaxis && testCase.xaxis.type === 'category') {
            x0 = 0;
            x1 = 1;
        }

        if(testCase.yaxis && testCase.yaxis.type === 'category') {
            y0 = 0;
            y1 = 1;
        }

        var x0y0 = x0 + ',' + y0,
            x1y1 = x1 + ',' + y1,
            x1y0 = x1 + ',' + y0;

        var layoutShapes = [
            { type: 'line' },
            { type: 'rect' },
            { type: 'circle' },
            {}  // path
        ];

        layoutShapes.forEach(function(s) {
            s.xref = xref;
            s.yref = yref;

            if(s.type) {
                s.x0 = x0;
                s.x1 = x1;
                s.y0 = y0;
                s.y1 = y1;
            }
            else {
                s.path = 'M' + x0y0 + 'L' + x1y1 + 'L' + x1y0 + 'Z';
            }
        });

        layout.shapes = layoutShapes;
    }

    function testDragEachShape(done) {
        var promise = Plotly.plot(gd, data, layout, config);

        var layoutShapes = gd.layout.shapes;

        expect(layoutShapes.length).toBe(4);  // line, rect, circle and path

        layoutShapes.forEach(function(layoutShape, index) {
            var dx = 100,
                dy = 100;
            promise = promise.then(function() {
                var node = getShapeNode(index);
                expect(node).not.toBe(null);

                return (layoutShape.path) ?
                    testPathDrag(dx, dy, layoutShape, node) :
                    testShapeDrag(dx, dy, layoutShape, node);
            });
        });

        return promise.then(done);
    }

    function testResizeEachShape(direction, done) {
        var promise = Plotly.plot(gd, data, layout, config);

        var layoutShapes = gd.layout.shapes;

        expect(layoutShapes.length).toBe(4);  // line, rect, circle and path

        var dxToShrinkWidth = {
                n: 0, s: 0, w: 10, e: -10, nw: 10, se: -10, ne: -10, sw: 10
            },
            dyToShrinkHeight = {
                n: 10, s: -10, w: 0, e: 0, nw: 10, se: -10, ne: 10, sw: -10
            };
        layoutShapes.forEach(function(layoutShape, index) {
            if(layoutShape.path) return;

            var dx = dxToShrinkWidth[direction],
                dy = dyToShrinkHeight[direction];

            promise = promise.then(function() {
                var node = getShapeNode(index);
                expect(node).not.toBe(null);

                return testShapeResize(direction, dx, dy, layoutShape, node);
            });

            promise = promise.then(function() {
                var node = getShapeNode(index);
                expect(node).not.toBe(null);

                return testShapeResize(direction, -dx, -dy, layoutShape, node);
            });
        });

        return promise.then(done);
    }

    function getShapeNode(index) {
        return d3.selectAll('.shapelayer path').filter(function() {
            return +this.getAttribute('data-index') === index;
        }).node();
    }

    function testShapeDrag(dx, dy, layoutShape, node) {
        var xa = Axes.getFromId(gd, layoutShape.xref),
            ya = Axes.getFromId(gd, layoutShape.yref),
            x2p = helpers.getDataToPixel(gd, xa),
            y2p = helpers.getDataToPixel(gd, ya, true);

        var initialCoordinates = getShapeCoordinates(layoutShape, x2p, y2p);

        return drag(node, dx, dy).then(function() {
            var finalCoordinates = getShapeCoordinates(layoutShape, x2p, y2p);

            expect(finalCoordinates.x0 - initialCoordinates.x0).toBeCloseTo(dx);
            expect(finalCoordinates.x1 - initialCoordinates.x1).toBeCloseTo(dx);
            expect(finalCoordinates.y0 - initialCoordinates.y0).toBeCloseTo(dy);
            expect(finalCoordinates.y1 - initialCoordinates.y1).toBeCloseTo(dy);
        });
    }

    function getShapeCoordinates(layoutShape, x2p, y2p) {
        return {
            x0: x2p(layoutShape.x0),
            x1: x2p(layoutShape.x1),
            y0: y2p(layoutShape.y0),
            y1: y2p(layoutShape.y1)
        };
    }

    function testPathDrag(dx, dy, layoutShape, node) {
        var xa = Axes.getFromId(gd, layoutShape.xref),
            ya = Axes.getFromId(gd, layoutShape.yref),
            x2p = helpers.getDataToPixel(gd, xa),
            y2p = helpers.getDataToPixel(gd, ya, true);

        var initialPath = layoutShape.path,
            initialCoordinates = getPathCoordinates(initialPath, x2p, y2p);

        expect(initialCoordinates.length).toBe(6);

        return drag(node, dx, dy).then(function() {
            var finalPath = layoutShape.path,
                finalCoordinates = getPathCoordinates(finalPath, x2p, y2p);

            expect(finalCoordinates.length).toBe(initialCoordinates.length);

            for(var i = 0; i < initialCoordinates.length; i++) {
                var initialCoordinate = initialCoordinates[i],
                    finalCoordinate = finalCoordinates[i];

                if(initialCoordinate.x) {
                    expect(finalCoordinate.x - initialCoordinate.x)
                        .toBeCloseTo(dx);
                }
                else {
                    expect(finalCoordinate.y - initialCoordinate.y)
                        .toBeCloseTo(dy);
                }
            }
        });
    }

    function testShapeResize(direction, dx, dy, layoutShape, node) {
        var xa = Axes.getFromId(gd, layoutShape.xref),
            ya = Axes.getFromId(gd, layoutShape.yref),
            x2p = helpers.getDataToPixel(gd, xa),
            y2p = helpers.getDataToPixel(gd, ya, true);

        var initialCoordinates = getShapeCoordinates(layoutShape, x2p, y2p);

        return drag(node, dx, dy, direction).then(function() {
            var finalCoordinates = getShapeCoordinates(layoutShape, x2p, y2p);

            var keyN, keyS, keyW, keyE;
            if(initialCoordinates.y0 < initialCoordinates.y1) {
                keyN = 'y0'; keyS = 'y1';
            }
            else {
                keyN = 'y1'; keyS = 'y0';
            }
            if(initialCoordinates.x0 < initialCoordinates.x1) {
                keyW = 'x0'; keyE = 'x1';
            }
            else {
                keyW = 'x1'; keyE = 'x0';
            }

            if(~direction.indexOf('n')) {
                expect(finalCoordinates[keyN] - initialCoordinates[keyN])
                    .toBeCloseTo(dy);
            }
            else if(~direction.indexOf('s')) {
                expect(finalCoordinates[keyS] - initialCoordinates[keyS])
                    .toBeCloseTo(dy);
            }

            if(~direction.indexOf('w')) {
                expect(finalCoordinates[keyW] - initialCoordinates[keyW])
                    .toBeCloseTo(dx);
            }
            else if(~direction.indexOf('e')) {
                expect(finalCoordinates[keyE] - initialCoordinates[keyE])
                    .toBeCloseTo(dx);
            }
        });
    }

    function getPathCoordinates(pathString, x2p, y2p) {
        var coordinates = [];

        pathString.match(constants.segmentRE).forEach(function(segment) {
            var paramNumber = 0,
                segmentType = segment.charAt(0),
                xParams = constants.paramIsX[segmentType],
                yParams = constants.paramIsY[segmentType],
                nParams = constants.numParams[segmentType],
                params = segment.substr(1).match(constants.paramRE);

            if(params) {
                params.forEach(function(param) {
                    if(paramNumber >= nParams) return;

                    if(xParams[paramNumber]) {
                        coordinates.push({ x: x2p(param) });
                    }
                    else if(yParams[paramNumber]) {
                        coordinates.push({ y: y2p(param) });
                    }

                    paramNumber++;
                });
            }
        });

        return coordinates;
    }
});
