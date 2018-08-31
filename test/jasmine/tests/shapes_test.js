var Shapes = require('@src/components/shapes');
var helpers = require('@src/components/shapes/helpers');
var constants = require('@src/components/shapes/constants');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Plots = require('@src/plots/plots');
var Axes = require('@src/plots/cartesian/axes');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var drag = require('../assets/drag');

var customAssertions = require('../assets/custom_assertions');
var assertElemRightTo = customAssertions.assertElemRightTo;
var assertElemTopsAligned = customAssertions.assertElemTopsAligned;
var assertElemInside = customAssertions.assertElemInside;

// Reusable vars
var shapeTypes = [{type: 'rect'}, {type: 'circle'}, {type: 'line'}];
var resizeDirections = ['n', 's', 'w', 'e', 'nw', 'se', 'ne', 'sw'];
var resizeTypes = [
    {resizeType: 'shrink', resizeDisplayName: 'shrunken'},
    {resizeType: 'enlarge', resizeDisplayName: 'enlarged'}
];
var dxToShrinkWidth = { n: 0, s: 0, w: 10, e: -10, nw: 10, se: -10, ne: -10, sw: 10 };
var dyToShrinkHeight = { n: 10, s: -10, w: 0, e: 0, nw: 10, se: -10, ne: 10, sw: -10 };
var dxToEnlargeWidth = { n: 0, s: 0, w: -10, e: 10, nw: -10, se: 10, ne: 10, sw: -10 };
var dyToEnlargeHeight = { n: -10, s: 10, w: 0, e: 0, nw: -10, se: 10, ne: -10, sw: 10 };

// Helper functions
function getMoveLineDragElement(index) {
    index = index || 0;
    return d3.selectAll('.shapelayer g[data-index="' + index + '"] path').node();
}

function getResizeLineOverStartPointElement(index) {
    index = index || 0;
    return d3.selectAll('.shapelayer g[data-index="' + index + '"] circle[data-line-point="start-point"]').node();
}

function getResizeLineOverEndPointElement(index) {
    index = index || 0;
    return d3.selectAll('.shapelayer g[data-index="' + index + '"] circle[data-line-point="end-point"]').node();
}

