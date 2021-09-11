var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Registry = require('@src/registry');
function _doPlot(gd, fig) {
    return Registry.call('_doPlot', gd, fig.data, fig.layout);
}

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var Plots = require('@src/plots/plots');
var Parcoords = require('@src/traces/parcoords');
var attributes = require('@src/traces/parcoords/attributes');
var PC = require('@src/traces/parcoords/constants');

var createGraphDiv = require('../assets/create_graph_div');
var delay = require('../assets/delay');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');
var supplyAllDefaults = require('../assets/supply_defaults');
var readPixel = require('../assets/read_pixel');

var mock3 = require('@mocks/gl2d_parcoords_style_labels.json');

// mock with two dimensions (one panel); special case, e.g. left and right panel is obv. the same
var mock2 = require('@mocks/gl2d_parcoords_2.json');

// mock with one dimension (zero panels); special case, as no panel can be rendered
var mock1 = require('@mocks/gl2d_parcoords_1.json');

// mock with zero dimensions; special case, as no dimension can be rendered
var mock0 = Lib.extendDeep({}, mock1);
mock0.data[0].dimensions = [];

var mock = Lib.extendDeep({}, require('@mocks/gl2d_parcoords_large.json'));
var lineStart = 30;
var lineCount = 10;
mock.data[0].dimensions.forEach(function(d) {
    d.values = d.values.slice(lineStart, lineStart + lineCount);
});
mock.data[0].line.color = mock.data[0].line.color.slice(lineStart, lineStart + lineCount);

function mouseTo(x, y) {
    mouseEvent('mousemove', x, y);
    mouseEvent('mouseover', x, y);
}

function mouseClick(x, y) {
    mouseTo(x, y);
    mouseEvent('mousedown', x, y);
    mouseEvent('mouseup', x, y);
}

function mostOfDrag(x1, y1, x2, y2) {
    mouseTo(x1, y1);
    mouseEvent('mousedown', x1, y1);
    mouseEvent('mousemove', x2, y2);
}

function getAvgPixelByChannel(id) {
    var canvas = d3Select(id).node();

    var imgData = readPixel(canvas, 0, 0, canvas.width, canvas.height);
    var n = imgData.length * 0.25;
    var r = 0;
    var g = 0;
    var b = 0;

    for(var i = 0; i < imgData.length; i++) {
        r += imgData[i++];
        g += imgData[i++];
        b += imgData[i++];
    }
    return [r / n, g / n, b / n];
}

describe('parcoords initialization tests', function() {
    'use strict';

    describe('parcoords global defaults', function() {
        it('should not coerce trace opacity', function() {
            var gd = Lib.extendDeep({}, mock1);

            supplyAllDefaults(gd);

            expect(gd._fullData[0].opacity).toBeUndefined();
        });

        it('should use global font as label, tick and range font defaults', function() {
            var gd = Lib.extendDeep({}, mock1);
            gd.layout.font = {
                family: 'Gravitas',
                size: 20,
                color: 'blue'
            };

            supplyAllDefaults(gd);

            var expected = {
                family: 'Gravitas',
                size: 17,
                color: 'blue'
            };

            expect(gd._fullData[0].labelfont).toEqual(expected);
            expect(gd._fullData[0].tickfont).toEqual(expected);
            expect(gd._fullData[0].rangefont).toEqual(expected);
        });

        it('should not coerce hoverlabel', function() {
            var gd = Lib.extendDeep({}, mock1);

            supplyAllDefaults(gd);

            expect(gd._fullData[0].hoverlabel).toBeUndefined();
        });
    });

    describe('parcoords defaults', function() {
        function _supply(traceIn) {
            var traceOut = { visible: true };
            var defaultColor = '#444';
            var layout = { font: Plots.layoutAttributes.font };

            Parcoords.supplyDefaults(traceIn, traceOut, defaultColor, layout);

            return traceOut;
        }

        it('\'line\' specification should yield a default color', function() {
            var fullTrace = _supply({});
            expect(fullTrace.line.color).toEqual('#444');
        });

        it('\'colorscale\' should assume a default value if the \'color\' array is specified', function() {
            var fullTrace = _supply({
                line: {
                    color: [35, 63, 21, 42]
                },
                dimensions: [
                    {values: [321, 534, 542, 674]},
                    {values: [562, 124, 942, 189]},
                    {values: [287, 183, 385, 884]},
                    {values: [113, 489, 731, 454]}
                ]
            });
            expect(fullTrace.line).toEqual({
                color: [35, 63, 21, 42],
                colorscale: attributes.line.colorscale.dflt,
                cauto: true,
                autocolorscale: false,
                reversescale: false,
                showscale: false
            });
        });

        it('\'domain\' specification should have a default', function() {
            var fullTrace = _supply({});
            expect(fullTrace.domain).toEqual({x: [0, 1], y: [0, 1]});
        });

        it('\'dimension\' specification should have a default of an empty array', function() {
            var fullTrace = _supply({});
            expect(fullTrace.dimensions).toEqual([]);
        });

        it('\'dimension\' should be used with default values where attributes are not provided', function() {
            var fullTrace = _supply({
                dimensions: [{
                    values: [1],
                    alienProperty: 'Alpha Centauri'
                }]
            });
            expect(fullTrace.dimensions).toEqual([jasmine.objectContaining({
                values: [1],
                visible: true,
                tickformat: '',
                multiselect: true,
                _index: 0,
                _length: 1
            })]);
        });

        it('\'dimension.visible\' should be set to false, and other props just passed through if \'values\' is not provided', function() {
            var fullTrace = _supply({
                dimensions: [{
                    alienProperty: 'Alpha Centauri'
                }]
            });
            expect(fullTrace.dimensions).toEqual([jasmine.objectContaining({
                visible: false, _index: 0
            })]);
        });

        it('\'dimension.visible\' should be set to false, and other props just passed through if \'values\' is an empty array', function() {
            var fullTrace = _supply({
                dimensions: [{
                    values: [],
                    alienProperty: 'Alpha Centauri'
                }]
            });
            expect(fullTrace.dimensions).toEqual([jasmine.objectContaining({
                visible: false, values: [], _index: 0
            })]);
        });

        it('\'dimension.visible\' should be set to false, and other props just passed through if \'values\' is not an array', function() {
            var fullTrace = _supply({
                dimensions: [{
                    values: null,
                    alienProperty: 'Alpha Centauri'
                }]
            });
            expect(fullTrace.dimensions).toEqual([jasmine.objectContaining({
                visible: false, _index: 0
            })]);
        });

        it('\'dimension.values\' should get truncated to a common shortest *nonzero* length', function() {
            var fullTrace = _supply({dimensions: [
                {values: [321, 534, 542, 674]},
                {values: [562, 124, 942]},
                {values: [], visible: true},
                {values: [1, 2], visible: false} // shouldn't be truncated to as visible: false
            ]});
            expect(fullTrace._length).toBe(3);
        });

        it('cleans up constraintrange', function() {
            var fullTrace = _supply({dimensions: [
                // will be sorted and unwrapped to 1D
                {values: [0, 10, 20], constraintrange: [[15, 5]]},
                // overlapping ranges merge
                {values: [0, 10, 20], constraintrange: [[1, 3], [3, 5], [5, 7], [9, 12], [14, 8], [13, 15]]},
                // ordinal, will snap to 25% out from selected point, except at the ends
                {values: [0, 1, 2], tickvals: [0, 1, 2], constraintrange: [[1, 1.5], [2, 2]]},
                // first will be deleted, 2&3 will first merge, round down to 1, THEN snap, THEN collapse to 1D
                {values: [0, 1, 2], tickvals: [0, 1, 2], constraintrange: [[0.2, 0.6], [1.001, 1.5], [1.4, 2]]},
                // constraintrange gets deleted entirely
                {values: [0, 1, 2], tickvals: [0, 1, 2], constraintrange: [[0.1, 0.9], [1.1, 1.9]]}
            ]});

            var expectedConstraints = [
                [5, 15],
                [[1, 7], [8, 15]],
                [[0.75, 1.25], [1.75, 2]],
                [0.75, 2],
                undefined
            ];

            expect(fullTrace.dimensions.length).toBe(expectedConstraints.length);
            fullTrace.dimensions.forEach(function(dim, i) {
                var constraints = dim.constraintrange;
                var expected = expectedConstraints[i];
                if(!expected) expect(constraints).toBeUndefined();
                else if(Array.isArray(expected[0])) expect(constraints).toBeCloseTo2DArray(expected, 4);
                else expect(constraints).toBeCloseToArray(expected, 4);
            });
        });
    });

    describe('parcoords calc', function() {
        function _calc(trace) {
            var gd = { data: [trace] };

            supplyAllDefaults(gd);

            var fullTrace = gd._fullData[0];
            Parcoords.calc(gd, fullTrace);
            return fullTrace;
        }

        var base = { type: 'parcoords' };

        it('\'colorscale\' should assume a default value if the \'color\' array is specified', function() {
            var fullTrace = _calc(Lib.extendDeep({}, base, {
                line: {
                    color: [35, 63, 21, 42]
                },
                dimensions: [
                    {values: [321, 534, 542, 674]},
                    {values: [562, 124, 942, 189]},
                    {values: [287, 183, 385, 884]},
                    {values: [113, 489, 731, 454]}
                ]
            }));

            expect(fullTrace.line).toEqual({
                color: [35, 63, 21, 42],
                colorscale: attributes.line.colorscale.dflt,
                cauto: true,
                cmin: 21,
                cmax: 63,
                _cmin: 21,
                _cmax: 63,
                autocolorscale: false,
                reversescale: false,
                showscale: false
            });
        });

        it('use a singular \'color\' if it is not an array', function() {
            var fullTrace = _calc(Lib.extendDeep({}, base, {
                line: {
                    color: '#444'
                },
                dimensions: [
                    {values: [321, 534, 542, 674]},
                    {values: [562, 124, 942, 189]}
                ]
            }));

            expect(fullTrace.line).toEqual({
                color: '#444'
            });
        });

        it('use a singular \'color\' even if a \'colorscale\' is supplied as \'color\' is not an array', function() {
            var fullTrace = _calc(Lib.extendDeep({}, base, {
                line: {
                    color: '#444',
                    colorscale: 'Jet'
                },
                dimensions: [
                    {values: [321, 534, 542, 674]},
                    {values: [562, 124, 942, 189]}
                ]
            }));

            expect(fullTrace.line).toEqual({
                color: '#444'
            });
        });
/* TODO: write a new test for typed arrays
        it('\'dimensions.values\' and \'line.color\' should convert typed arrays to normal arrays', function() {
            var fullTrace = _calc(Lib.extendDeep({}, base, {
                dimensions: [{
                    range: [1, 5],
                    label: 'A',
                    values: [1, 4, 3]
                }, {
                    range: [1, 5],
                    label: 'B',
                    values: new Float64Array([3, 1.5, 2]),
                }, {
                    range: [1, 5],
                    label: 'C',
                    values: new Int32Array([2, 4, 1]),
                }],
                line: {
                    color: new Int32Array([0, 1, 2])
                }
            }));
            expect(Array.isArray(fullTrace.line.color) === true).toEqual(true);
            expect(Array.isArray(fullTrace.dimensions[1].values) === true).toEqual(true);
            expect(Array.isArray(fullTrace.dimensions[2].values) === true).toEqual(true);
        });
        */
    });
});

