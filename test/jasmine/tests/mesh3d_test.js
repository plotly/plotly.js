var Plotly = require('@lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

describe('Test mesh3d', function() {
    'use strict';

    describe('restyle', function() {
        afterEach(destroyGraphDiv);

        it('should clear *cauto* when restyle *cmin* and/or *cmax*', function(done) {
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

            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
        });
    });

    describe('dimension and expected visibility tests', function() {
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

        it('@gl mesh3d should be visible when the indices are not integer', function(done) {
            Plotly.plot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1.00001],
                j: [1, 1, 2, 2],
                k: [2, 3, 3, 2.99999],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'not to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl mesh3d should be invisible when the indices are equal or greater than the number of vertices', function(done) {
            Plotly.plot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 2],
                k: [2, 3, 3, 4],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'not to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl mesh3d should be invisible when the indices are negative', function(done) {
            Plotly.plot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, -1],
                j: [1, 1, 2, 2],
                k: [2, 3, 3, 3],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'not to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl mesh3d should be invisible when the indices have different sizes', function(done) {
            Plotly.plot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1],
                j: [1, 1, 2],
                k: [2, 3, 3, 3],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'not to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl mesh3d should be invisible when the indices of a triangle point to identical vertex twice', function(done) {
            Plotly.plot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                i: [0, 0, 0, 1],
                j: [1, 1, 2, 3],
                k: [2, 3, 3, 3],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(false, 'not to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl mesh3d should be visible when the indices are provided and OK', function(done) {
            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
        });

        it('@gl mesh3d should be visible when the index arrays are empty', function(done) {
            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
        });

        it('@gl mesh3d should be visible when the index arrays are not provided', function(done) {
            Plotly.plot(gd, [{
                x: [0, 1, 0.5, 0.5],
                y: [0, 0.5, 1, 0.5],
                z: [0, 0.5, 0.5, 1],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(true, 'to be visible');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl mesh3d should be visible when the vertex array are empty', function(done) {
            Plotly.plot(gd, [{
                x: [],
                y: [],
                z: [],
                type: 'mesh3d'
            }])
            .then(function() {
                assertVisibility(true, 'not to be visible');
            })
            .catch(failTest)
            .then(done);
        });
    });

});
