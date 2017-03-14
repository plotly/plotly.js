var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var d3 = require('d3');
var Plots = require('@src/plots/plots');
var Parcoords = require('@src/traces/parcoords');
var attributes = require('@src/traces/parcoords/attributes');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

// mock with two dimensions (one panel); special case, e.g. left and right panel is obv. the same
var mock2 = require('@mocks/gl2d_parcoords_2.json');

// mock with one dimension (zero panels); special case, as no panel can be rendered
var mock1 = require('@mocks/gl2d_parcoords_1.json');

// mock with zero dimensions; special case, as no dimension can be rendered
var mock0 = Lib.extendDeep({}, mock1);
mock0.data[0].dimensions = [];

var mock = require('@mocks/gl2d_parcoords_large.json');

var lineStart = 30;
var lineCount = 10;

describe('parcoords initialization tests', function() {

    'use strict';

    describe('parcoords defaults', function() {

        function _supply(traceIn) {
            var traceOut = { visible: true },
                defaultColor = '#444',
                layout = { };

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
            expect(fullTrace.dimensions).toEqual([{values: [1], visible: true, tickformat: '3s', _index: 0}]);
        });

        it('\'dimension.visible\' should be set to false, and other props just passed through if \'values\' is not provided', function() {
            var fullTrace = _supply({
                dimensions: [{
                    alienProperty: 'Alpha Centauri'
                }]
            });
            expect(fullTrace.dimensions).toEqual([{visible: false, values: [], _index: 0}]);
        });

        it('\'dimension.visible\' should be set to false, and other props just passed through if \'values\' is an empty array', function() {
            var fullTrace = _supply({
                dimensions: [{
                    values: [],
                    alienProperty: 'Alpha Centauri'
                }]
            });
            expect(fullTrace.dimensions).toEqual([{visible: false, values: [], _index: 0}]);
        });

        it('\'dimension.visible\' should be set to false, and other props just passed through if \'values\' is not an array', function() {
            var fullTrace = _supply({
                dimensions: [{
                    values: null,
                    alienProperty: 'Alpha Centauri'
                }]
            });
            expect(fullTrace.dimensions).toEqual([{visible: false, values: [], _index: 0}]);
        });

        it('\'dimension.values\' should get truncated to a common shortest length', function() {
            var fullTrace = _supply({dimensions: [
                {values: [321, 534, 542, 674]},
                {values: [562, 124, 942]},
                {values: [], visible: true},
                {values: [1, 2], visible: false} // shouldn't be truncated to as false
            ]});
            expect(fullTrace.dimensions).toEqual([
                {values: [], visible: true, tickformat: '3s', _index: 0},
                {values: [], visible: true, tickformat: '3s', _index: 1},
                {values: [], visible: true, tickformat: '3s', _index: 2},
                {values: [1, 2], visible: false, _index: 3}
            ]);
        });
    });

    describe('parcoords calc', function() {

        function _calc(trace) {
            var gd = { data: [trace] };

            Plots.supplyDefaults(gd);

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
                color: [0.5, 0.5, 0.5, 0.5],
                colorscale: [[0, '#444'], [1, '#444']],
                cmin: 0,
                cmax: 1
            });
        });

        it('use a singular \'color\' even if a \'colorscale\' is supplied', function() {

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
                color: [0.5, 0.5, 0.5, 0.5],
                colorscale: [[0, '#444'], [1, '#444']],
                autocolorscale: false,
                showscale: false,
                reversescale: false,
                cauto: true,
                cmin: 0,
                cmax: 1
            });
        });
    });
});