describe('parcoords edge cases', function() {
    var gd;
    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('@gl Works fine with one panel only', function(done) {
        var mockCopy = Lib.extendDeep({}, mock2);
        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(2);
            expect(document.querySelectorAll('.axis').length).toEqual(2);
            expect(gd.data[0].dimensions[0].visible).not.toBeDefined();
            expect(gd.data[0].dimensions[0].range).not.toBeDefined();
            expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
            expect(gd.data[0].dimensions[0].constraintrange).toEqual([200, 700]);
            expect(gd.data[0].dimensions[1].range).toBeDefined();
            expect(gd.data[0].dimensions[1].range).toEqual([0, 700000]);
            expect(gd.data[0].dimensions[1].constraintrange).not.toBeDefined();
        })
        .then(done, done.fail);
    });

    it('@gl Do something sensible if there is no panel i.e. dimension count is less than 2', function(done) {
        var mockCopy = Lib.extendDeep({}, mock1);
        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(1);
            expect(document.querySelectorAll('.axis').length).toEqual(1); // sole axis still shows up
            expect(gd.data[0].line.cmin).toEqual(-4000);
            expect(gd.data[0].dimensions[0].visible).not.toBeDefined();
            expect(gd.data[0].dimensions[0].range).not.toBeDefined();
            expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
            expect(gd.data[0].dimensions[0].constraintrange).toEqual([200, 700]);
        })
        .then(done, done.fail);
    });

    it('@gl Does not error with zero dimensions', function(done) {
        var mockCopy = Lib.extendDeep({}, mock0);

        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(0);
            expect(document.querySelectorAll('.axis').length).toEqual(0);
        })
        .then(done, done.fail);
    });

    it('@gl Does not error with dimensions including only 0', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'parcoords',
                dimensions: [{
                    label: 'all zero',
                    values: [0, 0]
                }]
            }],
            layout: {}
        }).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(1);
            expect(document.querySelectorAll('.axis').length).toEqual(1);
        })
        .then(done, done.fail);
    });

    it('@gl Works with duplicate dimension labels', function(done) {
        var mockCopy = Lib.extendDeep({}, mock2);

        mockCopy.layout.width = 320;
        mockCopy.data[0].dimensions[1].label = mockCopy.data[0].dimensions[0].label;

        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(2);
            expect(document.querySelectorAll('.axis').length).toEqual(2);
        })
        .then(done, done.fail);
    });

    it('@gl Works with a single line; also, use a longer color array than the number of lines', function(done) {
        var mockCopy = Lib.extendDeep({}, mock2);
        var dim, i, j;

        Lib.seedPseudoRandom();

        mockCopy.layout.width = 320;
        for(i = 0; i < mockCopy.data[0].dimensions.length; i++) {
            dim = mockCopy.data[0].dimensions[i];
            delete dim.constraintrange;
            dim.range = [1, 2];
            dim.values = [];
            for(j = 0; j < 1; j++) {
                dim.values[j] = 1 + Lib.pseudoRandom();
            }
        }

        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(2);
            expect(document.querySelectorAll('.axis').length).toEqual(2);
            expect(gd.data[0].dimensions[0].values.length).toEqual(1);
        })
        .then(done, done.fail);
    });

    it('@gl Does not raise an error with zero lines and no specified range', function(done) {
        var mockCopy = Lib.extendDeep({}, mock2);
        var dim, i;

        mockCopy.layout.width = 320;
        for(i = 0; i < mockCopy.data[0].dimensions.length; i++) {
            dim = mockCopy.data[0].dimensions[i];
            delete dim.range;
            delete dim.constraintrange;
            dim.values = [];
        }

        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(2);
            expect(document.querySelectorAll('.axis').length).toEqual(0);
            expect(gd.data[0].dimensions[0].values.length).toEqual(0);
        })
        .then(done, done.fail);
    });

    it('@gl Works with non-finite `values` elements', function(done) {
        var mockCopy = Lib.extendDeep({}, mock2);
        var dim, i, j;
        var values = [[0, 1, 2, 3, 4], [Infinity, NaN, void(0), null, 1]];

        mockCopy.layout.width = 320;
        for(i = 0; i < values.length; i++) {
            dim = mockCopy.data[0].dimensions[i];
            delete dim.range;
            delete dim.constraintrange;
            dim.values = [];
            for(j = 0; j < values[0].length; j++) {
                dim.values[j] = values[i][j];
            }
        }

        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(2);
            expect(document.querySelectorAll('.axis').length).toEqual(2);
            expect(gd.data[0].dimensions[0].values.length).toEqual(values[0].length);
        })
        .then(done, done.fail);
    });

    it('@gl Works with 60 dimensions', function(done) {
        var mockCopy = Lib.extendDeep({}, mock1);
        var newDimension, i, j;

        Lib.seedPseudoRandom();

        mockCopy.layout.width = 1680;
        mockCopy.data[0].dimensions = [];
        for(i = 0; i < 60; i++) {
            newDimension = Lib.extendDeep({}, mock1.data[0].dimensions[0]);
            newDimension.id = 'S' + i;
            newDimension.label = 'S' + i;
            delete newDimension.constraintrange;
            newDimension.range = [1, 2];
            newDimension.values = [];
            for(j = 0; j < 100; j++) {
                newDimension.values[j] = 1 + Lib.pseudoRandom();
            }
            mockCopy.data[0].dimensions[i] = newDimension;
        }

        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(60);
            expect(document.querySelectorAll('.axis').length).toEqual(60);
        })
        .then(done, done.fail);
    });

    it('@gl Truncates 60+ dimensions to 60', function(done) {
        var mockCopy = Lib.extendDeep({}, mock1);
        var newDimension, i, j;

        Lib.seedPseudoRandom();

        mockCopy.layout.width = 1680;
        for(i = 0; i < 70; i++) {
            newDimension = Lib.extendDeep({}, mock1.data[0].dimensions[0]);
            newDimension.id = 'S' + i;
            newDimension.label = 'S' + i;
            delete newDimension.constraintrange;
            newDimension.range = [0, 999];
            for(j = 0; j < 10; j++) {
                newDimension.values[j] = Math.floor(1000 * Lib.pseudoRandom());
            }
            mockCopy.data[0].dimensions[i] = newDimension;
        }

        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(60);
            expect(document.querySelectorAll('.axis').length).toEqual(60);
        })
        .then(done, done.fail);
    });

    it('@gl Truncates dimension values to the shortest array, retaining only 3 lines', function(done) {
        var mockCopy = Lib.extendDeep({}, mock1);
        var newDimension, i, j;

        Lib.seedPseudoRandom();

        mockCopy.layout.width = 1680;
        for(i = 0; i < 60; i++) {
            newDimension = Lib.extendDeep({}, mock1.data[0].dimensions[0]);
            newDimension.id = 'S' + i;
            newDimension.label = 'S' + i;
            delete newDimension.constraintrange;
            newDimension.range = [0, 999];
            newDimension.values = [];
            for(j = 0; j < 65 - i; j++) {
                newDimension.values[j] = Math.floor(1000 * Lib.pseudoRandom());
            }
            mockCopy.data[0].dimensions[i] = newDimension;
        }

        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(60);
            expect(document.querySelectorAll('.axis').length).toEqual(60);
        })
        .then(done, done.fail);
    });

    it('@gl Skip dimensions which are not plain objects or whose `values` is not an array', function(done) {
        var mockCopy = Lib.extendDeep({}, mock1);
        var newDimension, i, j;

        Lib.seedPseudoRandom();

        mockCopy.layout.width = 680;
        mockCopy.data[0].dimensions = [];
        for(i = 0; i < 5; i++) {
            newDimension = Lib.extendDeep({}, mock1.data[0].dimensions[0]);
            newDimension.id = 'S' + i;
            newDimension.label = 'S' + i;
            delete newDimension.constraintrange;
            newDimension.range = [1, 2];
            newDimension.values = [];
            for(j = 0; j < 100; j++) {
                newDimension.values[j] = 1 + Lib.pseudoRandom();
            }
            mockCopy.data[0].dimensions[i] = newDimension;
        }

        mockCopy.data[0].dimensions[0] = 'This is not a plain object';
        mockCopy.data[0].dimensions[1].values = 'This is not an array';

        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(5); // it's still five, but ...
            expect(document.querySelectorAll('.axis').length).toEqual(3); // only 3 axes shown
        })
        .then(done, done.fail);
    });
});

