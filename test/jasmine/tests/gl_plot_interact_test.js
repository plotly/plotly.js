var d3 = require('d3');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var selectButton = require('../assets/modebar_button');

/*
 * WebGL interaction test cases fail on the CircleCI
 * most likely due to a WebGL/driver issue
 *
 */


describe('Test plot structure', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    describe('gl3d plots', function() {
        var mock = require('@mocks/gl3d_marker-arrays.json');

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
        });

        it('has one *canvas* node', function() {
            var nodes = d3.selectAll('canvas');
            expect(nodes[0].length).toEqual(1);
        });
    });

    describe('gl2d plots', function() {
        var mock = require('@mocks/gl2d_10.json');

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
        });

        it('has one *canvas* node', function() {
            var nodes = d3.selectAll('canvas');
            expect(nodes[0].length).toEqual(1);
        });
    });

    describe('gl3d modebar click handlers', function() {
        var gd, modeBar;

        beforeEach(function(done) {
            var mockData = [{
                type: 'scatter3d'
            }, {
                type: 'surface', scene: 'scene2'
            }];

            var mockLayout = {
                scene: { camera: { eye: { x: 0.1, y: 0.1, z: 1 }}},
                scene2: { camera: { eye: { x: 2.5, y: 2.5, z: 2.5 }}}
            };

            gd = createGraphDiv();
            Plotly.plot(gd, mockData, mockLayout).then(function() {
                modeBar = gd._fullLayout._modeBar;
                done();
            });
        });

        function assertScenes(cont, attr, val) {
            var sceneIds = Plots.getSubplotIds(cont, 'gl3d');

            sceneIds.forEach(function(sceneId) {
                var thisVal = Lib.nestedProperty(cont[sceneId], attr).get();
                expect(thisVal).toEqual(val);
            });
        }

        describe('button zoom3d', function() {
            it('should updates the scene dragmode and dragmode button', function() {
                var buttonTurntable = selectButton(modeBar, 'tableRotation'),
                    buttonZoom3d = selectButton(modeBar, 'zoom3d');

                assertScenes(gd._fullLayout, 'dragmode', 'turntable');
                expect(buttonTurntable.isActive()).toBe(true);
                expect(buttonZoom3d.isActive()).toBe(false);

                buttonZoom3d.click();
                assertScenes(gd.layout, 'dragmode', 'zoom');
                expect(gd.layout.dragmode).toBe(undefined);
                expect(gd._fullLayout.dragmode).toBe('zoom');
                expect(buttonTurntable.isActive()).toBe(false);
                expect(buttonZoom3d.isActive()).toBe(true);

                buttonTurntable.click();
                assertScenes(gd._fullLayout, 'dragmode', 'turntable');
                expect(buttonTurntable.isActive()).toBe(true);
                expect(buttonZoom3d.isActive()).toBe(false);
            });
        });

        describe('button pan3d', function() {
            it('should updates the scene dragmode and dragmode button', function() {
                var buttonTurntable = selectButton(modeBar, 'tableRotation'),
                    buttonPan3d = selectButton(modeBar, 'pan3d');

                assertScenes(gd._fullLayout, 'dragmode', 'turntable');
                expect(buttonTurntable.isActive()).toBe(true);
                expect(buttonPan3d.isActive()).toBe(false);

                buttonPan3d.click();
                assertScenes(gd.layout, 'dragmode', 'pan');
                expect(gd.layout.dragmode).toBe(undefined);
                expect(gd._fullLayout.dragmode).toBe('zoom');
                expect(buttonTurntable.isActive()).toBe(false);
                expect(buttonPan3d.isActive()).toBe(true);

                buttonTurntable.click();
                assertScenes(gd._fullLayout, 'dragmode', 'turntable');
                expect(buttonTurntable.isActive()).toBe(true);
                expect(buttonPan3d.isActive()).toBe(false);
            });
        });

        describe('button orbitRotation', function() {
            it('should updates the scene dragmode and dragmode button', function() {
                var buttonTurntable = selectButton(modeBar, 'tableRotation'),
                    buttonOrbit = selectButton(modeBar, 'orbitRotation');

                assertScenes(gd._fullLayout, 'dragmode', 'turntable');
                expect(buttonTurntable.isActive()).toBe(true);
                expect(buttonOrbit.isActive()).toBe(false);

                buttonOrbit.click();
                assertScenes(gd.layout, 'dragmode', 'orbit');
                expect(gd.layout.dragmode).toBe(undefined);
                expect(gd._fullLayout.dragmode).toBe('zoom');
                expect(buttonTurntable.isActive()).toBe(false);
                expect(buttonOrbit.isActive()).toBe(true);

                buttonTurntable.click();
                assertScenes(gd._fullLayout, 'dragmode', 'turntable');
                expect(buttonTurntable.isActive()).toBe(true);
                expect(buttonOrbit.isActive()).toBe(false);
            });
        });

        describe('buttons resetCameraDefault3d and resetCameraLastSave3d', function() {
            // changes in scene objects are not instantaneous
            var DELAY = 1000;

            it('should update the scene camera', function(done) {
                var sceneLayout = gd._fullLayout.scene,
                    sceneLayout2 = gd._fullLayout.scene2,
                    scene = sceneLayout._scene,
                    scene2 = sceneLayout2._scene;

                expect(sceneLayout.camera.eye)
                    .toEqual({x: 0.1, y: 0.1, z: 1});
                expect(sceneLayout2.camera.eye)
                    .toEqual({x: 2.5, y: 2.5, z: 2.5});

                selectButton(modeBar, 'resetCameraDefault3d').click();
                setTimeout(function() {
                    expect(sceneLayout.camera.eye)
                        .toEqual({x: 0.1, y: 0.1, z: 1}, 'does not change the layout objects');
                    expect(scene.camera.eye)
                        .toEqual([1.2500000000000002, 1.25, 1.25]);
                    expect(sceneLayout2.camera.eye)
                        .toEqual({x: 2.5, y: 2.5, z: 2.5}, 'does not change the layout objects');
                    expect(scene2.camera.eye)
                        .toEqual([1.2500000000000002, 1.25, 1.25]);

                    selectButton(modeBar, 'resetCameraLastSave3d').click();
                    setTimeout(function() {
                        expect(sceneLayout.camera.eye)
                            .toEqual({x: 0.1, y: 0.1, z: 1}, 'does not change the layout objects');
                        expect(scene.camera.eye)
                            .toEqual([ 0.10000000000000016, 0.10000000000000016, 1]);
                        expect(sceneLayout2.camera.eye)
                            .toEqual({x: 2.5, y: 2.5, z: 2.5}, 'does not change the layout objects');
                        expect(scene2.camera.eye)
                            .toEqual([2.500000000000001, 2.5000000000000004, 2.5000000000000004]);

                        done();
                    }, DELAY);
                }, DELAY);
            });
        });

        describe('button hoverClosest3d', function() {
            it('should update the scene hovermode and spikes', function() {
                var buttonHover = selectButton(modeBar, 'hoverClosest3d');

                assertScenes(gd._fullLayout, 'hovermode', 'closest');
                expect(buttonHover.isActive()).toBe(true);

                buttonHover.click();
                assertScenes(gd._fullLayout, 'hovermode', false);
                assertScenes(gd._fullLayout, 'xaxis.showspikes', false);
                assertScenes(gd._fullLayout, 'yaxis.showspikes', false);
                assertScenes(gd._fullLayout, 'zaxis.showspikes', false);
                expect(buttonHover.isActive()).toBe(false);

                buttonHover.click();
                assertScenes(gd._fullLayout, 'hovermode', 'closest');
                assertScenes(gd._fullLayout, 'xaxis.showspikes', true);
                assertScenes(gd._fullLayout, 'yaxis.showspikes', true);
                assertScenes(gd._fullLayout, 'zaxis.showspikes', true);
                expect(buttonHover.isActive()).toBe(true);
            });
        });

    });
});
