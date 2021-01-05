var Plotly = require('@lib');
var Lib = require('@src/lib');
var supplyDefaults = require('@src/traces/mesh3d').supplyDefaults;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test mesh3d', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var defaultColor = '#444';
        var layout = {_dfltTitle: {colorbar: 'cb'}};

        var traceIn, traceOut;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set \'visible\' to false if \'x\' isn\'t provided', function() {
            traceIn = {
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2]
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should set \'visible\' to false if \'y\' isn\'t provided', function() {
            traceIn = {
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2]
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should set \'visible\' to false if \'z\' isn\'t provided', function() {
            traceIn = {
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2]
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should set \'visible\' to false if \'i\' isn\'t provided', function() {
            traceIn = {
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2]
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should set \'visible\' to false if \'j\' isn\'t provided', function() {
            traceIn = {
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2]
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should set \'visible\' to false if \'k\' isn\'t provided', function() {
            traceIn = {
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3]
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should coerce contour style attributes if contour line is enabled', function() {
            traceIn = {
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2],
                contour: {
                    show: true
                }
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.contour.color).toEqual('#444');
            expect(traceOut.contour.width).toEqual(2);
        });

        it('should not coerce contour attributes when contour line is disabled', function() {
            traceIn = {
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2],
                contour: {
                    show: false
                }
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.contour.color).toBeUndefined();
            expect(traceOut.contour.width).toBeUndefined();
        });

        it('should coerce colorscale and colorbar attributes as well as intensitymode when intensity is present', function() {
            traceIn = {
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2],
                intensity: [1, 2, 3, 4, 5, 6, 7, 8]
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
            expect(traceOut.reversescale).toBe(false);
            expect(traceOut.showscale).toBe(true);
            expect(traceOut.colorbar).toBeDefined();
            expect(traceOut.intensitymode).toBe('vertex');
        });

        it('should not coerce colorscale and colorbar attributes as well as intensitymode when intensity is not present', function() {
            traceIn = {
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2]
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.cauto).toBeUndefined();
            expect(traceOut.cmin).toBeUndefined();
            expect(traceOut.cmax).toBeUndefined();
            expect(traceOut.colorscale).toBeUndefined();
            expect(traceOut.reversescale).toBeUndefined();
            expect(traceOut.showscale).toBe(false);
            expect(traceOut.colorbar).toBeUndefined();
            expect(traceOut.intensitymode).toBeUndefined();
        });

        it('should inherit layout.calendar', function() {
            traceIn = {
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2]
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
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2],
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

    describe('restyle', function() {
        afterEach(destroyGraphDiv);

        it('@gl should clear *cauto* when restyle *cmin* and/or *cmax*', function(done) {
            var gd = createGraphDiv();

            function _assert(user, full) {
                var trace = gd.data[0];
                var fullTrace = gd._fullData[0];

                expect(trace.cauto).toBe(user[0], 'user cauto');
                expect(trace.cmin).toBe(user[1], 'user cmin');
                expect(trace.cmax).toBe(user[2], 'user cmax');
                expect(fullTrace.cauto).toBe(full[0], 'full cauto');
                expect(fullTrace.cmin).toBe(full[1], 'full cmin');
                expect(fullTrace.cmax).toBe(full[2], 'full cmax');
            }

            Plotly.newPlot(gd, [{
                type: 'mesh3d',
                x: [0, 1, 2, 0],
                y: [0, 0, 1, 2],
                z: [0, 2, 0, 1],
                i: [0, 0, 0, 1],
                j: [1, 2, 3, 2],
                k: [2, 3, 1, 3],
                intensity: [0, 0.33, 0.66, 3]
            }])
            .then(function() {
                _assert([undefined, undefined, undefined], [true, 0, 3]);

                return Plotly.restyle(gd, 'cmin', 0);
            })
            .then(function() {
                _assert([false, 0, undefined], [false, 0, 3]);

                return Plotly.restyle(gd, 'cmax', 10);
            })
            .then(function() {
                _assert([false, 0, 10], [false, 0, 10]);

                return Plotly.restyle(gd, 'cauto', true);
            })
            .then(function() {
                _assert([true, 0, 10], [true, 0, 3]);

                return Plotly.purge(gd);
            })
            .then(done, done.fail);
        });
    });

    describe('dimension and expected visibility check and cell/position tests', function() {
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

        function assertPositions(exp, msg) {
            expect(gd._fullLayout.scene._scene.glplot.objects[0].positions.length).toBe(exp, msg);
        }

        function assertCells(exp, msg) {
            expect(gd._fullLayout.scene._scene.glplot.objects[0].cells.length).toBe(exp, msg);
        }

        it('@gl mesh3d should be visible when the indices are not integer', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1.00001],
                j: [1, 1, 2, 1.99999],
                k: [2, 3, 3, 3.00001],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .then(function() {
                assertPositions(4, 'to be OK positions');
            })
            .then(function() {
                assertCells(4, 'to be OK cells');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be visible when the indices could be rounded to be in vertex range', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [-0.49, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: [2, 3, 3, 3.49],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .then(function() {
                assertPositions(4, 'to be OK positions');
            })
            .then(function() {
                assertCells(4, 'to be OK cells');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be visible when the indices are equal or greater than the number of vertices', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: [2, 3, 3, 4],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .then(function() {
                assertPositions(0, 'to be OK positions');
            })
            .then(function() {
                assertCells(0, 'to be OK cells');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be visible when the indices are negative', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, -1],
                j: [1, 1, 2, 2],
                k: [2, 3, 3, 3],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .then(function() {
                assertPositions(0, 'to be OK positions');
            })
            .then(function() {
                assertCells(0, 'to be OK cells');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be visible when the indices have different sizes', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1],
                j: [1, 1, 2],
                k: [2, 3, 3, 3],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .then(function() {
                assertPositions(0, 'to be OK positions');
            })
            .then(function() {
                assertCells(0, 'to be OK cells');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be visible when the indices are provided and OK', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: [2, 3, 3, 3],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .then(function() {
                assertPositions(4, 'to be OK positions');
            })
            .then(function() {
                assertCells(4, 'to be OK cells');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be visible when values are passed in string format', function(done) {
            Plotly.newPlot(gd, [{
                x: ['0', '1', '0.5', '0.5'],
                y: ['0', '0.5', '1', '0.5'],
                z: ['0', '0.5', '0.5', '1'],
                i: ['0', '0', '0', '1'],
                j: ['1', '1', '2', '2'],
                k: ['2', '3', '3', '3'],
                type: 'mesh3d'
            }]).then(function() {
                assertVisibility(true, 'not to be visible');
            })
            .then(function() {
                assertPositions(4, 'to be OK positions');
            })
            .then(function() {
                assertCells(4, 'to be OK cells');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be visible when the index arrays are empty', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [],
                j: [],
                k: [],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .then(function() {
                assertPositions(4, 'to be OK positions');
            })
            .then(function() {
                assertCells(0, 'to be OK cells');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be visible when the index arrays are not provided', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .then(function() {
                assertPositions(4, 'to be OK positions');
            })
            .then(function() {
                assertCells(3, 'to be OK cells');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be visible when the vertex arrays are empty', function(done) {
            Plotly.newPlot(gd, [{
                x: [],
                y: [],
                z: [],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(true, 'not to be visible');
            })
            .then(function() {
                assertPositions(0, 'to be OK positions');
            })
            .then(function() {
                assertCells(0, 'to be OK cells');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be invisible when the vertex arrays missing', function(done) {
            Plotly.newPlot(gd, [{
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'to be visible');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be invisible when the vertex arrays are not arrays - number case', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: 1,
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: [2, 3, 3, 3],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'to be visible');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be invisible when the vertex arrays are not arrays - boolean case', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: true,
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: [2, 3, 3, 3],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'to be visible');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be invisible when the vertex arrays are not arrays - object case', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: {},
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: [2, 3, 3, 3],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'to be visible');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be invisible when the vertex arrays are not arrays - string case', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: '[0, 0.5, 0.5, 1]',
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: [2, 3, 3, 3],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'to be visible');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be invisible when the index arrays are not arrays - string case', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: '[2, 3, 3, 3]',
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'to be visible');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be invisible when the index arrays are not arrays - object case', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: {},
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'to be visible');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be invisible when the index arrays are not arrays - boolean case', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: true,
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'to be visible');
            })
            .then(done, done.fail);
        });

        it('@gl mesh3d should be invisible when the index arrays are not arrays - number case', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: 1,
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'to be visible');
            })
            .then(done, done.fail);
        });
    });
});