describe('parcoords Lifecycle methods', function() {
    var gd;
    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
        gd = createGraphDiv();
    });
    afterEach(destroyGraphDiv);

    it('Plotly.deleteTraces with one trace removes the plot', function(done) {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].line.showscale = false;

        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(gd.data.length).toEqual(1);

            return Plotly.deleteTraces(gd, 0).then(function() {
                expect(d3SelectAll('.gl-canvas').node(0)).toEqual(null);
                expect(gd.data.length).toEqual(0);
            });
        })
        .then(done, done.fail);
    });

    it('@gl Plotly.deleteTraces with two traces removes the deleted plot', function(done) {
        var mockCopy = Lib.extendDeep({}, mock);
        var mockCopy2 = Lib.extendDeep({}, mock);
        mockCopy2.data[0].dimensions.splice(3, 4);
        mockCopy.data[0].line.showscale = false;

        Plotly.newPlot(gd, mockCopy)
            .then(function() {
                expect(gd.data.length).toEqual(1);
                expect(document.querySelectorAll('.y-axis').length).toEqual(10);
                return _doPlot(gd, mockCopy2);
            })
            .then(function() {
                expect(gd.data.length).toEqual(2);
                expect(document.querySelectorAll('.y-axis').length).toEqual(10 + 7);
                return Plotly.deleteTraces(gd, [0]);
            })
            .then(function() {
                expect(document.querySelectorAll('.gl-canvas').length).toEqual(3);
                expect(document.querySelectorAll('.y-axis').length).toEqual(7);
                expect(gd.data.length).toEqual(1);
                return Plotly.deleteTraces(gd, 0);
            })
            .then(function() {
                expect(document.querySelectorAll('.gl-canvas').length).toEqual(0);
                expect(document.querySelectorAll('.y-axis').length).toEqual(0);
                expect(gd.data.length).toEqual(0);
            })
            .then(done, done.fail);
    });

    function _assertVisibleData(visible, msg) {
        return function() {
            var canvases = d3SelectAll('.gl-canvas');
            expect(canvases.size()).toBe(3, msg);
            canvases.each(function() {
                var imageArray = readPixel(this, 0, 0, this.width, this.height);
                var foundPixel = false;
                var i = 0;
                do {
                    foundPixel = foundPixel || imageArray[i++] !== 0;
                } while(!foundPixel && i < imageArray.length);
                expect(foundPixel).toBe(visible, msg + ' - ' + this.className);
            });
        };
    }

    it('@gl Calling `Plotly.restyle` with zero panels left should erase lines', function(done) {
        var mockCopy = Lib.extendDeep({}, mock2);

        function restyleDimension(key, dimIndex, setterValue) {
            var value = Array.isArray(setterValue) ? setterValue[0] : setterValue;
            return function() {
                return Plotly.restyle(gd, 'dimensions[' + dimIndex + '].' + key, setterValue).then(function() {
                    expect(gd.data[0].dimensions[dimIndex][key]).toEqual(value, 'for dimension attribute \'' + key + '\'');
                });
            };
        }

        Plotly.newPlot(gd, mockCopy)
        .then(_assertVisibleData(true, 'initial'))
        .then(restyleDimension('values', 1, [[]]))
        .then(_assertVisibleData(false, 'no panels'))
        .then(done, done.fail);
    });

    it('@gl displays focused and context data after relayout', function(done) {
        var mockCopy = Lib.extendDeep({}, mock2);

        Plotly.newPlot(gd, mockCopy)
        .then(_assertVisibleData(true, 'initial'))
        .then(function() {
            return Plotly.relayout(gd, 'paper_bgcolor', '#eef');
        })
        .then(_assertVisibleData(true, 'after relayout'))
        .then(done, done.fail);
    });

    describe('Having two datasets', function() {
        it('@gl Two subsequent calls to _doPlot should create two parcoords rows', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);
            var mockCopy2 = Lib.extendDeep({}, mock);
            mockCopy.data[0].domain = {x: [0, 0.45]};
            mockCopy2.data[0].domain = {x: [0.55, 1]};
            mockCopy2.data[0].dimensions.splice(3, 4);

            expect(document.querySelectorAll('.gl-container').length).toEqual(0);

            Plotly.newPlot(gd, mockCopy)
                .then(function() {
                    expect(1).toEqual(1);
                    expect(document.querySelectorAll('.gl-container').length).toEqual(1);
                    expect(gd.data.length).toEqual(1);

                    return _doPlot(gd, mockCopy2);
                })
                .then(function() {
                    expect(1).toEqual(1);
                    expect(document.querySelectorAll('.gl-container').length).toEqual(1);
                    expect(gd.data.length).toEqual(2);
                })
                .then(done, done.fail);
        });

        it('@gl Plotly.addTraces should add a new parcoords row', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);
            var mockCopy2 = Lib.extendDeep({}, mock);
            mockCopy.data[0].domain = {y: [0, 0.35]};
            mockCopy2.data[0].domain = {y: [0.65, 1]};
            mockCopy2.data[0].dimensions.splice(3, 4);

            expect(document.querySelectorAll('.gl-container').length).toEqual(0);

            Plotly.newPlot(gd, mockCopy)
                .then(function() {
                    expect(document.querySelectorAll('.gl-container').length).toEqual(1);
                    expect(gd.data.length).toEqual(1);

                    return Plotly.addTraces(gd, [mockCopy2.data[0]]);
                })
                .then(function() {
                    expect(document.querySelectorAll('.gl-container').length).toEqual(1);
                    expect(gd.data.length).toEqual(2);
                })
                .then(done, done.fail);
        });

        it('@gl Plotly.restyle should update the existing parcoords row', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);
            var mockCopy2 = Lib.extendDeep({}, mock);

            delete mockCopy.data[0].dimensions[0].constraintrange;
            delete mockCopy2.data[0].dimensions[0].constraintrange;

            // in this example, the brush range doesn't change...
            mockCopy.data[0].dimensions[2].constraintrange = [0, 2];
            mockCopy2.data[0].dimensions[2].constraintrange = [0, 2];

            // .. but what's inside the brush does:
            function numberUpdater(v) {
                switch(v) {
                    case 0.5: return 2.5;
                    default: return v;
                }
            }

            // shuffle around categorical values
            mockCopy2.data[0].dimensions[2].ticktext = ['A', 'B', 'Y', 'AB', 'Z'];
            mockCopy2.data[0].dimensions[2].tickvals = [0, 1, 2, 2.5, 3];
            mockCopy2.data[0].dimensions[2].values = mockCopy2.data[0].dimensions[2].values.map(numberUpdater);

            expect(document.querySelectorAll('.gl-container').length).toEqual(0);

            Plotly.newPlot(gd, mockCopy)
                .then(function() {
                    expect(document.querySelectorAll('.gl-container').length).toEqual(1);
                    expect(gd.data.length).toEqual(1);

                    return Plotly.restyle(gd, {
                        // wrap the `dimensions` array
                        dimensions: [mockCopy2.data[0].dimensions]
                    });
                })
                .then(function() {
                    expect(document.querySelectorAll('.gl-container').length).toEqual(1);
                    expect(gd.data.length).toEqual(1);
                })
                .then(done, done.fail);
        });
    });

    it('@gl line.color `Plotly.restyle` should change focus layer', function(done) {
        var testLayer = '.gl-canvas-focus';
        Plotly.newPlot(gd, [{
            type: 'parcoords',
            dimensions: [{
                values: [1, 2]
            }, {
                values: [2, 4]
            }],
            line: {color: 'blue'}
        }], {
            width: 300,
            height: 200
        })
        .then(function() {
            var rgb = getAvgPixelByChannel(testLayer);
            expect(rgb[0]).toBe(0, 'no red');
            expect(rgb[2]).not.toBe(0, 'all blue');

            return Plotly.restyle(gd, 'line.color', 'red');
        })
        .then(function() {
            var rgb = getAvgPixelByChannel(testLayer);
            expect(rgb[0]).not.toBe(0, 'all red');
            expect(rgb[2]).toBe(0, 'no blue');
        })
        .then(done, done.fail);
    });

    it('@gl line.color `Plotly.restyle` should not change context layer', function(done) {
        var testLayer = '.gl-canvas-context';
        var oldRGB, newRGB;

        Plotly.newPlot(gd, [{
            type: 'parcoords',
            dimensions: [{
                values: [1, 2]
            }, {
                values: [2, 4]
            }],
            line: {color: 'blue'}
        }], {
            width: 300,
            height: 200
        })
        .then(function() {
            var rgb = getAvgPixelByChannel(testLayer);
            oldRGB = rgb[0] + rgb[1] + rgb[2] / 3.0;
            expect(oldRGB).toBeGreaterThan(0, 'not all black');
            expect(oldRGB).toBeLessThan(255, 'not all white');

            return Plotly.restyle(gd, 'line.color', 'red');
        })
        .then(function() {
            var rgb = getAvgPixelByChannel(testLayer);
            newRGB = rgb[0] + rgb[1] + rgb[2] / 3.0;
            expect(newRGB).toBeGreaterThan(0, 'not all black');
            expect(newRGB).toBeLessThan(255, 'not all white');

            expect(newRGB).toBe(oldRGB, 'no change to context');
        })
        .then(done, done.fail);
    });
});

