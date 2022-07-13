var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var delay = require('../assets/delay');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

function createIsosurfaceFig() {
    return {
        data: [{
            type: 'isosurface',
            x: [
                0.1, 0.1, 0.1, 0.1,
                0.1, 0.1, 0.1, 0.1,
                0.1, 0.1, 0.1, 0.1,
                0.1, 0.1, 0.1, 0.1,
                0.2, 0.2, 0.2, 0.2,
                0.2, 0.2, 0.2, 0.2,
                0.2, 0.2, 0.2, 0.2,
                0.2, 0.2, 0.2, 0.2,
                0.3, 0.3, 0.3, 0.3,
                0.3, 0.3, 0.3, 0.3,
                0.3, 0.3, 0.3, 0.3,
                0.3, 0.3, 0.3, 0.3,
                0.4, 0.4, 0.4, 0.4,
                0.4, 0.4, 0.4, 0.4,
                0.4, 0.4, 0.4, 0.4,
                0.4, 0.4, 0.4, 0.4
            ],
            y: [
                1e-1, 1e-1, 1e-1, 1e-1,
                1e-2, 1e-2, 1e-2, 1e-2,
                1e-3, 1e-3, 1e-3, 1e-3,
                1e-4, 1e-4, 1e-4, 1e-4,
                1e-1, 1e-1, 1e-1, 1e-1,
                1e-2, 1e-2, 1e-2, 1e-2,
                1e-3, 1e-3, 1e-3, 1e-3,
                1e-4, 1e-4, 1e-4, 1e-4,
                1e-1, 1e-1, 1e-1, 1e-1,
                1e-2, 1e-2, 1e-2, 1e-2,
                1e-3, 1e-3, 1e-3, 1e-3,
                1e-4, 1e-4, 1e-4, 1e-4,
                1e-1, 1e-1, 1e-1, 1e-1,
                1e-2, 1e-2, 1e-2, 1e-2,
                1e-3, 1e-3, 1e-3, 1e-3,
                1e-4, 1e-4, 1e-4, 1e-4
            ],
            z: [
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16,
                -2, -4, -8, -16
            ],
            value: [
                -0.01, -0.02, -0.03, -0.04,
                -0.05, -0.06, -0.07, -1.01,
                -0.08, -0.09, -1.02, -0.10,
                -0.11, -0.12, -1.03, -1.04,
                -0.13, -1.05, -0.14, -0.15,
                -0.16, -1.06, -0.17, -1.07,
                -0.18, -1.08, -1.09, -0.19,
                -0.21, -1.10, -1.11, -1.12,
                -1.13, -0.21, -0.22, -0.23,
                -1.14, -0.24, -0.25, -1.15,
                -1.16, -0.26, -1.17, -0.27,
                -1.18, -0.28, -1.19, -1.20,
                -1.21, -1.22, -0.29, -0.30,
                -1.23, -1.24, -0.31, -1.25,
                -1.26, -1.27, -1.28, -0.32,
                -1.29, -1.30, -1.31, -1.32
            ],
            isomin: -0.75,
            isomax: -0.5,
            showscale: false
        }],
        layout: {
            width: 400,
            height: 400,
            margin: {
                l: 0,
                t: 0,
                r: 0,
                b: 0
            }
        }
    };
}