describe('@noCI parcoords', function() {

    beforeAll(function() {
        mock.data[0].dimensions.forEach(function(d) {
            d.values = d.values.slice(lineStart, lineStart + lineCount);
        });
        mock.data[0].line.color = mock.data[0].line.color.slice(lineStart, lineStart + lineCount);
    });

    afterEach(destroyGraphDiv);

    describe('edge cases', function() {

        it('Works fine with one panel only', function(done) {

            var mockCopy = Lib.extendDeep({}, mock2);
            var gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

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

                done();
            });
        });

        it('Do something sensible if there is no panel i.e. dimension count is less than 2', function(done) {

            var mockCopy = Lib.extendDeep({}, mock1);
            var gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].dimensions.length).toEqual(1);
                expect(document.querySelectorAll('.axis').length).toEqual(1); // sole axis still shows up
                expect(gd.data[0].line.cmin).toEqual(-4000);
                expect(gd.data[0].dimensions[0].visible).not.toBeDefined();
                expect(gd.data[0].dimensions[0].range).not.toBeDefined();
                expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
                expect(gd.data[0].dimensions[0].constraintrange).toEqual([200, 700]);

                done();
            });
        });

        it('Does not error with zero dimensions', function(done) {

            var mockCopy = Lib.extendDeep({}, mock0);
            var gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].dimensions.length).toEqual(0);
                expect(document.querySelectorAll('.axis').length).toEqual(0);
                done();
            });
        });

        it('Works with duplicate dimension labels', function(done) {

            var mockCopy = Lib.extendDeep({}, mock2);

            mockCopy.layout.width = 320;
            mockCopy.data[0].dimensions[1].label = mockCopy.data[0].dimensions[0].label;

            var gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].dimensions.length).toEqual(2);
                expect(document.querySelectorAll('.axis').length).toEqual(2);
                done();
            });
        });

        it('Works with a single line; also, use a longer color array than the number of lines', function(done) {

            var mockCopy = Lib.extendDeep({}, mock2);
            var dim, i, j;

            mockCopy.layout.width = 320;
            for(i = 0; i < mockCopy.data[0].dimensions.length; i++) {
                dim = mockCopy.data[0].dimensions[i];
                delete dim.constraintrange;
                dim.range = [1, 2];
                dim.values = [];
                for(j = 0; j < 1; j++) {
                    dim.values[j] = 1 + Math.random();
                }
            }

            var gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].dimensions.length).toEqual(2);
                expect(document.querySelectorAll('.axis').length).toEqual(2);
                expect(gd.data[0].dimensions[0].values.length).toEqual(1);
                done();
            });
        });

        it('Does not raise an error with zero lines and no specified range', function(done) {

            var mockCopy = Lib.extendDeep({}, mock2);
            var dim, i;

            mockCopy.layout.width = 320;
            for(i = 0; i < mockCopy.data[0].dimensions.length; i++) {
                dim = mockCopy.data[0].dimensions[i];
                delete dim.range;
                delete dim.constraintrange;
                dim.values = [];
            }

            var gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].dimensions.length).toEqual(2);
                expect(document.querySelectorAll('.axis').length).toEqual(0);
                expect(gd.data[0].dimensions[0].values.length).toEqual(0);
                done();
            });
        });

        it('Works with non-finite `values` elements', function(done) {

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

            var gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].dimensions.length).toEqual(2);
                expect(document.querySelectorAll('.axis').length).toEqual(2);
                expect(gd.data[0].dimensions[0].values.length).toEqual(values[0].length);
                done();
            });
        });

        it('Works with 60 dimensions', function(done) {

            var mockCopy = Lib.extendDeep({}, mock1);
            var newDimension, i, j;

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
                    newDimension.values[j] = 1 + Math.random();
                }
                mockCopy.data[0].dimensions[i] = newDimension;
            }

            var gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].dimensions.length).toEqual(60);
                expect(document.querySelectorAll('.axis').length).toEqual(60);
                done();
            });
        });

        it('Truncates 60+ dimensions to 60', function(done) {

            var mockCopy = Lib.extendDeep({}, mock1);
            var newDimension, i, j;

            mockCopy.layout.width = 1680;
            for(i = 0; i < 70; i++) {
                newDimension = Lib.extendDeep({}, mock1.data[0].dimensions[0]);
                newDimension.id = 'S' + i;
                newDimension.label = 'S' + i;
                delete newDimension.constraintrange;
                newDimension.range = [0, 999];
                for(j = 0; j < 10; j++) {
                    newDimension.values[j] = Math.floor(1000 * Math.random());
                }
                mockCopy.data[0].dimensions[i] = newDimension;
            }

            var gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].dimensions.length).toEqual(60);
                expect(document.querySelectorAll('.axis').length).toEqual(60);
                done();
            });
        });

        it('Truncates dimension values to the shortest array, retaining only 3 lines', function(done) {

            var mockCopy = Lib.extendDeep({}, mock1);
            var newDimension, i, j;

            mockCopy.layout.width = 1680;
            for(i = 0; i < 60; i++) {
                newDimension = Lib.extendDeep({}, mock1.data[0].dimensions[0]);
                newDimension.id = 'S' + i;
                newDimension.label = 'S' + i;
                delete newDimension.constraintrange;
                newDimension.range = [0, 999];
                newDimension.values = [];
                for(j = 0; j < 65 - i; j++) {
                    newDimension.values[j] = Math.floor(1000 * Math.random());
                }
                mockCopy.data[0].dimensions[i] = newDimension;
            }

            var gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].dimensions.length).toEqual(60);
                expect(document.querySelectorAll('.axis').length).toEqual(60);
                done();
            });
        });

        it('Skip dimensions which are not plain objects or whose `values` is not an array', function(done) {

            var mockCopy = Lib.extendDeep({}, mock1);
            var newDimension, i, j;

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
                    newDimension.values[j] = 1 + Math.random();
                }
                mockCopy.data[0].dimensions[i] = newDimension;
            }

            mockCopy.data[0].dimensions[0] = 'This is not a plain object';
            mockCopy.data[0].dimensions[1].values = 'This is not an array';

            var gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].dimensions.length).toEqual(5); // it's still five, but ...
                expect(document.querySelectorAll('.axis').length).toEqual(3); // only 3 axes shown
                done();
            });
        });


    });

    describe('basic use', function() {
        var mockCopy,
            gd;

        beforeEach(function(done) {
            mockCopy = Lib.extendDeep({}, mock);
            mockCopy.data[0].domain = {
                x: [0.1, 0.9],
                y: [0.05, 0.85]
            };
            gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        it('`Plotly.plot` should have proper fields on `gd.data` on initial rendering', function() {

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

        });

        it('Calling `Plotly.plot` again should add the new parcoords', function(done) {

            var reversedMockCopy = Lib.extendDeep({}, mockCopy);
            reversedMockCopy.data[0].dimensions = reversedMockCopy.data[0].dimensions.slice().reverse();
            reversedMockCopy.data[0].dimensions.forEach(function(d) {d.id = 'R_' + d.id;});
            reversedMockCopy.data[0].dimensions.forEach(function(d) {d.label = 'R_' + d.label;});

            Plotly.plot(gd, reversedMockCopy.data, reversedMockCopy.layout).then(function() {

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

                expect(document.querySelectorAll('.axis').length).toEqual(20);  // one dimension is `visible: false`

                done();
            });

        });

        it('Calling `Plotly.restyle` with a string path should amend the preexisting parcoords', function(done) {

            expect(gd.data.length).toEqual(1);

            Plotly.restyle(gd, 'line.colorscale', 'Viridis').then(function() {

                expect(gd.data.length).toEqual(1);

                expect(gd.data[0].line.colorscale).toEqual('Viridis');
                expect(gd.data[0].dimensions.length).toEqual(11);
                expect(gd.data[0].line.cmin).toEqual(-4000);
                expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
                expect(gd.data[0].dimensions[0].constraintrange).toEqual([100000, 150000]);
                expect(gd.data[0].dimensions[1].constraintrange).not.toBeDefined();

                done();
            });

        });

        it('Calling `Plotly.restyle` for a dimension should amend the preexisting dimension', function(done) {

            function restyleDimension(key, setterValue) {

                // array values need to be wrapped in an array; unwrapping here for value comparison
                var value = Lib.isArray(setterValue) ? setterValue[0] : setterValue;

                return function() {
                    return Plotly.restyle(gd, 'dimensions[2].' + key, setterValue).then(function() {
                        expect(gd.data[0].dimensions[2][key]).toEqual(value, 'for dimension attribute \'' + key + '\'');
                    });
                };
            }

            restyleDimension('label', 'new label')()
                .then(restyleDimension('tickvals', [[0, 0.1, 0.4, 1, 2]]))
                .then(restyleDimension('ticktext', [['alpha', 'gamma', 'beta', 'omega', 'epsilon']]))
                .then(restyleDimension('tickformat', '4s'))
                .then(restyleDimension('range', [[0, 2]]))
                .then(restyleDimension('constraintrange', [[0, 1]]))
                .then(restyleDimension('values', [[0, 0.1, 0.4, 1, 2, 0, 0.1, 0.4, 1, 2]]))
                .then(restyleDimension('visible', false))
                .then(done);
        });

        it('Calling `Plotly.restyle` with an object should amend the preexisting parcoords', function(done) {

            var newStyle = Lib.extendDeep({}, mockCopy.data[0].line);
            newStyle.colorscale = 'Viridis';
            newStyle.reversescale = false;

            Plotly.restyle(gd, {line: newStyle}).then(function() {

                expect(gd.data.length).toEqual(1);

                expect(gd.data[0].line.colorscale).toEqual('Viridis');
                expect(gd.data[0].line.reversescale).toEqual(false);
                expect(gd.data[0].dimensions.length).toEqual(11);
                expect(gd.data[0].line.cmin).toEqual(-4000);
                expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
                expect(gd.data[0].dimensions[0].constraintrange).toEqual([100000, 150000]);
                expect(gd.data[0].dimensions[1].constraintrange).not.toBeDefined();

                done();
            });


        });

        it('Should emit a \'plotly_restyle\' event', function(done) {

            var tester = (function() {

                var eventCalled = false;

                return {
                    set: function(d) {eventCalled = d;},
                    get: function() {return eventCalled;}
                };
            })();

            gd.on('plotly_restyle', function() {
                tester.set(true);
            });

            expect(tester.get()).toBe(false);
            Plotly.restyle(gd, 'line.colorscale', 'Viridis')
                .then(window.setTimeout(function() {
                    expect(tester.get()).toBe(true);
                    done();
                }, 0));

        });

        it('Should emit a \'plotly_hover\' event', function(done) {

            function testMaker() {

                var eventCalled = false;

                return {
                    set: function() {eventCalled = eventCalled || true;},
                    get: function() {return eventCalled;}
                };
            }

            var hoverTester = testMaker();
            var unhoverTester = testMaker();

            gd.on('plotly_hover', function(d) {
                hoverTester.set({hover: d});
            });

            gd.on('plotly_unhover', function(d) {
                unhoverTester.set({unhover: d});
            });

            expect(hoverTester.get()).toBe(false);
            expect(unhoverTester.get()).toBe(false);

            mouseEvent('mousemove', 324, 216);
            mouseEvent('mouseover', 324, 216);
            mouseEvent('mousemove', 315, 218);
            mouseEvent('mouseover', 315, 218);

            window.setTimeout(function() {

                expect(hoverTester.get()).toBe(true);

                mouseEvent('mousemove', 329, 153);
                mouseEvent('mouseover', 329, 153);

                window.setTimeout(function() {

                    expect(unhoverTester.get()).toBe(true);
                    done();
                }, 20);

            }, 20);

        });

        it('Calling `Plotly.relayout` with string should amend the preexisting parcoords', function(done) {

            expect(gd.layout.width).toEqual(1184);

            Plotly.relayout(gd, 'width', 500).then(function() {

                expect(gd.data.length).toEqual(1);

                expect(gd.layout.width).toEqual(500);
                expect(gd.data[0].line.colorscale).toEqual('Jet');
                expect(gd.data[0].dimensions.length).toEqual(11);
                expect(gd.data[0].line.cmin).toEqual(-4000);
                expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
                expect(gd.data[0].dimensions[0].constraintrange).toEqual([100000, 150000]);
                expect(gd.data[0].dimensions[1].constraintrange).not.toBeDefined();

                done();
            });

        });

        it('Calling `Plotly.relayout`with object should amend the preexisting parcoords', function(done) {

            expect(gd.layout.width).toEqual(1184);

            Plotly.relayout(gd, {width: 500}).then(function() {

                expect(gd.data.length).toEqual(1);

                expect(gd.layout.width).toEqual(500);
                expect(gd.data[0].line.colorscale).toEqual('Jet');
                expect(gd.data[0].dimensions.length).toEqual(11);
                expect(gd.data[0].line.cmin).toEqual(-4000);
                expect(gd.data[0].dimensions[0].constraintrange).toBeDefined();
                expect(gd.data[0].dimensions[0].constraintrange).toEqual([100000, 150000]);
                expect(gd.data[0].dimensions[1].constraintrange).not.toBeDefined();

                done();
            });

        });

    });

    describe('Lifecycle methods', function() {

        it('Plotly.deleteTraces with one trace removes the plot', function(done) {

            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);

            mockCopy.data[0].line.showscale = false;

            Plotly.plot(gd, mockCopy).then(function() {

                expect(gd.data.length).toEqual(1);

                Plotly.deleteTraces(gd, 0).then(function() {
                    expect(d3.selectAll('.parcoords-line-layers').node()).toEqual(null);
                    expect(gd.data.length).toEqual(0);
                    done();
                });
            });
        });

        it('Plotly.deleteTraces with two traces removes the deleted plot', function(done) {

            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);
            var mockCopy2 = Lib.extendDeep({}, mock);
            mockCopy2.data[0].dimensions.splice(3, 4);
            mockCopy.data[0].line.showscale = false;

            Plotly.plot(gd, mockCopy)
                .then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(document.querySelectorAll('.yAxis').length).toEqual(10);
                    return Plotly.plot(gd, mockCopy2);
                })
                .then(function() {
                    expect(gd.data.length).toEqual(2);
                    expect(document.querySelectorAll('.yAxis').length).toEqual(10 + 7);
                    return Plotly.deleteTraces(gd, [0]);
                })
                .then(function() {
                    expect(document.querySelectorAll('.parcoords-line-layers').length).toEqual(1);
                    expect(document.querySelectorAll('.yAxis').length).toEqual(7);
                    expect(gd.data.length).toEqual(1);
                    return Plotly.deleteTraces(gd, 0);
                })
                .then(function() {
                    expect(document.querySelectorAll('.parcoords-line-layers').length).toEqual(0);
                    expect(document.querySelectorAll('.yAxis').length).toEqual(0);
                    expect(gd.data.length).toEqual(0);
                    done();
                });
        });

        it('Calling `Plotly.restyle` with zero panels left should erase lines', function(done) {

            var mockCopy = Lib.extendDeep({}, mock2);
            var gd = createGraphDiv();
            Plotly.plot(gd, mockCopy.data, mockCopy.layout);

            function restyleDimension(key, dimIndex, setterValue) {
                var value = Lib.isArray(setterValue) ? setterValue[0] : setterValue;
                return function() {
                    return Plotly.restyle(gd, 'dimensions[' + dimIndex + '].' + key, setterValue).then(function() {
                        expect(gd.data[0].dimensions[dimIndex][key]).toEqual(value, 'for dimension attribute \'' + key + '\'');
                    });
                };
            }

            restyleDimension('values', 1, [[]])()
                .then(function() {
                    d3.selectAll('.parcoords-lines').each(function(d) {
                        var imageArray = d.lineLayer.readPixels(0, 0, d.model.canvasWidth, d.model.canvasHeight);
                        var foundPixel = false;
                        var i = 0;
                        do {
                            foundPixel = foundPixel || imageArray[i++] !== 0;
                        } while(!foundPixel && i < imageArray.length);
                        expect(foundPixel).toEqual(false);
                    });
                    done();
                });
        });

        describe('Having two datasets', function() {

            it('Two subsequent calls to Plotly.plot should create two parcoords rows', function(done) {

                var gd = createGraphDiv();
                var mockCopy = Lib.extendDeep({}, mock);
                var mockCopy2 = Lib.extendDeep({}, mock);
                mockCopy.data[0].domain = {x: [0, 0.45]};
                mockCopy2.data[0].domain = {x: [0.55, 1]};
                mockCopy2.data[0].dimensions.splice(3, 4);

                expect(document.querySelectorAll('.parcoords-line-layers').length).toEqual(0);

                Plotly.plot(gd, mockCopy)
                    .then(function() {

                        expect(1).toEqual(1);
                        expect(document.querySelectorAll('.parcoords-line-layers').length).toEqual(1);
                        expect(gd.data.length).toEqual(1);

                        return Plotly.plot(gd, mockCopy2);
                    })
                    .then(function() {

                        expect(1).toEqual(1);
                        expect(document.querySelectorAll('.parcoords-line-layers').length).toEqual(2);
                        expect(gd.data.length).toEqual(2);

                        done();
                    });
            });

            it('Plotly.addTraces should add a new parcoords row', function(done) {

                var gd = createGraphDiv();
                var mockCopy = Lib.extendDeep({}, mock);
                var mockCopy2 = Lib.extendDeep({}, mock);
                mockCopy.data[0].domain = {y: [0, 0.35]};
                mockCopy2.data[0].domain = {y: [0.65, 1]};
                mockCopy2.data[0].dimensions.splice(3, 4);

                expect(document.querySelectorAll('.parcoords-line-layers').length).toEqual(0);

                Plotly.plot(gd, mockCopy)
                    .then(function() {

                        expect(document.querySelectorAll('.parcoords-line-layers').length).toEqual(1);
                        expect(gd.data.length).toEqual(1);

                        return Plotly.addTraces(gd, [mockCopy2.data[0]]);
                    })
                    .then(function() {

                        expect(document.querySelectorAll('.parcoords-line-layers').length).toEqual(2);
                        expect(gd.data.length).toEqual(2);

                        done();
                    });

            });

            it('Plotly.restyle should update the existing parcoords row', function(done) {

                var gd = createGraphDiv();
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

                expect(document.querySelectorAll('.parcoords-line-layers').length).toEqual(0);

                Plotly.plot(gd, mockCopy)
                    .then(function() {

                        expect(document.querySelectorAll('.parcoords-line-layers').length).toEqual(1);
                        expect(gd.data.length).toEqual(1);

                        return Plotly.restyle(gd, {
                            // wrap the `dimensions` array
                            dimensions: [mockCopy2.data[0].dimensions]
                        });
                    })
                    .then(function() {

                        expect(document.querySelectorAll('.parcoords-line-layers').length).toEqual(1);
                        expect(gd.data.length).toEqual(1);

                        done();
                    });

            });
        });
    });
});