describe('parcoords hover', function() {
    var mockCopy;
    var gd;

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

        mockCopy = Lib.extendDeep({}, mock);
        mockCopy.data[0].domain = {
            x: [0.1, 0.9],
            y: [0.05, 0.85]
        };

        if(!mockCopy.config) mockCopy.config = {};
        mockCopy.config.plotGlPixelRatio = 1;

        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('@gl Should emit a \'plotly_hover\' event', function(done) {
        var hoverCalls = 0;
        var unhoverCalls = 0;

        Plotly.react(gd, mockCopy)
        .then(function() {
            gd.on('plotly_hover', function() { hoverCalls++; });
            gd.on('plotly_unhover', function() { unhoverCalls++; });

            expect(hoverCalls).toBe(0);
            expect(unhoverCalls).toBe(0);

            mouseTo(324, 216);
            mouseTo(315, 218);

            return delay(20)();
        })
        .then(function() {
            expect(hoverCalls).toBe(1);
            expect(unhoverCalls).toBe(0);
            mouseTo(329, 153);
        })
        .then(delay(20))
        .then(function() {
            expect(hoverCalls).toBe(1);
            expect(unhoverCalls).toBe(1);
        })
        .then(done, done.fail);
    });
});

describe('parcoords basic use', function() {
    var mockCopy;
    var gd;

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

        mockCopy = Lib.extendDeep({}, mock);
        mockCopy.data[0].domain = {
            x: [0.1, 0.9],
            y: [0.05, 0.85]
        };

        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('@gl should create three WebGL contexts per graph', function(done) {
        Plotly.react(gd, mockCopy)
        .then(function() {
            var cnt = 0;
            d3Select(gd).selectAll('canvas').each(function(d) {
                if(d.regl) cnt++;
            });
            expect(cnt).toBe(3);
        })
        .then(done, done.fail);
    });

    it('@gl `Plotly.newPlot` should have proper fields on `gd.data` on initial rendering', function(done) {
        Plotly.react(gd, mockCopy)
        .then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].dimensions.length).toEqual(11);
            expect(document.querySelectorAll('.axis').length).toEqual(10); // one dimension is `visible: false`
            expect(gd.data[0].line.cmin).toEqual(-4000);
            expect(gd.data[0].dimensions[0].visible).not.toBeDefined();
            expect(gd.data[0].dimensions[4].visible).toEqual(true);
            expect(gd.data[0].dimensions[5].visible).toEqual(false);
            expect(gd.data[0].dimensions[0].range).not.toBeDefined();
            expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
            expect(gd.data[0].dimensions[0].constraintrange).toEqual([100000, 150000]);
            expect(gd.data[0].dimensions[1].range).toBeDefined();
            expect(gd.data[0].dimensions[1].range).toEqual([0, 700000]);
            expect(gd.data[0].dimensions[1].constraintrange).not.toBeDefined();
        })
        .then(done, done.fail);
    });

    it('@gl Calling _doPlot again should add the new parcoords', function(done) {
        var reversedMockCopy = Lib.extendDeep({}, mockCopy);
        reversedMockCopy.data[0].dimensions = reversedMockCopy.data[0].dimensions.slice().reverse();
        reversedMockCopy.data[0].dimensions.forEach(function(d) {d.id = 'R_' + d.id;});
        reversedMockCopy.data[0].dimensions.forEach(function(d) {d.label = 'R_' + d.label;});

        Plotly.react(gd, mockCopy)
        .then(function() {
            return _doPlot(gd, reversedMockCopy);
        })
        .then(function() {
            expect(gd.data.length).toEqual(2);

            expect(gd.data[0].dimensions.length).toEqual(11);
            expect(gd.data[0].line.cmin).toEqual(-4000);
            expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
            expect(gd.data[0].dimensions[0].constraintrange).toEqual([100000, 150000]);
            expect(gd.data[0].dimensions[1].constraintrange).not.toBeDefined();

            expect(gd.data[1].dimensions.length).toEqual(11);
            expect(gd.data[1].line.cmin).toEqual(-4000);
            expect(gd.data[1].dimensions[10].constraintrange).toBeDefined();
            expect(gd.data[1].dimensions[10].constraintrange).toEqual([100000, 150000]);
            expect(gd.data[1].dimensions[1].constraintrange).not.toBeDefined();

            expect(document.querySelectorAll('.axis').length).toEqual(20); // one dimension is `visible: false`
        })
        .then(done, done.fail);
    });

    it('@gl Calling `Plotly.restyle` with a string path to colorscale should amend the preexisting parcoords', function(done) {
        Plotly.react(gd, mockCopy)
        .then(function() {
            expect(gd.data.length).toEqual(1);

            return Plotly.restyle(gd, 'line.colorscale', 'Viridis').then(function() {
                expect(gd.data.length).toEqual(1);

                expect(gd.data[0].line.colorscale).toEqual('Viridis');
                expect(gd.data[0].dimensions.length).toEqual(11);
                expect(gd.data[0].line.cmin).toEqual(-4000);
                expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
                expect(gd.data[0].dimensions[0].constraintrange).toEqual([100000, 150000]);
                expect(gd.data[0].dimensions[1].constraintrange).not.toBeDefined();
            });
        })
        .then(done, done.fail);
    });

    it('@gl Calling `Plotly.restyle` for a dimension should amend the preexisting dimension', function(done) {
        function restyleDimension(key, setterValue) {
            // array values need to be wrapped in an array; unwrapping here for value comparison
            var value = Array.isArray(setterValue) ? setterValue[0] : setterValue;

            return function() {
                return Plotly.restyle(gd, 'dimensions[2].' + key, setterValue).then(function() {
                    expect(gd.data[0].dimensions[2][key]).toEqual(value, 'for dimension attribute \'' + key + '\'');
                });
            };
        }

        Plotly.react(gd, mockCopy)
            .then(restyleDimension('label', 'new label'))
            .then(restyleDimension('tickvals', [[0, 0.1, 0.4, 1, 2]]))
            .then(restyleDimension('ticktext', [['alpha', 'gamma', 'beta', 'omega', 'epsilon']]))
            .then(restyleDimension('tickformat', '4s'))
            .then(restyleDimension('range', [[0, 2]]))
            .then(restyleDimension('constraintrange', [[0, 1]]))
            .then(restyleDimension('values', [[0, 0.1, 0.4, 1, 2, 0, 0.1, 0.4, 1, 2]]))
            .then(restyleDimension('visible', false))
            .then(done, done.fail);
    });

    it('@gl Calling `Plotly.restyle` with an object should amend the preexisting parcoords', function(done) {
        Plotly.react(gd, mockCopy)
        .then(function() {
            var newStyle = Lib.extendDeep({}, mockCopy.data[0].line);
            newStyle.colorscale = 'Viridis';
            newStyle.reversescale = false;

            return Plotly.restyle(gd, {line: newStyle});
        })
        .then(function() {
            expect(gd.data.length).toEqual(1);

            expect(gd.data[0].line.colorscale).toEqual('Viridis');
            expect(gd.data[0].line.reversescale).toEqual(false);
            expect(gd.data[0].dimensions.length).toEqual(11);
            expect(gd.data[0].line.cmin).toEqual(-4000);
            expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
            expect(gd.data[0].dimensions[0].constraintrange).toEqual([100000, 150000]);
            expect(gd.data[0].dimensions[1].constraintrange).not.toBeDefined();
        })
        .then(done, done.fail);
    });

    it('@gl Should emit a \'plotly_restyle\' event', function(done) {
        var tester = (function() {
            var eventCalled = false;

            return {
                set: function(d) {eventCalled = d;},
                get: function() {return eventCalled;}
            };
        })();

        Plotly.react(gd, mockCopy)
        .then(function() {
            gd.on('plotly_restyle', function() {
                tester.set(true);
            });

            expect(tester.get()).toBe(false);
            return Plotly.restyle(gd, 'line.colorscale', 'Viridis');
        })
        .then(function() {
            expect(tester.get()).toBe(true);
        })
        .then(done, done.fail);
    });

    it('@gl Calling `Plotly.relayout` with string should amend the preexisting parcoords', function(done) {
        Plotly.react(gd, mockCopy)
        .then(function() {
            expect(gd.layout.width).toEqual(1184);

            return Plotly.relayout(gd, 'width', 500);
        })
        .then(function() {
            expect(gd.data.length).toEqual(1);

            expect(gd.layout.width).toEqual(500);
            expect(gd.data[0].line.colorscale).toEqual('Jet');
            expect(gd.data[0].dimensions.length).toEqual(11);
            expect(gd.data[0].line.cmin).toEqual(-4000);
            expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
            expect(gd.data[0].dimensions[0].constraintrange).toEqual([100000, 150000]);
            expect(gd.data[0].dimensions[1].constraintrange).not.toBeDefined();
        })
        .then(done, done.fail);
    });

    it('@gl Calling `Plotly.relayout`with object should amend the preexisting parcoords', function(done) {
        Plotly.react(gd, mockCopy)
        .then(function() {
            expect(gd.layout.width).toEqual(1184);

            return Plotly.relayout(gd, {width: 500});
        })
        .then(function() {
            expect(gd.data.length).toEqual(1);

            expect(gd.layout.width).toEqual(500);
            expect(gd.data[0].line.colorscale).toEqual('Jet');
            expect(gd.data[0].dimensions.length).toEqual(11);
            expect(gd.data[0].line.cmin).toEqual(-4000);
            expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
            expect(gd.data[0].dimensions[0].constraintrange).toEqual([100000, 150000]);
            expect(gd.data[0].dimensions[1].constraintrange).not.toBeDefined();
        })
        .then(done, done.fail);
    });

    it('@gl Calling `Plotly.animate` with patches targeting `dimensions` attributes should do the right thing', function(done) {
        Plotly.react(gd, [{
            type: 'parcoords',
            line: {color: 'blue'},
            dimensions: [{
                range: [1, 5],
                constraintrange: [1, 2],
                label: 'A',
                values: [1, 4]
            }, {
                range: [1, 5],
                label: 'B',
                values: [3, 1.5],
                tickvals: [1.5, 3, 4.5]
            }]
        }])
        .then(function() {
            return Plotly.animate(gd, {
                data: [{
                    'line.color': 'red',
                    'dimensions[0].constraintrange': [1, 4]
                }],
                traces: [0],
                layout: {}
            });
        })
        .then(function() {
            expect(gd.data[0].line.color).toBe('red');
            expect(gd.data[0].dimensions[0]).toEqual({
                range: [1, 5],
                constraintrange: [1, 4],
                label: 'A',
                values: [1, 4]
            });
        })
        .then(done, done.fail);
    });

    it('@gl should fire *plotly_webglcontextlost* when on webgl context lost', function(done) {
        var eventData;
        var cnt = 0;

        function trigger(name) {
            var ev = new window.WebGLContextEvent('webglcontextlost');
            var canvas = gd.querySelector('.gl-canvas-' + name);
            canvas.dispatchEvent(ev);
        }

        function _assert(d, c) {
            expect((eventData || {}).event).toBeDefined();
            expect((eventData || {}).layer).toBe(d);
            expect(cnt).toBe(c);
        }

        Plotly.react(gd, mockCopy)
        .then(function() {
            gd.on('plotly_webglcontextlost', function(d) {
                eventData = d;
                cnt++;
            });

            trigger('context');
            _assert('contextLayer', 1);

            trigger('focus');
            _assert('focusLayer', 2);

            trigger('pick');
            _assert('pickLayer', 3);
        })
        .then(done, done.fail);
    });
});

