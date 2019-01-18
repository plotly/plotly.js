var Plotly = require('@lib');
// var Lib = require('@src/lib');

var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
// var delay = require('../assets/delay');
// var mouseEvent = require('../assets/mouse_event');

// var customAssertions = require('../assets/custom_assertions');
// var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

function createIsosurfaceFig() {
    return {
        data: [{
            type: 'isosurface',
            x: [1, 2, 3, 4],
            y: [1, 2, 3, 4],
            z: [1, 2, 3, 4],
            value: [
                0, 0, 0, 0,
                0, 0, 0, 1,
                0, 0, 1, 0,
                0, 0, 1, 1,

                0, 1, 0, 0,
                0, 1, 0, 1,
                0, 1, 1, 0,
                0, 1, 1, 1,

                1, 0, 0, 0,
                1, 0, 0, 1,
                1, 0, 1, 0,
                1, 0, 1, 1,

                1, 1, 0, 0,
                1, 1, 0, 1,
                1, 1, 1, 0,
                1, 1, 1, 1
            ],
            isomin: 0.25,
            isomax: 0.5
        }],
        layout: {}
    };
}

describe('Test isosurface', function() {

    var gd;

    describe('defaults', function() {

        function assertVisibility(exp, msg) {
            expect(gd._fullData[0]).not.toBe(undefined, 'no visibility!');
            expect(gd._fullData[0].visible).toBe(exp, msg);
        }

        it('@gl isosurface should not set `visible: false` for traces with x,y,z,value arrays', function() {
            gd = createIsosurfaceFig();

            supplyAllDefaults(gd);
            assertVisibility(true, 'to be visible');
        });

        it('@gl isosurface should set `visible: false` for traces missing x,y,z,value arrays', function() {
            var keysToChange = ['x', 'y', 'z', 'value'];

            keysToChange.forEach(function(k) {
                gd = createIsosurfaceFig();
                delete gd.data[0][k];

                supplyAllDefaults(gd);
                assertVisibility(false, 'to be invisible after changing key: ' + keysToChange[k]);
            });
        });

        it('@gl isosurface should set `visible: false` for traces with empty x,y,z,value arrays', function() {
            var keysToChange = ['x', 'y', 'z', 'value'];

            keysToChange.forEach(function(k) {
                gd = createIsosurfaceFig();
                gd.data[0][k] = [];

                supplyAllDefaults(gd);
                assertVisibility(false, 'to be invisible after changing key: ' + keysToChange[k]);
            });
        });

        it('@gl isosurface should be invisible when the vertex arrays are not arrays', function() {
            var keysToChange = ['x', 'y', 'z', 'value'];
            var casesToCheck = [0, 1, true, false, NaN, Infinity, -Infinity, null, undefined, [], {}, '', 'text'];

            keysToChange.forEach(function(k) {
                for(var q = 0; q < casesToCheck.length; q++) {
                    gd = createIsosurfaceFig();
                    gd.data[0][k] = casesToCheck[q];

                    supplyAllDefaults(gd);
                    assertVisibility(false, 'to be invisible after changing key: ' + keysToChange[k]) + ' to: ' + casesToCheck[q];
                }
            });
        });

        it('@gl isosurface should not set `visible: false` when isomin > isomax', function() {
            gd = createIsosurfaceFig();
            gd.data[0].isomin = 0.9;
            gd.data[0].isomax = 0.1;

            supplyAllDefaults(gd);
            assertVisibility(true, 'to be visible');
        });

        it('@gl isosurface should set `isomin: null` and `isomax: null` when isomin > isomax', function() {
            gd = createIsosurfaceFig();
            gd.data[0].isomin = 0.9;
            gd.data[0].isomax = 0.1;

            supplyAllDefaults(gd);
            expect(gd._fullData[0].isomin).toBe(null, 'isomin not set to default');
            expect(gd._fullData[0].isomax).toBe(null, 'isomax not set to default');
        });

        it('@gl isosurface should accept cases where isomin === isomax', function() {
            gd = createIsosurfaceFig();
            gd.data[0].isomin = 1e-2;
            gd.data[0].isomax = 0.01;

            supplyAllDefaults(gd);
            expect(gd._fullData[0].isomin).not.toBe(null, 'isomin not set');
            expect(gd._fullData[0].isomax).not.toBe(null, 'isomax not set');
        });

    });

    describe('mesh_generation', function() {

        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(function() {
            Plotly.purge(gd);
            destroyGraphDiv();
        });

        function assertPositions(exp, msg) {
            expect(gd._fullLayout.scene._scene.glplot.objects[0].positions.length).toBe(exp, msg);
        }

        function assertCells(exp, msg) {
            expect(gd._fullLayout.scene._scene.glplot.objects[0].cells.length).toBe(exp, msg);
        }

        it('@gl isosurface should create no iso-surface and set `gl-positions: []` for traces when all the data is between isomin and isomax', function(done) {
            var fig = createIsosurfaceFig();
            var data = fig.data[0];
            data.surface = { show: true };
            data.spaceframe = { show: false };
            data.slices = { x: { show: false }, y: { show: false }, z: { show: false } };
            data.caps = { x: { show: false }, y: { show: false }, z: { show: false } };
            data.isomin = -Infinity;
            data.isomax = Infinity;

            Plotly.plot(gd, fig)
            .then(function() {
                assertCells(0, 'to be OK cells');
            })
            .then(function() {
                assertPositions(0, 'to be OK positions');
            })
            .catch(failTest)
            .then(done);
        });

        it('@gl isosurface should create no iso-surface and set `gl-positions: []` for traces when all the data is outside isomin and isomax', function(done) {
            var fig = createIsosurfaceFig();
            var data = fig.data[0];
            data.surface = { show: true };
            data.spaceframe = { show: false };
            data.slices = { x: { show: false }, y: { show: false }, z: { show: false } };
            data.caps = { x: { show: false }, y: { show: false }, z: { show: false } };
            data.isomin = Infinity;
            data.isomax = Infinity;

            Plotly.plot(gd, fig)
            .then(function() {
                assertCells(0, 'to be OK cells');
            })
            .then(function() {
                assertPositions(0, 'to be OK positions');
            })
            .catch(failTest)
            .then(done);
        });

    });

    describe('restyle', function() {

        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(function() {
            Plotly.purge(gd);
            destroyGraphDiv();
        });

        it('should clear *cauto* when restyle *cmin* and/or *cmax*', function(done) {

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

            var fig = createIsosurfaceFig();
            fig.data[0].isomin = 0;
            fig.data[0].isomax = 3;

            Plotly.plot(gd, fig)
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

});
