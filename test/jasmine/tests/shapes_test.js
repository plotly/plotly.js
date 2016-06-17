var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var PlotlyInternal = require('@src/plotly');
var Axes = PlotlyInternal.Axes;

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
        Plotly.plot(gd, data, layout).then(done);
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
            title: 'linked to paper should be draggable'
        },

        // xaxis.type: 'linear', yaxis.type: 'log'
        {
            title: 'linked to linear and log axes should be draggable',
            xaxis: { type: 'linear', range: [0, 10] },
            yaxis: { type: 'log', range: [Math.log10(1), Math.log10(1000)] }
        },

        // xaxis.type: 'date', yaxis.type: 'category'
        {
            title: 'linked to date and category axes should be draggable',
            xaxis: { type: 'date', range: ['2000-01-01', '2000-01-02'] },
            yaxis: { type: 'category', range: ['a', 'b'] }
        }
    ];

    testCases.forEach(function(testCase) {
        it(testCase.title, function(done) {
            setupLayout(testCase);
            testAllShapes(done);
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

    function testAllShapes(done) {
        var promise = Plotly.plot(gd, data, layout, config);

        var layoutShapes = gd.layout.shapes;

        expect(layoutShapes.length).toBe(4);  // line, rect, circle and path

        layoutShapes.forEach(function(layoutShape, index) {
            promise = promise.then(function() {
                var node = getShapeNode(index);
                expect(node).not.toBe(null);

                return (layoutShape.path) ?
                    testPath(layoutShape, node) :
                    testShape(layoutShape, node);
            });
        });

        return promise.then(done);
    }

    function getShapeNode(index) {
        return d3.selectAll('.shapelayer')
            .selectAll('path[data-index="' + index + '"')
            .node();
    }

    function testShape(layoutShape, node) {
        var xa = Axes.getFromId(gd, layoutShape.xref),
            ya = Axes.getFromId(gd, layoutShape.yref),
            x2p = getDataToPixel(gd, xa),
            y2p = getDataToPixel(gd, ya, true);

        var initialCoordinates = getShapeCoordinates(layoutShape, x2p, y2p),
            dx = 100,
            dy = 100;

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

    function testPath(layoutShape, node) {
        var xa = Axes.getFromId(gd, layoutShape.xref),
            ya = Axes.getFromId(gd, layoutShape.yref),
            x2p = getDataToPixel(gd, xa),
            y2p = getDataToPixel(gd, ya, true);

        var initialPath = layoutShape.path,
            initialCoordinates = getPathCoordinates(initialPath, x2p, y2p),
            dx = 100,
            dy = 100;

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

    // Adapted from src/components/shapes/index.js
    var segmentRE = /[MLHVQCTSZ][^MLHVQCTSZ]*/g,
        paramRE = /[^\s,]+/g,

        // which numbers in each path segment are x (or y) values
        // drawn is which param is a drawn point, as opposed to a
        // control point (which doesn't count toward autorange.
        // TODO: this means curved paths could extend beyond the
        // autorange bounds. This is a bit tricky to get right
        // unless we revert to bounding boxes, but perhaps there's
        // a calculation we could do...)
        paramIsX = {
            M: {0: true, drawn: 0},
            L: {0: true, drawn: 0},
            H: {0: true, drawn: 0},
            V: {},
            Q: {0: true, 2: true, drawn: 2},
            C: {0: true, 2: true, 4: true, drawn: 4},
            T: {0: true, drawn: 0},
            S: {0: true, 2: true, drawn: 2},
            // A: {0: true, 5: true},
            Z: {}
        },

        paramIsY = {
            M: {1: true, drawn: 1},
            L: {1: true, drawn: 1},
            H: {},
            V: {0: true, drawn: 0},
            Q: {1: true, 3: true, drawn: 3},
            C: {1: true, 3: true, 5: true, drawn: 5},
            T: {1: true, drawn: 1},
            S: {1: true, 3: true, drawn: 5},
            // A: {1: true, 6: true},
            Z: {}
        },
        numParams = {
            M: 2,
            L: 2,
            H: 1,
            V: 1,
            Q: 4,
            C: 6,
            T: 2,
            S: 4,
            // A: 7,
            Z: 0
        };

    function getPathCoordinates(pathString, x2p, y2p) {
        var coordinates = [];

        pathString.match(segmentRE).forEach(function(segment) {
            var paramNumber = 0,
                segmentType = segment.charAt(0),
                xParams = paramIsX[segmentType],
                yParams = paramIsY[segmentType],
                nParams = numParams[segmentType],
                params = segment.substr(1).match(paramRE);

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


// getDataToPixel and decodeDate
// adapted from src/components/shapes.index.js
function getDataToPixel(gd, axis, isVertical) {
    var gs = gd._fullLayout._size,
        dataToPixel;

    if(axis) {
        var d2l = axis.type === 'category' ? axis.c2l : axis.d2l;

        dataToPixel = function(v) {
            return axis._offset + axis.l2p(d2l(v, true));
        };

        if(axis.type === 'date') dataToPixel = decodeDate(dataToPixel);
    }
    else if(isVertical) {
        dataToPixel = function(v) { return gs.t + gs.h * (1 - v); };
    }
    else {
        dataToPixel = function(v) { return gs.l + gs.w * v; };
    }

    return dataToPixel;
}

function decodeDate(convertToPx) {
    return function(v) { return convertToPx(v.replace('_', ' ')); };
}


var DBLCLICKDELAY = require('@src/plots/cartesian/constants').DBLCLICKDELAY;
var getBBox = require('../assets/get_bbox');

function mouseDown(node, x, y) {
    node.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        clientX: x,
        clientY: y
    }));
}

function mouseMove(node, x, y) {
    node.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        clientX: x,
        clientY: y
    }));
}

function mouseUp(node, x, y) {
    node.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        clientX: x,
        clientY: y
    }));
}

function drag(node, dx, dy) {
    var bbox = getBBox(node),
        fromX = bbox.x,
        fromY = bbox.y,
        toX = fromX + dx,
        toY = fromY + dy;

    mouseMove(node, fromX, fromY);
    mouseDown(node, fromX, fromY);

    var promise = waitForDragCover().then(function(dragCoverNode) {
        mouseMove(dragCoverNode, toX, toY);
        mouseUp(dragCoverNode, toX, toY);
        return waitForDragCoverRemoval();
    });

    return promise;
}

function waitForDragCover() {
    return new Promise(function(resolve) {
        var interval = DBLCLICKDELAY / 4,
            timeout = 5000;

        var id = setInterval(function() {
            var dragCoverNode = d3.selectAll('.dragcover').node();
            if(dragCoverNode) {
                clearInterval(id);
                resolve(dragCoverNode);
            }

            timeout -= interval;
            if(timeout < 0) {
                clearInterval(id);
                throw new Error('waitForDragCover: timeout');
            }
        }, interval);
    });
}

function waitForDragCoverRemoval() {
    return new Promise(function(resolve) {
        var interval = DBLCLICKDELAY / 4,
            timeout = 5000;

        var id = setInterval(function() {
            var dragCoverNode = d3.selectAll('.dragcover').node();
            if(!dragCoverNode) {
                clearInterval(id);
                resolve(dragCoverNode);
            }

            timeout -= interval;
            if(timeout < 0) {
                clearInterval(id);
                throw new Error('waitForDragCoverRemoval: timeout');
            }
        }, interval);
    });
}