describe('parcoords react more attributes', function() {
    var gd;

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('@gl should change various axis parameters', function(done) {
        Plotly.react(gd, mock3)
        .then(function() {
            var mockCopy = Lib.extendDeep({}, mock3);
            var m0 = mockCopy.data[0];
            m0.labelangle = '-90';
            m0.labelfont = { size: '24', family: 'Times', color: 'orange' };
            m0.rangefont = { size: '20', family: 'Times', color: 'brown' };
            m0.tickfont = { size: '16', family: 'Times', color: 'yellow' };
            m0.dimensions[0].label = 'Changed!';
            m0.dimensions[1].range = ['-2', '2'];
            m0.dimensions[2].constraintrange = [];
            m0.dimensions[1].multiselect = false;
            m0.dimensions[1].constraintrange = [
            [-1.5, -0.5],
            [0, 1.5] // won't be selected because multiselect is tuned off.
            ];
            m0.dimensions[0].constraintrange = [[2, 4], [7, 10], [11, 12]];
            m0.dimensions[0].tickvals = ['1', '2', '3', '5', '8', '13'];
            m0.dimensions[0].ticktext = ['1/1', '2/1', '3/2', '5/3', '8/5', '13/8'];
            m0.domain = { x: [0, 0.5], y: [0, 0.5] };

            return Plotly.react(gd, mockCopy.data);
        })
        .then(function() {
            var allParcoords = d3SelectAll('.' + PC.cn.parcoords);

            var allLabels = allParcoords.selectAll('.' + PC.cn.axisTitle);
            expect(allLabels.size()).toBe(3);
            allLabels.each(function(d) {
                expect(d.model.labelAngle).toEqual(-90);
                expect(d.model.labelFont.size).toEqual(24);
                expect(d.model.labelFont.family).toEqual('Times');
                expect(d.model.labelFont.color).toEqual('orange');
            });
            expect(allLabels[0][2].getAttribute('data-unformatted'), 'Changed!');

            var allTopRanges = allParcoords.selectAll('.' + PC.cn.axisExtentTopText);
            expect(allTopRanges.size()).toBe(3);
            allTopRanges.each(function(d) {
                expect(d.model.rangeFont.size).toEqual(20);
                expect(d.model.rangeFont.family).toEqual('Times');
                expect(d.model.rangeFont.color).toEqual('brown');
            });

            var allBottomRanges = allParcoords.selectAll('.' + PC.cn.axisExtentBottomText);
            expect(allBottomRanges.size()).toBe(3);
            allBottomRanges.each(function(d) {
                expect(d.model.rangeFont.size).toEqual(20);
                expect(d.model.rangeFont.family).toEqual('Times');
                expect(d.model.rangeFont.color).toEqual('brown');
            });

            var allTicks = allParcoords.selectAll('.' + PC.cn.axis);
            expect(allTicks.size()).toBe(3);
            var allTickVals = [];
            var allTickText = [];
            allTicks.each(function(d) {
                expect(d.model.tickFont.size).toEqual(16);
                expect(d.model.tickFont.family).toEqual('Times');
                expect(d.model.tickFont.color).toEqual('yellow');

                allTickVals.push(d.tickvals);
                allTickText.push(d.ticktext);
            });
            expect(allTickVals[2]).toBeCloseToArray([1, 2, 3, 5, 8, 13]);
            expect(allTickText[2]).toBeCloseToArray(['1/1', '2/1', '3/2', '5/3', '8/5', '13/8']);

            var allHighlights = allParcoords.selectAll('.' + PC.cn.axisBrush).selectAll('.highlight');
            expect(allHighlights.size()).toBe(3);
            var nHighlight = [];
            allHighlights.each(function() {
                var highlight = d3Select(this)[0][0];
                nHighlight.push(
                    highlight.getAttribute('stroke-dasharray').split(',').length
                );
            });
            expect(nHighlight[2]).toBe(6);
            expect(nHighlight[1]).toBe(2);
            expect(nHighlight[0]).toBe(4);
        })
        .then(done, done.fail);
    });

    it('@gl should change axis visibility', function(done) {
        var mockCopy = Lib.extendDeep({}, mock3);
        var m0 = mockCopy.data[0];

        m0.dimensions[1].visible = false;

        Plotly.react(gd, mockCopy.data).then(function() {
            var allParcoords = d3SelectAll('.' + PC.cn.parcoords);

            var allLabels = allParcoords.selectAll('.' + PC.cn.axisTitle);
            expect(allLabels.size()).toBe(2);

            m0.dimensions[1].visible = true;
        })
        .then(function() {
            return Plotly.react(gd, mockCopy.data).then(function() {
                var allParcoords = d3SelectAll('.' + PC.cn.parcoords);

                var allLabels = allParcoords.selectAll('.' + PC.cn.axisTitle);
                expect(allLabels.size()).toBe(3);
            });
        })
        .then(done, done.fail);
    });
});