describe('Test isosurface', function() {
    var gd;

    describe('defaults', function() {
        function assertVisibility(exp, msg) {
            expect(gd._fullData[0]).not.toBe(undefined, 'no visibility!');
            expect(gd._fullData[0].visible).toBe(exp, msg);
        }

        it('isosurface should not set `visible: false` for traces with x,y,z,value arrays', function() {
            gd = createIsosurfaceFig();

            supplyAllDefaults(gd);
            assertVisibility(true, 'to be visible');
        });

        it('isosurface should set `visible: false` for traces missing x,y,z,value arrays', function() {
            var keysToChange = ['x', 'y', 'z', 'value'];

            keysToChange.forEach(function(k) {
                gd = createIsosurfaceFig();
                delete gd.data[0][k];

                supplyAllDefaults(gd);
                assertVisibility(false, 'to be invisible after changing key: ' + keysToChange[k]);
            });
        });

        it('isosurface should set `visible: false` for traces with empty x,y,z,value arrays', function() {
            var keysToChange = ['x', 'y', 'z', 'value'];

            keysToChange.forEach(function(k) {
                gd = createIsosurfaceFig();
                gd.data[0][k] = [];

                supplyAllDefaults(gd);
                assertVisibility(false, 'to be invisible after changing key: ' + keysToChange[k]);
            });
        });

        it('isosurface should be invisible when the vertex arrays are not arrays', function() {
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

        it('isosurface should not set `visible: false` when isomin > isomax', function() {
            gd = createIsosurfaceFig();
            gd.data[0].isomin = 0.9;
            gd.data[0].isomax = 0.1;

            supplyAllDefaults(gd);
            assertVisibility(true, 'to be visible');
        });

        it('isosurface should set `isomin: null` and `isomax: null` when isomin > isomax', function() {
            gd = createIsosurfaceFig();
            gd.data[0].isomin = 0.9;
            gd.data[0].isomax = 0.1;

            supplyAllDefaults(gd);
            expect(gd._fullData[0].isomin).toBe(null, 'isomin not set to default');
            expect(gd._fullData[0].isomax).toBe(null, 'isomax not set to default');
        });

        it('isosurface should accept cases where isomin === isomax', function() {
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

            Plotly.newPlot(gd, fig)
            .then(function() {
                assertCells(0, 'to be OK cells');
            })
            .then(function() {
                assertPositions(0, 'to be OK positions');
            })
            .then(done, done.fail);
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

            Plotly.newPlot(gd, fig)
            .then(function() {
                assertCells(0, 'to be OK cells');
            })
            .then(function() {
                assertPositions(0, 'to be OK positions');
            })
            .then(done, done.fail);
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

        it('@gl should clear *cauto* when restyle *cmin* and/or *cmax*', function(done) {
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

            Plotly.newPlot(gd, fig)
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

    describe('hover', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(function() {
            Plotly.purge(gd);
            destroyGraphDiv();
        });

        it('@gl should display hover labels', function(done) {
            var fig = createIsosurfaceFig();

            function _hover1() {
                mouseEvent('mouseover', 200, 200);
                return delay(20)();
            }

            function _hover2() {
                mouseEvent('mouseover', 100, 100);
                return delay(20)();
            }

            function _hover3() {
                mouseEvent('mouseover', 300, 150);
                return delay(20)();
            }

            function _hover4() {
                mouseEvent('mouseover', 150, 300);
                return delay(20)();
            }

            Plotly.newPlot(gd, fig)
            .then(delay(20))
            .then(_hover1)
            .then(function() {
                assertHoverLabelContent({
                    nums: [
                        'x: 0.4',
                        'y: 100μ',
                        'z: −8',
                        'value: −1.31'
                    ].join('\n')
                });
            })
            .then(delay(20))
            .then(_hover2)
            .then(function() {
                assertHoverLabelContent({
                    nums: [
                        'x: 0.3',
                        'y: 0.001',
                        'z: −16',
                        'value: −0.27'
                    ].join('\n')
                });
            })
            .then(delay(20))
            .then(_hover3)
            .then(function() {
                assertHoverLabelContent({
                    nums: [
                        'x: 0.2',
                        'y: 100μ',
                        'z: −16',
                        'value: −1.12'
                    ].join('\n')
                });
            })
            .then(delay(20))
            .then(_hover4)
            .then(function() {
                assertHoverLabelContent({
                    nums: [
                        'x: 0.4',
                        'y: 100μ',
                        'z: −4',
                        'value: −1.3'
                    ].join('\n')
                });
            })
            .then(function() {
                return Plotly.restyle(gd, 'hovertext', [
                    fig.data[0].value.map(function(v) { return '!! ' + v + ' !!'; })
                ]);
            })
            .then(delay(20))
            .then(_hover4)
            .then(function() {
                assertHoverLabelContent({
                    nums: [
                        'x: 0.4',
                        'y: 100μ',
                        'z: −4',
                        'value: −1.3',
                        '!! -1.3 !!'
                    ].join('\n')
                });
            })
            .then(function() {
                return Plotly.restyle(gd, 'hovertemplate', '%{value}<br>(%{x},%{y},%{z})<extra>!!</extra>');
            })
            .then(done, done.fail);
        });
    });
});

describe('Test isosurface grid', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    [ // list of directions
        'number',
        'string',
        'typedArray'
    ].forEach(function(format) {
        [ // list of directions
            [-1, -1, -1],
            [-1, -1, 1],
            [-1, 1, -1],
            [1, -1, -1],
            [1, 1, -1],
            [1, -1, 1],
            [-1, 1, 1],
            [1, 1, 1]
        ].forEach(function(dir) {
            it('@gl should work with grid steps: ' + dir + ' and values in ' + format + ' format.', function(done) {
                var x = [];
                var y = [];
                var z = [];
                var v = [];

                for(var i = 0; i < 3; i++) {
                    for(var j = 0; j < 4; j++) {
                        for(var k = 0; k < 5; k++) {
                            var newX = i * dir[0];
                            var newY = j * dir[1];
                            var newZ = k * dir[2];
                            var newV = (
                                newX * newX +
                                newY * newY +
                                newZ * newZ
                            );

                            if(format === 'string') {
                                newV = String(newV);
                                newX = String(newX);
                                newY = String(newY);
                                newZ = String(newZ);
                            }

                            v.push(newV);
                            x.push(newX);
                            y.push(newY);
                            z.push(newZ);
                        }
                    }
                }

                if(format === 'typedArray') {
                    v = new Int32Array(v);
                    x = new Float32Array(x);
                    y = new Float32Array(y);
                    z = new Float64Array(z);
                }

                var fig = {
                    data: [{
                        type: 'isosurface',
                        x: x,
                        y: y,
                        z: z,
                        value: v
                    }]
                };

                function _assert(msg, exp) {
                    var scene = gd._fullLayout.scene._scene;
                    var objs = scene.glplot.objects;
                    expect(objs.length).toBe(1, 'one gl-vis object - ' + msg);
                    expect(exp.positionsLength).toBe(objs[0].positions.length, 'positions length - ' + msg);
                    expect(exp.cellsLength).toBe(objs[0].cells.length, 'cells length - ' + msg);
                }

                Plotly.newPlot(gd, fig).then(function() {
                    _assert('lengths', {
                        positionsLength: 372,
                        cellsLength: 104
                    });
                })
                .then(done, done.fail);
            });
        });
    });

    it('@gl should return blank mesh grid if encountered arbitrary coordinates', function(done) {
        var x = [];
        var y = [];
        var z = [];
        var v = [];

        Lib.seedPseudoRandom();

        for(var n = 0; n < 1000; n++) {
            x.push((10 * Lib.pseudoRandom()) | 0);
            y.push((10 * Lib.pseudoRandom()) | 0);
            z.push((10 * Lib.pseudoRandom()) | 0);
            v.push((10 * Lib.pseudoRandom()) | 0);
        }

        var fig = {
            data: [{
                type: 'isosurface',
                x: x,
                y: y,
                z: z,
                value: v
            }]
        };

        function _assert(msg, exp) {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;
            expect(objs.length).toBe(1, 'one gl-vis object - ' + msg);
            expect(exp.positionsLength).toBe(objs[0].positions.length, 'positions length - ' + msg);
            expect(exp.cellsLength).toBe(objs[0].cells.length, 'cells length - ' + msg);
        }

        spyOn(Lib, 'warn');

        Plotly.newPlot(gd, fig).then(function() {
            _assert('arbitrary coordinates', {
                positionsLength: 0,
                cellsLength: 0
            });
        }).then(function() {
            expect(Lib.warn).toHaveBeenCalledWith('Encountered arbitrary coordinates! Unable to input data grid.');
        })
        .then(done, done.fail);
    });
});
