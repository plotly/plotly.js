var Surface = require('@src/traces/surface');
var Plotly = require('@lib/index');
var failTest = require('../assets/fail_test');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var Lib = require('@src/lib');


describe('Test surface', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var supplyDefaults = Surface.supplyDefaults;

        var defaultColor = '#444';
        var layout = {_dfltTitle: {colorbar: 'cb'}};

        var traceIn, traceOut;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set \'visible\' to false if \'z\' isn\'t provided', function() {
            traceIn = {};

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should NOT fill \'x\' and \'y\' if not provided', function() {
            // this happens later on now
            traceIn = {
                z: [[1, 2, 3], [2, 1, 2]]
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.x).toBeUndefined();
            expect(traceOut.y).toBeUndefined();
        });

        it('should coerce \'project\' if contours or highlight lines are enabled', function() {
            traceIn = {
                z: [[1, 2, 3], [2, 1, 2]],
                contours: {
                    x: {},
                    y: { show: true },
                    z: { show: false, highlight: false }
                }
            };

            var fullOpts = {
                show: false,
                highlight: true,
                project: { x: false, y: false, z: false },
                highlightcolor: '#444',
                highlightwidth: 2
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.contours.x).toEqual(fullOpts);
            expect(traceOut.contours.y).toEqual(Lib.extendDeep({}, fullOpts, {
                show: true,
                onpoints: 0,
                locations: [],
                color: '#444',
                width: 2,
                usecolormap: false
            }));
            expect(traceOut.contours.z).toEqual({ show: false, highlight: false });
        });

        it('should coerce contour style attributes if contours lines are enabled', function() {
            traceIn = {
                z: [[1, 2, 3], [2, 1, 2]],
                contours: {
                    x: { show: true }
                }
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.contours.x.color).toEqual('#444');
            expect(traceOut.contours.x.width).toEqual(2);
            expect(traceOut.contours.x.usecolormap).toEqual(false);

            ['y', 'z'].forEach(function(ax) {
                expect(traceOut.contours[ax].color).toBeUndefined();
                expect(traceOut.contours[ax].width).toBeUndefined();
                expect(traceOut.contours[ax].usecolormap).toBeUndefined();
            });
        });

        it('should coerce colorscale and colorbar attributes', function() {
            traceIn = {
                z: [[1, 2, 3], [2, 1, 2]]
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.cauto).toBe(true);
            expect(traceOut.cmin).toBeUndefined();
            expect(traceOut.cmax).toBeUndefined();
            expect(traceOut.colorscale).toEqual([
                [0, 'rgb(5,10,172)'],
                [0.35, 'rgb(106,137,247)'],
                [0.5, 'rgb(190,190,190)'],
                [0.6, 'rgb(220,170,132)'],
                [0.7, 'rgb(230,145,90)'],
                [1, 'rgb(178,10,28)']
            ]);
            expect(traceOut.showscale).toBe(true);
            expect(traceOut.colorbar).toBeDefined();
        });

        it('should coerce \'c\' attributes with \'z\' if \'c\' isn\'t present', function() {
            traceIn = {
                z: [[1, 2, 3], [2, 1, 2]],
                zauto: false,
                zmin: 0,
                zmax: 10
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.cauto).toEqual(false);
            expect(traceOut.cmin).toEqual(0);
            expect(traceOut.cmax).toEqual(10);
        });

        it('should coerce \'c\' attributes with \'c\' values regardless of `\'z\' if \'c\' is present', function() {
            traceIn = {
                z: [[1, 2, 3], [2, 1, 2]],
                zauto: false,
                zmin: 0,
                zmax: 10,
                cauto: true,
                cmin: -10,
                cmax: 20
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.cauto).toEqual(true);
            expect(traceOut.cmin).toEqual(-10);
            expect(traceOut.cmax).toEqual(20);
        });

        it('should default \'c\' attributes with if \'surfacecolor\' is present', function() {
            traceIn = {
                z: [[1, 2, 3], [2, 1, 2]],
                surfacecolor: [[2, 1, 2], [1, 2, 3]],
                zauto: false,
                zmin: 0,
                zmax: 10
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.cauto).toEqual(true);
            expect(traceOut.cmin).toBeUndefined();
            expect(traceOut.cmax).toBeUndefined();
        });

        it('should inherit layout.calendar', function() {
            traceIn = {
                z: [[1, 2, 3], [2, 1, 2]]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, Lib.extendFlat({calendar: 'islamic'}, layout));

            // we always fill calendar attributes, because it's hard to tell if
            // we're on a date axis at this point.
            expect(traceOut.xcalendar).toBe('islamic');
            expect(traceOut.ycalendar).toBe('islamic');
            expect(traceOut.zcalendar).toBe('islamic');
        });

        it('should take its own calendars', function() {
            var traceIn = {
                z: [[1, 2, 3], [2, 1, 2]],
                xcalendar: 'coptic',
                ycalendar: 'ethiopian',
                zcalendar: 'mayan'
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.xcalendar).toBe('coptic');
            expect(traceOut.ycalendar).toBe('ethiopian');
            expect(traceOut.zcalendar).toBe('mayan');
        });

    });

    describe('Test dimension and expected visibility tests', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(function() {
            Plotly.purge(gd);
            destroyGraphDiv();
        });

        function assertVisibility(exp, msg) {
            expect(gd._fullData[0]).not.toBe(undefined, 'no visibility!');
            expect(gd._fullData[0].visible).toBe(exp, msg);
        }

        it('@gl surface should be invisible when the z array is empty', function(done) {
            Plotly.plot(gd, [{
                'type': 'surface',
                'z': []
            }])
            .then(function() {
                assertVisibility(false, 'not to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl surface should be invisible when the x array is defined but is empty', function(done) {
            Plotly.plot(gd, [{
                'type': 'surface',
                'x': [],
                'y': [0, 1],
                'z': []
            }])
            .then(function() {
                assertVisibility(false, 'not to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl surface should be invisible when the y array is defined but is empty', function(done) {
            Plotly.plot(gd, [{
                'type': 'surface',
                'x': [0, 1],
                'y': [],
                'z': []
            }])
            .then(function() {
                assertVisibility(false, 'not to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl surface should be invisible when the x array is defined and has at least one item', function(done) {
            Plotly.plot(gd, [{
                'type': 'surface',
                'x': [0],
                'y': [0, 1],
                'z': [[1], [2]]
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl surface should be invisible when the y array is defined and has at least one item', function(done) {
            Plotly.plot(gd, [{
                'type': 'surface',
                'x': [0, 1],
                'y': [0],
                'z': [[1, 2]]
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl surface should be visible when the x and y are not provided; but z array is provided', function(done) {
            Plotly.plot(gd, [{
                'type': 'surface',
                'z': [[1, 2], [3, 4]]
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl surface should be invisible when the x and y are provided; but z array is not provided', function(done) {
            Plotly.plot(gd, [{
                'type': 'surface',
                'x': [0, 1],
                'y': [0, 1]
            }])
            .then(function() {
                assertVisibility(false, 'to be invisible');
            })
            .catch(failTest)
            .then(done);
        });

    });
});