describe('parcoords constraint interactions - without defined axis ranges', function() {
    var gd, initialDashArray0, initialDashArray1;

    function initialFigure() {
        return {
            data: [{
                type: 'parcoords',
                dimensions: [{
                    values: [4, 4, 0, 0, 4, 4, 1, 1, 2, 3, 4, 0, 1, 2, 3, 4],
                    tickvals: [0, 1, 2, 3, 4],
                    ticktext: ['a', 'b', 'c', 'd', 'e'],
                    constraintrange: [2.75, 4]
                }, {
                    values: [5, 0, 1, 5, 9, 10, 10, 9, 1],
                    constraintrange: [7, 9]
                }]
            }],
            layout: {
                width: 400,
                height: 400,
                margin: {t: 100, b: 100, l: 100, r: 100}
            }
        };
    }

    var initialSnapDuration;
    var shortenedSnapDuration = 20;
    var snapDelay = 100;
    var noSnapDelay = 20;
    beforeAll(function() {
        initialSnapDuration = PC.bar.snapDuration;
        PC.bar.snapDuration = shortenedSnapDuration;
    });

    afterAll(function() {
        destroyGraphDiv();
        PC.bar.snapDuration = initialSnapDuration;
    });

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function getDashArray(index) {
        var highlight = document.querySelectorAll('.highlight')[index];
        return highlight.attributes['stroke-dasharray'].value.split(',').map(Number);
    }


    function checkDashCount(dashArray, intervals) {
        // no-selection dasharrays have 2 entries:
        //   0 (no initial line) and a final gap as long as the whole bar
        // single-bar dasharrays have 4 entries:
        //   0 (no initial line), gap to first bar, first bar, final gap
        // each additional interval adds 2 entries before the final gap:
        //   middle gap and new bar

        var segmentCount = 2 + 2 * intervals;
        expect(dashArray.length).toBe(segmentCount, dashArray);
    }

    it('@gl snaps ordinal constraints', function(done) {
        var newDashArray;

        Plotly.react(gd, initialFigure())
        .then(function() {
            initialDashArray0 = getDashArray(0);
            initialDashArray1 = getDashArray(1);
            checkDashCount(initialDashArray0, 1);
            checkDashCount(initialDashArray1, 1);

            // first: drag almost to 2 but not quite - constraint will snap back to [2.75, 4]
            mostOfDrag(105, 165, 105, 190);
            newDashArray = getDashArray(0);
            expect(newDashArray).not.toBeCloseToArray(initialDashArray0);
            checkDashCount(newDashArray, 1);

            mouseEvent('mouseup', 105, 190);
            return delay(snapDelay)();
        })
        .then(function() {
            expect(getDashArray(0)).toBeCloseToArray(initialDashArray0);
            expect(gd.data[0].dimensions[0].constraintrange).toBeCloseToArray([2.75, 4]);

            // now select a range between 1 and 2 but missing both - it will disappear on mouseup
            mostOfDrag(105, 210, 105, 240);
            newDashArray = getDashArray(0);
            checkDashCount(newDashArray, 2);

            mouseEvent('mouseup', 105, 240);
        })
        .then(delay(snapDelay))
        .then(function() {
            expect(getDashArray(0)).toBeCloseToArray(initialDashArray0);
            expect(gd.data[0].dimensions[0].constraintrange).toBeCloseToArray([2.75, 4]);

            // select across 1, making a new region
            mostOfDrag(105, 240, 105, 260);
            newDashArray = getDashArray(0);
            checkDashCount(newDashArray, 2);

            mouseEvent('mouseup', 105, 260);
        })
        .then(delay(snapDelay))
        .then(function() {
            newDashArray = getDashArray(0);
            checkDashCount(newDashArray, 2);
            expect(gd.data[0].dimensions[0].constraintrange).toBeCloseTo2DArray([[0.75, 1.25], [2.75, 4]]);

            // select from 2 down to just above 1, extending the new region
            mostOfDrag(105, 190, 105, 240);
            newDashArray = getDashArray(0);
            checkDashCount(newDashArray, 2);

            mouseEvent('mouseup', 105, 240);
        })
        .then(delay(snapDelay))
        .then(function() {
            newDashArray = getDashArray(0);
            checkDashCount(newDashArray, 2);
            expect(gd.data[0].dimensions[0].constraintrange).toBeCloseTo2DArray([[0.75, 2.25], [2.75, 4]]);

            // clear the whole thing
            click(105, 275);
        })
        .then(delay(snapDelay))
        .then(function() {
            checkDashCount(getDashArray(0), 0);
            expect(gd.data[0].dimensions[0].constraintrange).toBeUndefined();

            // click to select 1
            click(105, 250);
        })
        .then(delay(noSnapDelay))
        .then(function() {
            checkDashCount(getDashArray(0), 1);
            expect(gd.data[0].dimensions[0].constraintrange).toBeCloseToArray([0.75, 1.25]);

            // click to select 4
            click(105, 105);
        })
        .then(delay(noSnapDelay))
        .then(function() {
            checkDashCount(getDashArray(0), 2);
            expect(gd.data[0].dimensions[0].constraintrange).toBeCloseTo2DArray([[0.75, 1.25], [3.75, 4]]);
        })
        .then(done, done.fail);
    });

    it('@gl updates continuous constraints with no snap', function(done) {
        var newDashArray;

        Plotly.react(gd, initialFigure())
        .then(function() {
            initialDashArray0 = getDashArray(0);
            initialDashArray1 = getDashArray(1);
            checkDashCount(initialDashArray0, 1);
            checkDashCount(initialDashArray1, 1);

            // first: extend 7 to 5
            mostOfDrag(295, 160, 295, 200);
            newDashArray = getDashArray(1);
            expect(newDashArray).not.toBeCloseToArray(initialDashArray1);
            checkDashCount(newDashArray, 1);

            mouseEvent('mouseup', 295, 190);
            return delay(noSnapDelay)();
        })
        .then(function() {
            expect(getDashArray(1)).toBeCloseToArray(newDashArray);
            expect(gd.data[0].dimensions[1].constraintrange).toBeCloseToArray([4.8959, 9]);

            // now select ~1-3
            mostOfDrag(295, 280, 295, 240);
            newDashArray = getDashArray(1);
            checkDashCount(newDashArray, 2);

            mouseEvent('mouseup', 295, 240);
        })
        .then(delay(noSnapDelay))
        .then(function() {
            expect(getDashArray(1)).toBeCloseToArray(newDashArray);
            expect(gd.data[0].dimensions[1].constraintrange).toBeCloseTo2DArray([[0.7309, 2.8134], [4.8959, 9]]);

            // now pull 5 all the way to 0
            mostOfDrag(295, 200, 295, 350);
            newDashArray = getDashArray(1);
            expect(newDashArray).not.toBeCloseToArray(initialDashArray1);
            checkDashCount(newDashArray, 1);

            mouseEvent('mouseup', 295, 260);
        })
        .then(delay(noSnapDelay))
        .then(function() {
            expect(getDashArray(1)).toBeCloseToArray(newDashArray);
            expect(gd.data[0].dimensions[1].constraintrange).toBeCloseToArray([-2.913369429404415, 9]);
        })
        .then(done, done.fail);
    });

    it('@gl will only select one region when multiselect is disabled', function(done) {
        var newDashArray;

        Plotly.react(gd, initialFigure())
        .then(function() {
            return Plotly.restyle(gd, {'dimensions[1].multiselect': false});
        })
        .then(function() {
            expect(getDashArray(1)).toBeCloseToArray(initialDashArray1);

            // select ~1-3
            mostOfDrag(295, 280, 295, 240);
            newDashArray = getDashArray(1);
            checkDashCount(newDashArray, 1);

            mouseEvent('mouseup', 295, 240);
        })
        .then(delay(noSnapDelay))
        .then(function() {
            expect(getDashArray(1)).toBeCloseToArray(newDashArray);
            expect(gd.data[0].dimensions[1].constraintrange).toBeCloseToArray([0.7309, 2.8134]);

            // but dimension 0 can still multiselect
            mostOfDrag(105, 240, 105, 260);
            newDashArray = getDashArray(0);
            checkDashCount(newDashArray, 2);

            mouseEvent('mouseup', 105, 260);
        })
        .then(delay(snapDelay))
        .then(function() {
            var finalDashArray = getDashArray(0);
            expect(finalDashArray).not.toBeCloseToArray(newDashArray);
            checkDashCount(finalDashArray, 2);
            expect(gd.data[0].dimensions[0].constraintrange).toBeCloseTo2DArray([[0.75, 1.25], [2.75, 4]]);
        })
        .then(done, done.fail);
    });

    it('@gl should keep single point dimension selected', function(done) {
        var testLayer = '.gl-canvas-focus';

        Plotly.react(gd, {
            data: [
                {
                    type: 'parcoords',
                    line: {
                        color: 'blue'
                    },

                    dimensions: [{
                        label: 'A',
                        values: [0, 1]
                    }, {
                        label: 'B',
                        values: [2, 2],
                        tickvals: [2],
                        ticktext: ['single point']
                    }]
                }
            ],
            layout: {
                width: 400,
                height: 400,
                margin: {t: 100, b: 100, l: 100, r: 100}
            }
        })
        .then(function() {
            // select
            mostOfDrag(295, 250, 295, 150);
            mouseEvent('mouseup', 295, 150);
        })
        .then(delay(snapDelay))
        .then(function() {
            var rgb = getAvgPixelByChannel(testLayer);

            expect(rgb[0]).toBe(0, 'no red');
            expect(rgb[2]).not.toBe(0, 'all blue');
        })
        .then(done, done.fail);
    });
});