describe('Test shapes defaults:', function() {
    'use strict';

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
            expect(item).toEqual(jasmine.objectContaining({
                visible: false,
                _index: i
            }));
        });
    });

    it('should provide the right defaults on all axis types', function() {
        var fullLayout = {
            xaxis: {type: 'linear', range: [0, 20], _shapeIndices: []},
            yaxis: {type: 'log', range: [1, 5], _shapeIndices: []},
            xaxis2: {type: 'date', range: ['2006-06-05', '2006-06-09'], _shapeIndices: []},
            yaxis2: {type: 'category', range: [-0.5, 7.5], _shapeIndices: []},
            _subplots: {xaxis: ['x', 'x2'], yaxis: ['y', 'y2']}
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
    var gd;

    afterEach(destroyGraphDiv);

    function assertRanges(msg, x, y) {
        var fullLayout = gd._fullLayout;
        var PREC = 1;
        expect(fullLayout.xaxis.range).toBeCloseToArray(x, PREC, msg + ' - xaxis');
        expect(fullLayout.yaxis.range).toBeCloseToArray(y, PREC, msg + ' - yaxis');
    }

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

        Plotly.plot(gd, mock).then(function() {
            assertRanges('base', [0, 2], [0, 2]);
            return Plotly.relayout(gd, { 'shapes[1].visible': false });
        })
        .then(function() {
            assertRanges('shapes[1] not visible', [0, 1], [0, 1]);

            return Plotly.relayout(gd, { 'shapes[1].visible': true });
        })
        .then(function() {
            assertRanges('back to base', [0, 2], [0, 2]);

            return Plotly.relayout(gd, { 'shapes[0].x1': 3 });
        })
        .then(function() {
            assertRanges('stretched shapes[0]', [0, 3], [0, 2]);
        })
        .catch(failTest)
        .then(done);
    });

    it('should propagate axis autorange changes when axis ranges are set', function(done) {
        gd = createGraphDiv();

        Plotly.plot(gd, [{y: [1, 2]}], {
            xaxis: {range: [0, 2]},
            yaxis: {range: [0, 2]},
            shapes: [{
                x0: 2, y0: 2,
                x1: 3, y1: 3
            }]
        })
        .then(function() {
            assertRanges('set rng / narrow shape', [0, 2], [0, 2]);
            return Plotly.relayout(gd, 'shapes[0].x1', 10);
        })
        .then(function() {
            assertRanges('set rng / large shape', [0, 2], [0, 2]);
            return Plotly.relayout(gd, {
                'xaxis.autorange': true,
                'yaxis.autorange': true
            });
        })
        .then(function() {
            assertRanges('auto rng / large shape', [-0.61, 10], [0.86, 3]);
            return Plotly.relayout(gd, 'shapes[0].x1', 3);
        })
        .then(function() {
            assertRanges('auto rng / small shape', [-0.18, 3], [0.86, 3]);
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
            y: [1934.5, 1932.3, 1930.3],
            x: ['1947-01-01', '1947-04-01', '1948-07-01'],
            type: 'scatter'
        }];

        layout = {
            yaxis: {
                type: 'linear'
            },
            xaxis: {
                type: 'date'
            },
            yaxis2: {
                side: 'right',
                overlaying: 'y'
            },
            shapes: [{
                fillcolor: '#ccc',
                type: 'rect',
                x0: '1947-01-01',
                x1: '1947-04-01',
                xref: 'x',
                y0: 0,
                y1: 1,
                yref: 'paper',
                layer: 'below'
            }, {
                type: 'path',
                xref: 'x',
                yref: 'y2',
                path: 'M1947-01-01_12:00,2V4H1947-03-01Z'
            }, {
                type: 'rect',
                xref: 'x',
                yref: 'y2',
                x0: '1947-02-01',
                x1: '1947-03-01',
                y0: 3,
                y1: 5,
                layer: 'below'
            }, {
                type: 'circle',
                xref: 'x',
                yref: 'y',
                x0: '1947-01-15',
                x1: '1947-02-15',
                y0: 1931,
                y1: 1934
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

function getFirstShapeNode() {
    return d3.selectAll('.shapelayer path').node();
}

function assertShapeSize(shapeNode, w, h) {
    var bBox = shapeNode.getBoundingClientRect();
    expect(bBox.width).toBe(w);
    expect(bBox.height).toBe(h);
}

function assertShapeFullyVisible(shapeElem) {
    var gridLayer = d3.selectAll('.gridlayer').node();
    assertElemInside(shapeElem, gridLayer, 'shape element fully visible');
}

describe('A path shape sized relative to data', function() {
    'use strict';

    var gd, data, layout;

    beforeEach(function() {
        gd = createGraphDiv();
        data = [{
            x: [1, 5],
            y: [1, 5],
            type: 'scatter'
        }];
        layout = {
            title: 'Path shape sized relative to data',
            width: 400,
            height: 400,
            shapes: [{
                type: 'path',
                xref: 'x',
                yref: 'y',
                xsizemode: 'data',
                ysizemode: 'data',
                path: 'M10,0 L2,10 L1,0 Z',

                // Hint: set those too intentionally
                xanchor: '3',
                yanchor: '0',
                x0: 1,
                x1: 3,
                y0: 1,
                y1: 3
            }]
        };
    });

    afterEach(destroyGraphDiv);

    it('is expanding an auto-ranging axes', function() {
        Plotly.plot(gd, data, layout);

        assertShapeFullyVisible(getFirstShapeNode());
    });
});

describe('A fixed size path shape', function() {
    'use strict';

    var gd, data, layout;

    beforeEach(function() {
        gd = createGraphDiv();
        data = [{
            x: [1, 5],
            y: [1, 5],
            type: 'scatter'
        }];
        layout = {
            title: 'Fixed size path shape',
            width: 400,
            height: 400,
            shapes: [{
                type: 'path',
                xref: 'x',
                yref: 'y',
                xsizemode: 'pixel',
                ysizemode: 'pixel',
                path: 'M0,0 L30,0 L15,20 Z',
                xanchor: '3',
                yanchor: '0',

                // Hint: set those too intentionally
                x0: 1,
                x1: 3,
                y0: 1,
                y1: 3
            }]
        };
    });

    afterEach(destroyGraphDiv);

    it('is defined in pixel', function() {
        Plotly.plot(gd, data, layout);

        assertShapeSize(getFirstShapeNode(), 30, 20);
    });

    it('is expanding auto-ranging axes', function() {
        layout.shapes[0].xanchor = 10;
        layout.shapes[0].yanchor = 10;

        Plotly.plot(gd, data, layout);

        assertShapeFullyVisible(getFirstShapeNode());
    });

    it('is being rendered correctly when linked to a date axis', function() {
        data = [{
            x: ['2018-01-01 00:00:00',
                '2018-02-01 00:00:00',
                '2018-03-01 00:00:00',
                '2018-04-01 00:00:00'],
            y: [3, 4, 2, 5],
            type: 'scatter'
        }];
        layout.shapes[0].xanchor = '2018-07-01 00:00:00';
        layout.shapes[0].yanchor = 10;

        Plotly.plot(gd, data, layout);

        var shapeNode = getFirstShapeNode();
        assertShapeFullyVisible(shapeNode);
        assertShapeSize(shapeNode, 30, 20);
    });

    it('keeps its dimensions when plot is being resized', function(done) {
        Plotly.plot(gd, data, layout);

        assertShapeSize(getFirstShapeNode(), 30, 20);

        Plotly.relayout(gd, {height: 200, width: 600}).then(function() {
            assertShapeSize(getFirstShapeNode(), 30, 20);
        })
        .catch(failTest)
        .then(done);
    });

    it('is draggable', function(done) {
        Plotly.plot(gd, data, layout, {editable: true})
          .then(function() {
              drag(getFirstShapeNode(), 50, 50).then(function() {
                  assertShapeSize(getFirstShapeNode(), 30, 20);
                  done();
              });
          });
    });

    it('being sized relative to data horizontally is getting narrower ' +
      'when being dragged to expand the x-axis',
      function(done) {
          layout.shapes[0].xsizemode = 'data';
          layout.shapes[0].path = 'M0,0 L2,0 L1,20 Z';

          Plotly.plot(gd, data, layout, {editable: true})
            .then(function() {
                var shapeNodeBeforeDrag = getFirstShapeNode();
                var widthBeforeDrag = shapeNodeBeforeDrag.getBoundingClientRect().width;

                drag(shapeNodeBeforeDrag, 300, 50).then(function() {
                    var shapeNodeAfterDrag = getFirstShapeNode();
                    var bbox = shapeNodeAfterDrag.getBoundingClientRect();
                    expect(bbox.height).toBe(20);
                    expect(bbox.width).toBeLessThan(widthBeforeDrag);
                    assertShapeFullyVisible(shapeNodeAfterDrag);
                    done();
                });
            });
      });

    it('being sized relative to data vertically is getting lower ' +
      'when being dragged to expand the y-axis',
      function(done) {
          layout.shapes[0].ysizemode = 'data';
          layout.shapes[0].path = 'M0,0 L30,0 L15,2 Z';

          Plotly.plot(gd, data, layout, {editable: true})
            .then(function() {
                var shapeNodeBeforeDrag = getFirstShapeNode();
                var heightBeforeDrag = shapeNodeBeforeDrag.getBoundingClientRect().height;

                drag(shapeNodeBeforeDrag, 50, 300).then(function() {
                    var shapeNodeAfterDrag = getFirstShapeNode();
                    var bbox = shapeNodeAfterDrag.getBoundingClientRect();
                    expect(bbox.width).toBe(30);
                    expect(bbox.height).toBeLessThan(heightBeforeDrag);
                    assertShapeFullyVisible(shapeNodeAfterDrag);
                    done();
                });
            });
      });
});

describe('A fixed size shape', function() {
    'use strict';

    var gd, data, layout;

    beforeEach(function() {
        gd = createGraphDiv();
        data = [{
            x: [1, 5],
            y: [1, 5],
            type: 'scatter'
        }];
        layout = {
            title: 'Fixed size shape',
            width: 400,
            height: 400,
            shapes: [{
                type: 'rect',
                xref: 'x',
                yref: 'y',
                xsizemode: 'pixel',
                ysizemode: 'pixel',
                xanchor: '3',
                yanchor: '0',
                x0: 3,
                x1: 28,
                y0: 0,
                y1: -25
            }]
        };
    });

    afterEach(destroyGraphDiv);

    it('can be positioned relative to data', function() {
        Plotly.plot(gd, data, layout);

        var shapeNode = getFirstShapeNode();
        assertShapeSize(shapeNode, 25, 25);

        // Check position relative to data with zero line and grid line as a reference
        var xAxisLine = d3.selectAll('.zerolinelayer .yzl').node();
        assertElemTopsAligned(shapeNode, xAxisLine, 'Top edges of shape and x-axis zero line aligned');
        var gridLine = d3.selectAll('.gridlayer .xgrid:nth-child(3)').node();
        assertElemRightTo(shapeNode, gridLine, 'Shape right to third grid line');
    });

    it('can be positioned relative to the plotting area', function() {
        layout.shapes[0].xref = 'paper';
        layout.shapes[0].yref = 'paper';
        layout.shapes[0].xanchor = '1';
        layout.shapes[0].yanchor = '1';
        Plotly.plot(gd, data, layout);

        var shapeNode = getFirstShapeNode();
        assertShapeSize(shapeNode, 25, 25);
        assertElemRightTo(shapeNode, d3.selectAll('.cartesianlayer').node(), 'Shape right to plotting area');
    });

    it('can be sized by pixel horizontally and relative to data vertically', function() {
        layout.shapes[0].ysizemode = 'data';
        layout.shapes[0].y0 = 1;
        layout.shapes[0].y1 = 5;
        Plotly.plot(gd, data, layout);

        var shapeNode = getFirstShapeNode();
        var bBox = shapeNode.getBoundingClientRect();
        expect(bBox.width).toBeLessThan(bBox.height);
        expect(bBox.width).toBe(25);
    });

    it('can be sized relative to data vertically and by pixel horizontally', function() {
        layout.shapes[0].xsizemode = 'data';
        layout.shapes[0].x0 = 1;
        layout.shapes[0].x1 = 5;
        Plotly.plot(gd, data, layout);

        var shapeNode = getFirstShapeNode();
        var bBox = shapeNode.getBoundingClientRect();
        expect(bBox.height).toBeLessThan(bBox.width);
        expect(bBox.height).toBe(25);
    });

    it('is being rendered correctly when linked to a date axis', function() {
        data = [{
            x: ['2018-01-01 00:00:00',
                '2018-02-01 00:00:00',
                '2018-03-01 00:00:00',
                '2018-04-01 00:00:00'],
            y: [3, 4, 2, 5],
            type: 'scatter'
        }];
        layout.shapes[0].xanchor = '2018-07-01 00:00:00';
        layout.shapes[0].yanchor = 10;

        Plotly.plot(gd, data, layout);

        var shapeNode = getFirstShapeNode();
        assertShapeFullyVisible(shapeNode);
        assertShapeSize(shapeNode, 25, 25);
    });

    it('keeps its dimensions when plot is being resized', function(done) {
        layout.shapes[0].yanchor = 3; // Ensure visible for debugging
        Plotly.plot(gd, data, layout);

        var shapeNode = getFirstShapeNode();
        assertShapeSize(shapeNode, 25, 25);

        Plotly.relayout(gd, {height: 200, width: 600}).then(function() {
            var reRenderedShapeNode = getFirstShapeNode();
            assertShapeSize(reRenderedShapeNode, 25, 25);
        })
        .catch(failTest)
        .then(done);
    });

    it('is draggable', function(done) {
        Plotly.plot(gd, data, layout, {editable: true})
          .then(function() {
              drag(getFirstShapeNode(), 50, 50).then(function() {
                  assertShapeSize(getFirstShapeNode(), 25, 25);
                  done();
              });
          });
    });

    it('being sized relative to data horizontally is getting narrower ' +
      'when being dragged to expand the x-axis',
      function(done) {
          layout.shapes[0].xsizemode = 'data';
          layout.shapes[0].x0 = 1;
          layout.shapes[0].x1 = 2;

          Plotly.plot(gd, data, layout, {editable: true})
            .then(function() {
                var shapeNodeBeforeDrag = getFirstShapeNode();
                var widthBeforeDrag = shapeNodeBeforeDrag.getBoundingClientRect().width;

                drag(shapeNodeBeforeDrag, 300, 50).then(function() {
                    var shapeNodeAfterDrag = getFirstShapeNode();
                    var bbox = shapeNodeAfterDrag.getBoundingClientRect();
                    expect(bbox.height).toBe(25);
                    expect(bbox.width).toBeLessThan(widthBeforeDrag);
                    assertShapeFullyVisible(shapeNodeAfterDrag);
                    done();
                });
            });
      });

    it('being sized relative to data vertically is getting lower ' +
      'when being dragged to expand the y-axis',
      function(done) {
          layout.shapes[0].ysizemode = 'data';
          layout.shapes[0].y0 = 1;
          layout.shapes[0].y1 = 2;

          Plotly.plot(gd, data, layout, {editable: true})
            .then(function() {
                var shapeNodeBeforeDrag = getFirstShapeNode();
                var heightBeforeDrag = shapeNodeBeforeDrag.getBoundingClientRect().height;

                drag(shapeNodeBeforeDrag, 50, 300).then(function() {
                    var shapeNodeAfterDrag = getFirstShapeNode();
                    var bbox = shapeNodeAfterDrag.getBoundingClientRect();
                    expect(bbox.width).toBe(25);
                    expect(bbox.height).toBeLessThan(heightBeforeDrag);
                    assertShapeFullyVisible(shapeNodeAfterDrag);
                    done();
                });
            });
      });

    // Helper to combine two arrays of objects
    function combinations(arr1, arr2) {
        var combinations = [];
        arr1.forEach(function(elemArr1) {
            arr2.forEach(function(elemArr2) {
                combinations.push(Lib.extendFlat({}, elemArr1, elemArr2));
            });
        });
        return combinations;
    }

    // Only rect and circle because (i) path isn't yet resizable
    // and (ii) line has a different resize behavior.
    var shapeAndResizeTypes = combinations([{type: 'rect'}, {type: 'circle'}], resizeTypes);
    shapeAndResizeTypes.forEach(function(testCase) {
        describe('of type ' + testCase.type + ' can be ' + testCase.resizeDisplayName, function() {
            resizeDirections.forEach(function(direction) {
                it('@flaky over direction ' + direction, function(done) {
                    layout.shapes[0].type = testCase.type;

                    Plotly.plot(gd, data, layout, {editable: true})
                      .then(function() {
                          var shapeNodeBeforeDrag = getFirstShapeNode();
                          var bBoxBeforeDrag = shapeNodeBeforeDrag.getBoundingClientRect();

                          var shallShrink = testCase.resizeType === 'shrink';
                          var dx = shallShrink ? dxToShrinkWidth[direction] : dxToEnlargeWidth[direction];
                          var dy = shallShrink ? dyToShrinkHeight[direction] : dyToEnlargeHeight[direction];

                          drag(shapeNodeBeforeDrag, dx, dy, direction)
                            .then(function() {
                                var shapeNodeAfterDrag = getFirstShapeNode();
                                var bBoxAfterDrag = shapeNodeAfterDrag.getBoundingClientRect();
                                var resizeFactor = shallShrink ? -1 : 1;
                                expect(bBoxAfterDrag.height).toBe(bBoxBeforeDrag.height + resizeFactor * Math.abs(dy));
                                expect(bBoxAfterDrag.width).toBe(bBoxBeforeDrag.width + resizeFactor * Math.abs(dx));
                                assertShapeFullyVisible(shapeNodeAfterDrag);
                                done();
                            });
                      });
                });
            });
        });
    });

    describe('of type line', function() {
        beforeEach(function() {
            layout.shapes[0].type = 'line';
            layout.shapes[0].yanchor = 3;

        });

        it('@flaky can be moved by dragging the middle', function(done) {
            Plotly.plot(gd, data, layout, {editable: true})
              .then(function() {
                  var shapeNodeBeforeDrag = getFirstShapeNode();
                  var bBoxBeforeDrag = shapeNodeBeforeDrag.getBoundingClientRect();

                  var dragSensitiveElement = getMoveLineDragElement(0);
                  drag(dragSensitiveElement, 10, -10)
                    .then(function() {
                        var shapeNodeAfterDrag = getFirstShapeNode();
                        var bBoxAfterDrag = shapeNodeAfterDrag.getBoundingClientRect();

                        assertShapeSize(shapeNodeAfterDrag, 25, 25);
                        expect(bBoxAfterDrag.left).toBe(bBoxBeforeDrag.left + 10);
                        expect(bBoxAfterDrag.top).toBe(bBoxBeforeDrag.top - 10);

                        done();
                    });
              });
        });

        it('@flaky can be resized by dragging the start point', function(done) {
            Plotly.plot(gd, data, layout, {editable: true})
              .then(function() {
                  var shapeNodeBeforeDrag = getFirstShapeNode();
                  var bBoxBeforeDrag = shapeNodeBeforeDrag.getBoundingClientRect();

                  var dragSensitiveElement = getResizeLineOverStartPointElement();
                  drag(dragSensitiveElement, 50, -10)
                    .then(function() {
                        var shapeNodeAfterDrag = getFirstShapeNode();
                        var bBoxAfterDrag = shapeNodeAfterDrag.getBoundingClientRect();

                        assertShapeSize(shapeNodeAfterDrag, 25, 35);
                        expect(bBoxAfterDrag.top).toBe(bBoxBeforeDrag.top - 10, 'top');
                        expect(bBoxAfterDrag.right).toBe(bBoxBeforeDrag.right + 25, 'right');
                        expect(bBoxAfterDrag.bottom).toBe(bBoxBeforeDrag.bottom, 'bottom');
                        expect(bBoxAfterDrag.left).toBe(bBoxBeforeDrag.left + 25, 'left');

                        done();
                    });
              });
        });

        it('@flaky can be resized by dragging the end point', function(done) {
            Plotly.plot(gd, data, layout, {editable: true})
              .then(function() {
                  var shapeNodeBeforeDrag = getFirstShapeNode();
                  var bBoxBeforeDrag = shapeNodeBeforeDrag.getBoundingClientRect();

                  var dragSensitiveElement = getResizeLineOverEndPointElement();
                  drag(dragSensitiveElement, 50, -10)
                    .then(function() {
                        var shapeNodeAfterDrag = getFirstShapeNode();
                        var bBoxAfterDrag = shapeNodeAfterDrag.getBoundingClientRect();

                        assertShapeSize(shapeNodeAfterDrag, 75, 15);
                        expect(bBoxAfterDrag.top).toBe(bBoxBeforeDrag.top, 'top');
                        expect(bBoxAfterDrag.right).toBe(bBoxBeforeDrag.right + 50, 'right');
                        expect(bBoxAfterDrag.bottom).toBe(bBoxBeforeDrag.bottom - 10, 'bottom');
                        expect(bBoxAfterDrag.left).toBe(bBoxBeforeDrag.left, 'left');

                        done();
                    });
              });
        });
    });

    describe('is expanding an auto-ranging x-axis', function() {
        var sizeVariants = [
            {x0: 5, x1: 25},
            {x0: 5, x1: -25},
            {x0: -5, x1: 25},
            {x0: -5, x1: -25}
        ];
        var shapeVariants = combinations(shapeTypes, sizeVariants);

        describe('to the left', function() {
            shapeVariants.forEach(function(testCase) {
                it('and is fully visible when being a ' + testCase.type +
                  ' with x0,x1=[' + testCase.x0 + ',' + testCase.x1 + ']',
                  function() {
                      layout.shapes[0].type = testCase.type;
                      layout.shapes[0].xanchor = -1;
                      layout.shapes[0].x0 = testCase.x0;
                      layout.shapes[0].x1 = testCase.x1;
                      Plotly.plot(gd, data, layout);

                      expect(gd.layout.xaxis.range[0]).toBeLessThanOrEqual(-1);
                      assertShapeFullyVisible(getFirstShapeNode());
                  });
            });
        });

        describe('to the right', function() {
            shapeVariants.forEach(function(testCase) {
                it('and is fully visible when being a ' + testCase.type +
                  ' with x0,x1=[' + testCase.x0 + ',' + testCase.x1 + ']',
                  function() {
                      layout.shapes[0].type = testCase.type;
                      layout.shapes[0].xanchor = 10;
                      layout.shapes[0].x0 = testCase.x0;
                      layout.shapes[0].x1 = testCase.x1;
                      Plotly.plot(gd, data, layout);

                      expect(gd.layout.xaxis.range[1]).toBeGreaterThanOrEqual(10);
                      assertShapeFullyVisible(getFirstShapeNode());
                  });
            });
        });
    });

    describe('is expanding an auto-ranging y-axis', function() {
        var sizeVariants = [
            {y0: 5, y1: 25},
            {y0: 5, y1: -25},
            {y0: -5, y1: 25},
            {y0: -5, y1: -25}
        ];
        var shapeVariants = combinations(shapeTypes, sizeVariants);

        describe('to the bottom', function() {
            shapeVariants.forEach(function(testCase) {
                it('and is fully visible when being a ' + testCase.type +
                  ' with y0,y1=[' + testCase.y0 + ',' + testCase.y1 + ']',
                  function() {
                      layout.shapes[0].type = testCase.type;
                      layout.shapes[0].yanchor = -1;
                      layout.shapes[0].y0 = testCase.y0;
                      layout.shapes[0].y1 = testCase.y1;
                      Plotly.plot(gd, data, layout);

                      expect(gd.layout.yaxis.range[0]).toBeLessThanOrEqual(-1);
                      assertShapeFullyVisible(getFirstShapeNode());
                  });
            });
        });

        describe('to the top', function() {
            shapeVariants.forEach(function(testCase) {
                it('and is fully visible when being a ' + testCase.type +
                  ' with y0,y1=[' + testCase.y0 + ',' + testCase.y1 + ']',
                  function() {
                      layout.shapes[0].type = testCase.type;
                      layout.shapes[0].yanchor = 10;
                      layout.shapes[0].y0 = testCase.y0;
                      layout.shapes[0].y1 = testCase.y1;
                      Plotly.plot(gd, data, layout);

                      expect(gd.layout.yaxis.range[1]).toBeGreaterThanOrEqual(10);
                      assertShapeFullyVisible(getFirstShapeNode());
                  });
            });
        });
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
        it('@flaky ' + testCase.title + ' should be draggable', function(done) {
            setupLayout(testCase, [{type: 'line'}, {type: 'rect'}, {type: 'circle'}, {type: 'path'}]);
            testDragEachShape(done);
        });
    });

    testCases.forEach(function(testCase) {
        resizeDirections.forEach(function(direction) {
            var testTitle = testCase.title +
                ' should be resizeable over direction ' +
                direction;
            it('@flaky ' + testTitle, function(done) {
                // Exclude line because it has a different resize behavior
                setupLayout(testCase, [{type: 'rect'}, {type: 'circle'}, {type: 'path'}]);
                testResizeEachShape(direction, done);
            });
        });
    });

    testCases.forEach(function(testCase) {
        ['start', 'end'].forEach(function(linePoint) {
            var testTitle = 'Line shape ' + testCase.title +
              ' should be resizable by dragging the ' + linePoint + ' point';
            it('@flaky ' + testTitle, function(done) {
                setupLayout(testCase, [{type: 'line'}]);
                testLineResize(linePoint, done);
            });
        });
    });

    function setupLayout(testCase, layoutShapes) {
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

        layoutShapes.forEach(function(s) {
            s.xref = xref;
            s.yref = yref;

            if(s.type === 'path') {
                s.path = 'M' + x0y0 + 'L' + x1y1 + 'L' + x1y0 + 'Z';
            }
            else {
                s.x0 = x0;
                s.x1 = x1;
                s.y0 = y0;
                s.y1 = y1;
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
                var node = layoutShape.type === 'line' ?
                  getMoveLineDragElement(index) :
                  getShapeNode(index);
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

        // Only rect, circle and path.
        // Hint: line has different resize behavior.
        expect(layoutShapes.length).toBe(3);

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

    function testLineResize(pointToMove, done) {
        var promise = Plotly.plot(gd, data, layout, config);
        var layoutShape = gd.layout.shapes[0];

        var xa = Axes.getFromId(gd, layoutShape.xref),
            ya = Axes.getFromId(gd, layoutShape.yref),
            x2p = helpers.getDataToPixel(gd, xa),
            y2p = helpers.getDataToPixel(gd, ya, true);


        promise = promise.then(function() {
            var dragHandle = pointToMove === 'start' ?
              getResizeLineOverStartPointElement() :
              getResizeLineOverEndPointElement();

            var initialCoordinates = getShapeCoordinates(layoutShape, x2p, y2p);
            return drag(dragHandle, 10, 10).then(function() {
                var finalCoordinates = getShapeCoordinates(layoutShape, x2p, y2p);

                if(pointToMove === 'start') {
                    expect(finalCoordinates.x0 - initialCoordinates.x0).toBeCloseTo(10);
                    expect(finalCoordinates.y0 - initialCoordinates.y0).toBeCloseTo(10);
                } else {
                    expect(finalCoordinates.x1 - initialCoordinates.x1).toBeCloseTo(10);
                    expect(finalCoordinates.y1 - initialCoordinates.y1).toBeCloseTo(10);
                }
            });
        });

        return promise.then(done);
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
