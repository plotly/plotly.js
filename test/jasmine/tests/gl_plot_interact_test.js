var d3 = require('d3');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var selectButton = require('../assets/modebar_button');
var customMatchers = require('../assets/custom_matchers');

/*
 * WebGL interaction test cases fail on the CircleCI
 * most likely due to a WebGL/driver issue
 *
 */

var PLOT_DELAY = 200;
var MOUSE_DELAY = 20;
var MODEBAR_DELAY = 500;


describe('Test gl plot interactions', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        jasmine.addMatchers(customMatchers);
    });

    afterEach(function() {
        var fullLayout = gd._fullLayout,
            sceneIds;

        sceneIds = Plots.getSubplotIds(fullLayout, 'gl3d');
        sceneIds.forEach(function(id) {
            var scene = fullLayout[id]._scene;

            if(scene.glplot) scene.destroy();
        });

        sceneIds = Plots.getSubplotIds(fullLayout, 'gl2d');
        sceneIds.forEach(function(id) {
            var scene2d = fullLayout._plots[id]._scene2d;

            if(scene2d.glplot) {
                scene2d.stopped = true;
                scene2d.destroy();
            }
        });

        destroyGraphDiv();
    });

    function delay(done) {
        setTimeout(function() {
            done();
        }, PLOT_DELAY);
    }

    describe('gl3d plots', function() {
        var mock = require('@mocks/gl3d_marker-arrays.json');

        function mouseEventScatter3d(type, opts) {
            mouseEvent(type, 605, 271, opts);
        }

        function countCanvases() {
            return d3.selectAll('canvas').size();
        }

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.plot(gd, mock.data, mock.layout).then(function() {
                delay(done);
            });
        });

        describe('scatter3d hover', function() {

            var node, ptData;

            beforeEach(function(done) {
                gd.on('plotly_hover', function(eventData) {
                    ptData = eventData.points[0];
                });

                mouseEventScatter3d('mouseover');

                setTimeout(function() {
                    done();
                }, MOUSE_DELAY);
            });

            it('should have', function() {
                node = d3.selectAll('g.hovertext');
                expect(node.size()).toEqual(1, 'one hover text group');

                node = d3.selectAll('g.hovertext').selectAll('tspan')[0];
                expect(node[0].innerHTML).toEqual('x: 140.72', 'x val on hover');
                expect(node[1].innerHTML).toEqual('y: −96.97', 'y val on hover');
                expect(node[2].innerHTML).toEqual('z: −96.97', 'z val on hover');

                expect(Object.keys(ptData)).toEqual([
                    'x', 'y', 'z',
                    'data', 'fullData', 'curveNumber', 'pointNumber'
                ], 'correct hover data fields');

                expect(ptData.x).toBe('140.72', 'x val hover data');
                expect(ptData.y).toBe('−96.97', 'y val hover data');
                expect(ptData.z).toEqual('−96.97', 'z val hover data');
                expect(ptData.curveNumber).toEqual(0, 'curveNumber hover data');
                expect(ptData.pointNumber).toEqual(2, 'pointNumber hover data');
            });

        });

        describe('scatter3d click events', function() {
            var ptData;

            beforeEach(function(done) {
                gd.on('plotly_click', function(eventData) {
                    ptData = eventData.points[0];
                });

                // N.B. gl3d click events are 'mouseover' events
                // with button 1 pressed
                mouseEventScatter3d('mouseover', {buttons: 1});

                setTimeout(function() {
                    done();
                }, MOUSE_DELAY);
            });

            it('should have', function() {
                expect(Object.keys(ptData)).toEqual([
                    'x', 'y', 'z',
                    'data', 'fullData', 'curveNumber', 'pointNumber'
                ], 'correct hover data fields');


                expect(ptData.x).toBe('140.72', 'x val click data');
                expect(ptData.y).toBe('−96.97', 'y val click data');
                expect(ptData.z).toEqual('−96.97', 'z val click data');
                expect(ptData.curveNumber).toEqual(0, 'curveNumber click data');
                expect(ptData.pointNumber).toEqual(2, 'pointNumber click data');
            });
        });

        it('should be able to reversibly change trace type', function(done) {
            var sceneLayout = { aspectratio: { x: 1, y: 1, z: 1 } };

            expect(countCanvases()).toEqual(1);
            expect(gd.layout.scene).toEqual(sceneLayout);
            expect(gd.layout.xaxis).toBeUndefined();
            expect(gd.layout.yaxis).toBeUndefined();
            expect(gd._fullLayout._hasGL3D).toBe(true);
            expect(gd._fullLayout.scene._scene).toBeDefined();

            Plotly.restyle(gd, 'type', 'scatter').then(function() {
                expect(countCanvases()).toEqual(0);
                expect(gd.layout.scene).toEqual(sceneLayout);
                expect(gd.layout.xaxis).toBeDefined();
                expect(gd.layout.yaxis).toBeDefined();
                expect(gd._fullLayout._hasGL3D).toBe(false);
                expect(gd._fullLayout.scene).toBeUndefined();

                return Plotly.restyle(gd, 'type', 'scatter3d');
            }).then(function() {
                expect(countCanvases()).toEqual(1);
                expect(gd.layout.scene).toEqual(sceneLayout);
                expect(gd.layout.xaxis).toBeDefined();
                expect(gd.layout.yaxis).toBeDefined();
                expect(gd._fullLayout._hasGL3D).toBe(true);
                expect(gd._fullLayout.scene._scene).toBeDefined();

                done();
            });
        });

        it('should be able to delete the last trace', function(done) {
            Plotly.deleteTraces(gd, [0]).then(function() {
                expect(countCanvases()).toEqual(0);
                expect(gd._fullLayout._hasGL3D).toBe(false);
                expect(gd._fullLayout.scene).toBeUndefined();

                done();
            });
        });

    });

    describe('gl2d plots', function() {
        var mock = require('@mocks/gl2d_10.json');

        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mock.data, mock.layout).then(function() {
                delay(done);
            });
        });

        it('has one *canvas* node', function() {
            var nodes = d3.selectAll('canvas');
            expect(nodes[0].length).toEqual(1);
        });
    });

    describe('gl3d modebar click handlers', function() {
        var modeBar;

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

                delay(done);
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
                        .toBeCloseToArray([1.25, 1.25, 1.25], 4);
                    expect(sceneLayout2.camera.eye)
                        .toEqual({x: 2.5, y: 2.5, z: 2.5}, 'does not change the layout objects');
                    expect(scene2.camera.eye)
                        .toBeCloseToArray([1.25, 1.25, 1.25], 4);

                    selectButton(modeBar, 'resetCameraLastSave3d').click();
                    setTimeout(function() {
                        expect(sceneLayout.camera.eye)
                            .toEqual({x: 0.1, y: 0.1, z: 1}, 'does not change the layout objects');
                        expect(scene.camera.eye)
                            .toBeCloseToArray([ 0.1, 0.1, 1], 4);
                        expect(sceneLayout2.camera.eye)
                            .toEqual({x: 2.5, y: 2.5, z: 2.5}, 'does not change the layout objects');
                        expect(scene2.camera.eye)
                            .toBeCloseToArray([2.5, 2.5, 2.5], 4);

                        done();
                    }, MODEBAR_DELAY);
                }, MODEBAR_DELAY);
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

    describe('Plots.cleanPlot', function() {

        it('should remove gl context from the graph div of a gl3d plot', function(done) {
            gd = createGraphDiv();

            var mockData = [{
                type: 'scatter3d'
            }];

            Plotly.plot(gd, mockData).then(function() {
                expect(gd._fullLayout.scene._scene.glplot).toBeDefined();

                Plots.cleanPlot([], {}, gd._fullData, gd._fullLayout);
                expect(gd._fullLayout.scene._scene.glplot).toBe(null);

                done();
            });
        });

        it('should remove gl context from the graph div of a gl2d plot', function(done) {
            gd = createGraphDiv();

            var mockData = [{
                type: 'scattergl',
                x: [1,2,3],
                y: [1,2,3]
            }];

            Plotly.plot(gd, mockData).then(function() {
                expect(gd._fullLayout._plots.xy._scene2d.glplot).toBeDefined();

                Plots.cleanPlot([], {}, gd._fullData, gd._fullLayout);
                expect(gd._fullLayout._plots.xy._scene2d.glplot).toBe(null);

                done();
            });
        });
    });
});