describe('parcoords constraint interactions - with defined axis ranges', function() {
    function initialFigure() {
        return {
            data: [{
                type: 'parcoords',
                dimensions: [{
                    values: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],

                }, {
                    values: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9],
                    tickvals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                    ticktext: ['a', 'b', 'c', 'd', 'e', 'f', 'i', 'j', 'k', 'l'],
                    range: [3, 7],
                    constraintrange: [4, 6]
                }]
            }],
            layout: {
                width: 400,
                height: 400,
                margin: {t: 100, b: 100, l: 100, r: 100}
            }
        };
    }

    var gd;
    var initialSnapDuration;
    var shortenedSnapDuration = 20;
    var noSnapDelay = 20;
    beforeAll(function() {
        initialSnapDuration = PC.bar.snapDuration;
        PC.bar.snapDuration = shortenedSnapDuration;
    });

    afterAll(function() {
        destroyGraphDiv();
        PC.bar.snapDuration = initialSnapDuration;
    });

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('@gl updates constraints above and below axis ranges', function(done) {
        var x = 295;

        Plotly.react(gd, initialFigure())
        .then(function() {
            expect(gd.data[0].dimensions[1].constraintrange).toBeCloseToArray([4, 6]);

            // first: move above range
            mostOfDrag(x, 200, x, 100);
            mouseEvent('mouseup', x, 100);
            return delay(noSnapDelay)();
        })
        .then(function() {
            expect(gd.data[0].dimensions[1].constraintrange).toBeCloseToArray([5.75, 8.25]);
            // move back
            mostOfDrag(x, 110, x, 210);
            mouseEvent('mouseup', x, 210);
        })
        .then(delay(noSnapDelay))
        .then(function() {
            expect(gd.data[0].dimensions[1].constraintrange).toBeCloseToArray([3.75, 6.25]);
            // move below range
            mostOfDrag(x, 200, x, 300);
            mouseEvent('mouseup', x, 300);
        })
        .then(delay(noSnapDelay))
        .then(function() {
            expect(gd.data[0].dimensions[1].constraintrange).toBeCloseToArray([1.75, 4.25]);
            // move back
            mostOfDrag(x, 290, x, 190);
            mouseEvent('mouseup', x, 190);
        })
        .then(delay(noSnapDelay))
        .then(function() {
            expect(gd.data[0].dimensions[1].constraintrange).toBeCloseToArray([3.75, 6.25]);
        })
        .then(done, done.fail);
    });
});

describe('parcoords constraint click interactions - with pre-defined constraint ranges', function() {
    function initialFigure() {
        return {
            data: [{
                type: 'parcoords',
                dimensions: [{
                    values: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
                }, {
                    values: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6],
                    tickvals: [0, 1, 2, 3, 4, 5, 6],
                    ticktext: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
                    constraintrange: [1, 2]
                }]
            }],
            layout: {
                width: 400,
                height: 400,
                margin: {t: 100, b: 100, l: 100, r: 100}
            }
        };
    }

    var gd;
    var initialSnapDuration;
    var shortenedSnapDuration = 20;
    var snapDelay = 100;
    beforeAll(function() {
        initialSnapDuration = PC.bar.snapDuration;
        PC.bar.snapDuration = shortenedSnapDuration;
    });

    afterAll(function() {
        destroyGraphDiv();
        PC.bar.snapDuration = initialSnapDuration;
    });

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('@gl should not drop constraintrange on click', function(done) {
        Plotly.react(gd, initialFigure())
        .then(function() {
            expect(gd._fullData[0].dimensions[1].constraintrange).toBeCloseToArray([0.75, 2.25]);

            // click to add a new item to the selection
            mouseClick(295, 200);
            delay(snapDelay)();
        })
        .then(function() {
            expect(gd._fullData[0].dimensions[1].constraintrange).toBeCloseToArray([[0.75, 2.25], [2.75, 3.25]]);

            // click to deselect all
            mouseClick(295, 205);
        })
        .then(delay(snapDelay)())
        .then(function() {
            expect(gd._fullData[0].dimensions[1].constraintrange).toEqual(undefined);
        })
        .then(done, done.fail);
    });
});
