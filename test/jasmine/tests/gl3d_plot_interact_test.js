var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('../../../lib/index');
var Plots = require('../../../src/plots/plots');
var Lib = require('../../../src/lib');
var Drawing = require('../../../src/components/drawing');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');
var drag = require('../assets/drag');
var selectButton = require('../assets/modebar_button');
var delay = require('../assets/delay');

describe('Test gl3d plots', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 12000;
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl should set the camera dragmode to orbit if the camera.up.z vector is set to be tilted', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'scatter3d',
                x: [1, 2, 3],
                y: [2, 3, 1],
                z: [3, 1, 2]
            }],
            layout: {
                scene: {
                    camera: {
                        up: {
                            x: -0.5777,
                            y: -0.5777,
                            z: 0.5777
                        }
                    }
                }
            }
        })

        .then(function() {
            expect(gd._fullLayout.scene.dragmode === 'orbit').toBe(true);
        })
        .then(done, done.fail);
    });

    it('@gl should set the camera dragmode to turntable if the camera.up.z vector is set to be upwards', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'scatter3d',
                x: [1, 2, 3],
                y: [2, 3, 1],
                z: [3, 1, 2]
            }],
            layout: {
                scene: {
                    camera: {
                        up: {
                            x: -0.0001,
                            y: 0,
                            z: 123.45
                        }
                    }
                }
            }
        })

        .then(function() {
            expect(gd._fullLayout.scene.dragmode === 'turntable').toBe(true);
        })
        .then(done, done.fail);
    });

    it('@gl should set the camera dragmode to turntable if the camera.up is not set', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'scatter3d',
                x: [1, 2, 3],
                y: [2, 3, 1],
                z: [3, 1, 2]
            }],
            layout: {
                scene: {
                    camera: {
                    }
                }
            }
        })

        .then(function() {
            expect(gd._fullLayout.scene.dragmode === 'turntable').toBe(true);
        })
        .then(done, done.fail);
    });

    it('@gl should set the camera dragmode to turntable if any of camera.up.[x|y|z] is missing', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'scatter3d',
                x: [1, 2, 3],
                y: [2, 3, 1],
                z: [3, 1, 2]
            }],
            layout: {
                scene: {
                    camera: {
                        up: {
                            x: null,
                            y: 0.5,
                            z: 0.5
                        }
                    }
                }
            }
        })

        .then(function() {
            expect(gd._fullLayout.scene.dragmode === 'turntable').toBe(true);
        })
        .then(done, done.fail);
    });

    it('@gl should not set the camera dragmode to turntable if camera.up.z is zero.', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'scatter3d',
                x: [1, 2, 3],
                y: [2, 3, 1],
                z: [3, 1, 2]
            }],
            layout: {
                scene: {
                    camera: {
                        up: {
                            x: 1,
                            y: 0,
                            z: 0
                        }
                    }
                }
            }
        })

        .then(function() {
            expect(gd._fullLayout.scene.dragmode === 'turntable').not.toBe(true);
        })
        .then(done, done.fail);
    });

    it('@gl should set the camera projection type to perspective if the camera.projection.type is not set', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'scatter3d',
                x: [1, 2, 3],
                y: [2, 3, 1],
                z: [3, 1, 2]
            }],
            layout: {
                scene: {
                    camera: {
                    }
                }
            }
        })

        .then(function() {
            expect(gd._fullLayout.scene.camera.projection.type === 'perspective').toBe(true);
            expect(gd._fullLayout.scene._scene.camera._ortho === false).toBe(true);
        })
        .then(done, done.fail);
    });

    it('@gl should set the camera projection type to orthographic if the camera.projection.type is set to orthographic', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'scatter3d',
                x: [1, 2, 3],
                y: [2, 3, 1],
                z: [3, 1, 2]
            }],
            layout: {
                scene: {
                    camera: {
                        projection: {
                            type: 'orthographic'
                        }
                    }
                }
            }
        })

        .then(function() {
            expect(gd._fullLayout.scene.camera.projection.type === 'orthographic').toBe(true);
            expect(gd._fullLayout.scene._scene.camera._ortho === true).toBe(true);
        })
        .then(done, done.fail);
    });

    it('@gl should enable orthographic & perspective projections using relayout', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'scatter3d',
                x: [1, 2, 3],
                y: [2, 3, 1],
                z: [3, 1, 2]
            }],
            layout: {
                scene: {
                    camera: {
                        projection: {
                            type: 'perspective'
                        }
                    }
                }
            }
        })

        .then(function() {
            return Plotly.relayout(gd, 'scene.camera.projection.type', 'orthographic');
        })
        .then(function() {
            expect(gd._fullLayout.scene.camera.projection.type === 'orthographic').toBe(true);
            expect(gd._fullLayout.scene._scene.camera._ortho === true).toBe(true);
        })
        .then(function() {
            return Plotly.relayout(gd, 'scene.camera.eye.z', 2);
        })
        .then(function() {
            expect(gd._fullLayout.scene.camera.projection.type === 'orthographic').toBe(true);
            expect(gd._fullLayout.scene._scene.camera._ortho === true).toBe(true);
        })
        .then(function() {
            return Plotly.relayout(gd, 'scene.camera.projection.type', 'perspective');
        })
        .then(function() {
            expect(gd._fullLayout.scene.camera.projection.type === 'perspective').toBe(true);
            expect(gd._fullLayout.scene._scene.camera._ortho === false).toBe(true);
        })
        .then(function() {
            return Plotly.relayout(gd, 'scene.camera.eye.z', 3);
        })
        .then(function() {
            expect(gd._fullLayout.scene.camera.projection.type === 'perspective').toBe(true);
            expect(gd._fullLayout.scene._scene.camera._ortho === false).toBe(true);
        })
        .then(done, done.fail);
    });

    it('@gl should not set _length to NaN and dtick should be defined.', function(done) {
        Plotly.newPlot(gd,
            {
                data: [{
                    type: 'scatter3d',
                    mode: 'markers',
                    x: [1, 2],
                    y: [3, 4],
                    z: [0.000000005, 0.000000006]
                }],
                layout: {
                    scene: {
                        camera: {
                            eye: {x: 1, y: 1, z: 0},
                            center: {x: 0.5, y: 0.5, z: 1},
                            up: {x: 0, y: 0, z: 1}
                        }
                    }
                }
            }
        )
        .then(function() {
            var zaxis = gd._fullLayout.scene.zaxis;
            expect(isNaN(zaxis._length)).toBe(false);
            expect(zaxis.dtick === undefined).toBe(false);
        })
        .then(done, done.fail);
    });
});

describe('Test gl3d modebar handlers - perspective case', function() {
    var gd, modeBar;

    function assertScenes(cont, attr, val) {
        var sceneIds = cont._subplots.gl3d;

        sceneIds.forEach(function(sceneId) {
            var thisVal = Lib.nestedProperty(cont[sceneId], attr).get();
            expect(thisVal).toEqual(val);
        });
    }

    function assertCameraEye(sceneLayout, eyeX, eyeY, eyeZ) {
        expect(sceneLayout.camera.eye.x).toEqual(eyeX);
        expect(sceneLayout.camera.eye.y).toEqual(eyeY);
        expect(sceneLayout.camera.eye.z).toEqual(eyeZ);

        var camera = sceneLayout._scene.getCamera();
        expect(camera.eye.x).toBeCloseTo(eyeX);
        expect(camera.eye.y).toBeCloseTo(eyeY);
        expect(camera.eye.z).toBeCloseTo(eyeZ);
    }

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mock = {
            data: [
                { type: 'scatter3d' },
                { type: 'surface', scene: 'scene2' }
            ],
            layout: {
                scene: {
                    camera: {
                        eye: { x: 0.1, y: 0.1, z: 1 }
                    }
                },
                scene2: {
                    camera: {
                        eye: { x: 2.5, y: 2.5, z: 2.5 }
                    },
                    aspectratio: { x: 3, y: 2, z: 1 }
                }
            },
            config: {
                modeBarButtonsToAdd: ['hoverclosest']
            }
        };

        Plotly.newPlot(gd, mock)

        .then(function() {
            modeBar = gd._fullLayout._modeBar;
        })
        .then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl button zoom3d should updates the scene dragmode and dragmode button', function() {
        var buttonTurntable = selectButton(modeBar, 'tableRotation');
        var buttonZoom3d = selectButton(modeBar, 'zoom3d');

        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonZoom3d.isActive()).toBe(false);

        buttonZoom3d.click();
        assertScenes(gd._fullLayout, 'dragmode', 'zoom');
        expect(gd.layout.dragmode).toBe('zoom'); // for multi-type subplots
        expect(gd._fullLayout.dragmode).toBe('zoom');
        expect(buttonTurntable.isActive()).toBe(false);
        expect(buttonZoom3d.isActive()).toBe(true);

        buttonTurntable.click();
        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonZoom3d.isActive()).toBe(false);
    });

    it('@gl button pan3d should updates the scene dragmode and dragmode button', function() {
        var buttonTurntable = selectButton(modeBar, 'tableRotation');
        var buttonPan3d = selectButton(modeBar, 'pan3d');

        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonPan3d.isActive()).toBe(false);

        buttonPan3d.click();
        assertScenes(gd._fullLayout, 'dragmode', 'pan');
        expect(gd.layout.dragmode).toBe('pan'); // for multi-type subplots
        expect(gd._fullLayout.dragmode).toBe('pan');
        expect(buttonTurntable.isActive()).toBe(false);
        expect(buttonPan3d.isActive()).toBe(true);

        buttonTurntable.click();
        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonPan3d.isActive()).toBe(false);
    });

    it('@gl button orbitRotation should updates the scene dragmode and dragmode button', function() {
        var buttonTurntable = selectButton(modeBar, 'tableRotation');
        var buttonOrbit = selectButton(modeBar, 'orbitRotation');

        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonOrbit.isActive()).toBe(false);

        buttonOrbit.click();
        assertScenes(gd._fullLayout, 'dragmode', 'orbit');
        expect(gd.layout.dragmode).toBe('zoom'); // fallback for multi-type subplots
        expect(gd._fullLayout.dragmode).toBe('zoom');
        expect(buttonTurntable.isActive()).toBe(false);
        expect(buttonOrbit.isActive()).toBe(true);

        buttonTurntable.click();
        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonOrbit.isActive()).toBe(false);
    });

    it('@gl button hoverClosest should update the scene hovermode and spikes', function() {
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

    it('@gl button resetCameraDefault3d should reset camera to default', function(done) {
        var buttonDefault = selectButton(modeBar, 'resetCameraDefault3d');

        expect(gd._fullLayout.scene._scene.viewInitial.eye).toEqual({ x: 0.1, y: 0.1, z: 1 });
        expect(gd._fullLayout.scene2._scene.viewInitial.eye).toEqual({ x: 2.5, y: 2.5, z: 2.5 });

        return new Promise(function(resolve) {
            gd.once('plotly_relayout', function() {
                assertScenes(gd._fullLayout, 'camera.eye.x', 1.25);
                assertScenes(gd._fullLayout, 'camera.eye.y', 1.25);
                assertScenes(gd._fullLayout, 'camera.eye.z', 1.25);

                expect(gd._fullLayout.scene._scene.getCamera().eye.z).toBeCloseTo(1.25);
                expect(gd._fullLayout.scene2._scene.getCamera().eye.z).toBeCloseTo(1.25);

                resolve();
            });

            buttonDefault.click();
        })
        .then(done, done.fail);
    });

    it('@gl button resetCameraDefault3d should reset to initial aspectmode & aspectratios', function(done) {
        var buttonDefault = selectButton(modeBar, 'resetCameraDefault3d');

        expect(gd._fullLayout.scene._scene.viewInitial.aspectmode).toEqual('auto');
        expect(gd._fullLayout.scene2._scene.viewInitial.aspectmode).toEqual('manual');

        expect(gd._fullLayout.scene._scene.viewInitial.aspectratio).toEqual({ x: 1, y: 1, z: 1 });
        expect(gd._fullLayout.scene2._scene.viewInitial.aspectratio).toEqual({ x: 3, y: 2, z: 1 });

        return new Promise(function(resolve) {
            gd.once('plotly_relayout', function() {
                expect(gd._fullLayout.scene._scene.fullSceneLayout.aspectmode).toBe('auto');
                expect(gd._fullLayout.scene2._scene.fullSceneLayout.aspectmode).toBe('manual');

                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().x).toBeCloseTo(1);
                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().y).toBeCloseTo(1);
                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().z).toBeCloseTo(1);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().x).toBeCloseTo(3);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().y).toBeCloseTo(2);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().z).toBeCloseTo(1);

                resolve();
            });

            buttonDefault.click();
        })
        .then(done, done.fail);
    });

    it('@gl button resetCameraLastSave3d should reset to initial aspectmode & aspectratios', function(done) {
        var buttonDefault = selectButton(modeBar, 'resetCameraDefault3d');

        expect(gd._fullLayout.scene._scene.viewInitial.aspectmode).toEqual('auto');
        expect(gd._fullLayout.scene2._scene.viewInitial.aspectmode).toEqual('manual');

        expect(gd._fullLayout.scene._scene.viewInitial.aspectratio).toEqual({ x: 1, y: 1, z: 1 });
        expect(gd._fullLayout.scene2._scene.viewInitial.aspectratio).toEqual({ x: 3, y: 2, z: 1 });

        return new Promise(function(resolve) {
            gd.once('plotly_relayout', function() {
                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().x).toBeCloseTo(1);
                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().y).toBeCloseTo(1);
                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().z).toBeCloseTo(1);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().x).toBeCloseTo(3);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().y).toBeCloseTo(2);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().z).toBeCloseTo(1);

                resolve();
            });

            buttonDefault.click();
        })
        .then(done, done.fail);
    });

    it('@gl button resetCameraLastSave3d should reset camera to default', function(done) {
        var buttonDefault = selectButton(modeBar, 'resetCameraDefault3d');
        var buttonLastSave = selectButton(modeBar, 'resetCameraLastSave3d');

        Plotly.relayout(gd, {
            'scene.camera.eye.z': 4,
            'scene2.camera.eye.z': 5
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 4);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 5);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonLastSave.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 1);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 2.5);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonDefault.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 1.25, 1.25, 1.25);
            assertCameraEye(gd._fullLayout.scene2, 1.25, 1.25, 1.25);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonLastSave.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 1);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 2.5);

            delete gd._fullLayout.scene._scene.viewInitial;
            delete gd._fullLayout.scene2._scene.viewInitial;

            Plotly.relayout(gd, {
                'scene.bgcolor': '#d3d3d3',
                'scene.camera.eye.z': 4,
                'scene2.camera.eye.z': 5
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 4);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 5);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonDefault.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 1.25, 1.25, 1.25);
            assertCameraEye(gd._fullLayout.scene2, 1.25, 1.25, 1.25);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonLastSave.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 4);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 5);
        })
        .then(done, done.fail);
    });
});


describe('Test gl3d modebar handlers - orthographic case', function() {
    var gd, modeBar;

    function assertScenes(cont, attr, val) {
        var sceneIds = cont._subplots.gl3d;

        sceneIds.forEach(function(sceneId) {
            var thisVal = Lib.nestedProperty(cont[sceneId], attr).get();
            expect(thisVal).toEqual(val);
        });
    }

    function assertCameraEye(sceneLayout, eyeX, eyeY, eyeZ) {
        expect(sceneLayout.camera.eye.x).toEqual(eyeX);
        expect(sceneLayout.camera.eye.y).toEqual(eyeY);
        expect(sceneLayout.camera.eye.z).toEqual(eyeZ);

        var camera = sceneLayout._scene.getCamera();
        expect(camera.eye.x).toBeCloseTo(eyeX);
        expect(camera.eye.y).toBeCloseTo(eyeY);
        expect(camera.eye.z).toBeCloseTo(eyeZ);
    }

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mock = {
            data: [
                { type: 'scatter3d' },
                { type: 'surface', scene: 'scene2' }
            ],
            layout: {
                scene: {
                    camera: {
                        eye: { x: 0.1, y: 0.1, z: 1 },
                        projection: {type: 'orthographic'}
                    }
                },
                scene2: {
                    camera: {
                        eye: { x: 2.5, y: 2.5, z: 2.5 },
                        projection: {type: 'orthographic'}
                    },
                    aspectratio: { x: 3, y: 2, z: 1 }
                }
            }
        };

        Plotly.newPlot(gd, mock)

        .then(function() {
            modeBar = gd._fullLayout._modeBar;
        })
        .then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl button resetCameraDefault3d should reset camera to default', function(done) {
        var buttonDefault = selectButton(modeBar, 'resetCameraDefault3d');

        expect(gd._fullLayout.scene._scene.viewInitial.eye).toEqual({ x: 0.1, y: 0.1, z: 1 });
        expect(gd._fullLayout.scene2._scene.viewInitial.eye).toEqual({ x: 2.5, y: 2.5, z: 2.5 });

        return new Promise(function(resolve) {
            gd.once('plotly_relayout', function() {
                assertScenes(gd._fullLayout, 'camera.eye.x', 1.25);
                assertScenes(gd._fullLayout, 'camera.eye.y', 1.25);
                assertScenes(gd._fullLayout, 'camera.eye.z', 1.25);

                expect(gd._fullLayout.scene._scene.getCamera().eye.z).toBeCloseTo(1.25);
                expect(gd._fullLayout.scene2._scene.getCamera().eye.z).toBeCloseTo(1.25);

                resolve();
            });

            buttonDefault.click();
        })
        .then(done, done.fail);
    });

    it('@gl button resetCameraDefault3d should reset to initial aspectmode & aspectratios', function(done) {
        var buttonDefault = selectButton(modeBar, 'resetCameraDefault3d');

        expect(gd._fullLayout.scene._scene.viewInitial.aspectmode).toEqual('auto');
        expect(gd._fullLayout.scene2._scene.viewInitial.aspectmode).toEqual('manual');

        expect(gd._fullLayout.scene._scene.viewInitial.aspectratio).toEqual({ x: 1, y: 1, z: 1 });
        expect(gd._fullLayout.scene2._scene.viewInitial.aspectratio).toEqual({ x: 3, y: 2, z: 1 });

        return new Promise(function(resolve) {
            gd.once('plotly_relayout', function() {
                expect(gd._fullLayout.scene._scene.aspectmode).toEqual(undefined);
                expect(gd._fullLayout.scene2._scene.aspectmode).toEqual(undefined);

                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().x).toBeCloseTo(1);
                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().y).toBeCloseTo(1);
                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().z).toBeCloseTo(1);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().x).toBeCloseTo(3);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().y).toBeCloseTo(2);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().z).toBeCloseTo(1);

                resolve();
            });

            buttonDefault.click();
        })
        .then(done, done.fail);
    });

    it('@gl button resetCameraLastSave3d should reset to initial aspectmode & aspectratios', function(done) {
        var buttonDefault = selectButton(modeBar, 'resetCameraDefault3d');

        expect(gd._fullLayout.scene._scene.viewInitial.aspectmode).toEqual('auto');
        expect(gd._fullLayout.scene2._scene.viewInitial.aspectmode).toEqual('manual');

        expect(gd._fullLayout.scene._scene.viewInitial.aspectratio).toEqual({ x: 1, y: 1, z: 1 });
        expect(gd._fullLayout.scene2._scene.viewInitial.aspectratio).toEqual({ x: 3, y: 2, z: 1 });

        return new Promise(function(resolve) {
            gd.once('plotly_relayout', function() {
                expect(gd._fullLayout.scene._scene.fullSceneLayout.aspectmode).toBe('auto');
                expect(gd._fullLayout.scene2._scene.fullSceneLayout.aspectmode).toBe('manual');

                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().x).toBeCloseTo(1);
                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().y).toBeCloseTo(1);
                expect(gd._fullLayout.scene._scene.glplot.getAspectratio().z).toBeCloseTo(1);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().x).toBeCloseTo(3);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().y).toBeCloseTo(2);
                expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().z).toBeCloseTo(1);

                resolve();
            });

            buttonDefault.click();
        })
        .then(done, done.fail);
    });

    it('@gl button resetCameraLastSave3d should reset camera to default', function(done) {
        var buttonDefault = selectButton(modeBar, 'resetCameraDefault3d');
        var buttonLastSave = selectButton(modeBar, 'resetCameraLastSave3d');

        Plotly.relayout(gd, {
            'scene.camera.eye.z': 4,
            'scene2.camera.eye.z': 5
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 4);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 5);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonLastSave.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 1);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 2.5);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonDefault.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 1.25, 1.25, 1.25);
            assertCameraEye(gd._fullLayout.scene2, 1.25, 1.25, 1.25);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonLastSave.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 1);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 2.5);

            delete gd._fullLayout.scene._scene.viewInitial;
            delete gd._fullLayout.scene2._scene.viewInitial;

            Plotly.relayout(gd, {
                'scene.bgcolor': '#d3d3d3',
                'scene.camera.eye.z': 4,
                'scene2.camera.eye.z': 5
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 4);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 5);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonDefault.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 1.25, 1.25, 1.25);
            assertCameraEye(gd._fullLayout.scene2, 1.25, 1.25, 1.25);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonLastSave.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 4);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 5);
        })
        .then(done, done.fail);
    });
});

describe('Test gl3d drag and wheel interactions', function() {
    var gd;

    function scroll(target, amt) {
        return new Promise(function(resolve) {
            target.dispatchEvent(new WheelEvent('wheel', {deltaY: amt || 1, cancelable: true}));
            setTimeout(resolve, 0);
        });
    }

    beforeEach(function() {
        gd = createGraphDiv();
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl should not scroll document while panning', function(done) {
        var mock = {
            data: [
                { type: 'scatter3d' }
            ],
            layout: {
                width: 500,
                height: 500,
                scene: { camera: { eye: { x: 0.1, y: 0.1, z: 1 }}}
            }
        };

        var sceneTarget;
        var relayoutCallback = jasmine.createSpy('relayoutCallback');

        function assertEvent(e, passive) {
            expect(e.defaultPrevented).not.toEqual(passive);
            relayoutCallback();
        }

        gd.addEventListener('touchend', function(e) { assertEvent(e, true); });
        gd.addEventListener('touchstart', function(e) { assertEvent(e, true); });
        gd.addEventListener('touchmove', function(e) { assertEvent(e, false); });
        gd.addEventListener('wheel', function(e) { assertEvent(e, false); });

        Plotly.newPlot(gd, mock)
        .then(function() {
            sceneTarget = gd.querySelector('.svg-container .gl-container #scene');

            return drag({touch: true, node: sceneTarget, pos0: [100, 100], posN: [0, 0], noCover: true});
        })
        .then(function() {
            return drag({node: sceneTarget, pos0: [100, 100], posN: [0, 0], noCover: true});
        })
        .then(function() {
            return scroll(sceneTarget);
        })
        .then(function() {
            expect(relayoutCallback).toHaveBeenCalledTimes(3);
        })
        .then(done, done.fail);
    });

    it('@gl should update the scene camera - perspective case', function(done) {
        var sceneLayout, sceneLayout2, sceneTarget, sceneTarget2, relayoutCallback;

        var mock = {
            data: [
                { type: 'scatter3d' },
                { type: 'surface', scene: 'scene2' }
            ],
            layout: {
                scene: { camera: { eye: { x: 0.1, y: 0.1, z: 1 }}},
                scene2: { camera: { eye: { x: 2.5, y: 2.5, z: 2.5 }}}
            }
        };

        var newPlot = function(fig) {
            return Plotly.newPlot(gd, fig).then(function() {
                relayoutCallback = jasmine.createSpy('relayoutCallback');
                gd.on('plotly_relayout', relayoutCallback);

                sceneLayout = gd._fullLayout.scene;
                sceneLayout2 = gd._fullLayout.scene2;
                sceneTarget = gd.querySelector('.svg-container .gl-container #scene  canvas');
                sceneTarget2 = gd.querySelector('.svg-container .gl-container #scene2 canvas');
            });
        };

        function _assertAndReset(cnt) {
            expect(relayoutCallback).toHaveBeenCalledTimes(cnt);
            relayoutCallback.calls.reset();
        }

        newPlot(mock)
        .then(function() {
            expect(sceneLayout.camera.eye)
                .toEqual({x: 0.1, y: 0.1, z: 1});
            expect(sceneLayout2.camera.eye)
                .toEqual({x: 2.5, y: 2.5, z: 2.5});
            expect(sceneLayout.camera.projection)
                .toEqual({type: 'perspective'});
            expect(sceneLayout2.camera.projection)
                .toEqual({type: 'perspective'});

            return scroll(sceneTarget);
        })
        .then(function() {
            _assertAndReset(1);
            return scroll(sceneTarget2);
        })
        .then(function() {
            _assertAndReset(1);
            return drag({node: sceneTarget2, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            _assertAndReset(1);
            return drag({node: sceneTarget, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            _assertAndReset(1);
            return Plotly.relayout(gd, {'scene.dragmode': false, 'scene2.dragmode': false});
        })
        .then(function() {
            _assertAndReset(1);
            return drag({node: sceneTarget, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            return drag({node: sceneTarget2, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            _assertAndReset(0);

            return Plotly.relayout(gd, {'scene.dragmode': 'orbit', 'scene2.dragmode': 'turntable'});
        })
        .then(function() {
            _assertAndReset(1);

            return drag({node: sceneTarget, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            _assertAndReset(1);

            return drag({node: sceneTarget2, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            _assertAndReset(1);

            return newPlot({
                data: gd.data,
                layout: gd.layout,
                config: {scrollZoom: false}
            });
        })
        .then(function() {
            _assertAndReset(0);

            return scroll(sceneTarget);
        })
        .then(function() {
            _assertAndReset(0);

            return scroll(sceneTarget2);
        })
        .then(function() {
            _assertAndReset(0);
            return newPlot({
                data: gd.data,
                layout: gd.layout,
                config: {scrollZoom: 'gl3d'}
            });
        })
        .then(function() {
            _assertAndReset(0);

            return scroll(sceneTarget);
        })
        .then(function() {
            _assertAndReset(1);

            return scroll(sceneTarget2);
        })
        .then(function() {
            _assertAndReset(1);
        })
        .then(done, done.fail);
    });

    it('@gl should update the scene camera - orthographic case', function(done) {
        var sceneLayout, sceneLayout2, sceneTarget, sceneTarget2, relayoutCallback;

        var mock = {
            data: [
                { type: 'scatter3d', x: [1, 2, 3], y: [2, 3, 1], z: [3, 1, 2] },
                { type: 'surface', scene: 'scene2', x: [1, 2], y: [2, 1], z: [[1, 2], [2, 1]] }
            ],
            layout: {
                scene: { camera: { projection: {type: 'orthographic'}, eye: { x: 0.1, y: 0.1, z: 1 }}},
                scene2: { camera: { projection: {type: 'orthographic'}, eye: { x: 2.5, y: 2.5, z: 2.5 }}}
            }
        };

        var newPlot = function(fig) {
            return Plotly.newPlot(gd, fig).then(function() {
                relayoutCallback = jasmine.createSpy('relayoutCallback');
                gd.on('plotly_relayout', relayoutCallback);

                sceneLayout = gd._fullLayout.scene;
                sceneLayout2 = gd._fullLayout.scene2;
                sceneTarget = gd.querySelector('.svg-container .gl-container #scene  canvas');
                sceneTarget2 = gd.querySelector('.svg-container .gl-container #scene2 canvas');
            });
        };

        function _assertAndReset(cnt) {
            expect(relayoutCallback).toHaveBeenCalledTimes(cnt);
            relayoutCallback.calls.reset();
        }

        newPlot(mock)
        .then(function() {
            expect(sceneLayout.camera.eye)
                .toEqual({x: 0.1, y: 0.1, z: 1});
            expect(sceneLayout2.camera.eye)
                .toEqual({x: 2.5, y: 2.5, z: 2.5});
            expect(sceneLayout.camera.projection)
                .toEqual({type: 'orthographic'});
            expect(sceneLayout2.camera.projection)
                .toEqual({type: 'orthographic'});

            return scroll(sceneTarget);
        })
        .then(function() {
            _assertAndReset(1);
            return scroll(sceneTarget2);
        })
        .then(function() {
            _assertAndReset(1);
            return drag({node: sceneTarget2, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            _assertAndReset(1);
            return drag({node: sceneTarget, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            _assertAndReset(1);
            return Plotly.relayout(gd, {'scene.dragmode': false, 'scene2.dragmode': false});
        })
        .then(function() {
            _assertAndReset(1);
            return drag({node: sceneTarget, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            return drag({node: sceneTarget2, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            _assertAndReset(0);

            return Plotly.relayout(gd, {'scene.dragmode': 'orbit', 'scene2.dragmode': 'turntable'});
        })
        .then(function() {
            _assertAndReset(1);

            return drag({node: sceneTarget, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            _assertAndReset(1);

            return drag({node: sceneTarget2, pos0: [0, 0], posN: [100, 100], noCover: true});
        })
        .then(function() {
            _assertAndReset(1);

            return newPlot({
                data: gd.data,
                layout: gd.layout,
                config: {scrollZoom: false}
            });
        })
        .then(function() {
            _assertAndReset(0);

            return scroll(sceneTarget);
        })
        .then(function() {
            _assertAndReset(0);

            return scroll(sceneTarget2);
        })
        .then(function() {
            _assertAndReset(0);
            return newPlot({
                data: gd.data,
                layout: gd.layout,
                config: {scrollZoom: 'gl3d'}
            });
        })
        .then(function() {
            return scroll(sceneTarget);
        })
        .then(function() {
            _assertAndReset(1);

            return scroll(sceneTarget2);
        })
        .then(function() {
            _assertAndReset(1);
        })
        .then(done, done.fail);
    });

    it('@gl should update the scene aspectmode & aspectratio when zooming with scroll wheel i.e. orthographic case', function(done) {
        var sceneLayout, sceneLayout2, sceneTarget, sceneTarget2;

        var mock = {
            data: [
                { type: 'scatter3d', x: [1, 2, 3], y: [2, 3, 1], z: [3, 1, 2] },
                { type: 'surface', scene: 'scene2', x: [1, 2], y: [2, 1], z: [[1, 2], [2, 1]] }
            ],
            layout: {
                scene: { camera: { projection: {type: 'orthographic'}}},
                scene2: { camera: { projection: {type: 'orthographic'}}, aspectratio: { x: 3, y: 2, z: 1 }}
            }
        };

        var aspectratio;
        var relayoutEvent;
        var relayoutCnt = 0;
        var modeBar;

        var newPlot = function(fig) {
            return Plotly.newPlot(gd, fig).then(function() {
                gd.on('plotly_relayout', function(e) {
                    relayoutCnt++;
                    relayoutEvent = e;
                });
            });
        };

        newPlot(mock)
        .then(function() {
            modeBar = gd._fullLayout._modeBar;
        })
        .then(function() {
            sceneLayout = gd._fullLayout.scene;
            sceneLayout2 = gd._fullLayout.scene2;
            sceneTarget = gd.querySelector('.svg-container .gl-container #scene  canvas');
            sceneTarget2 = gd.querySelector('.svg-container .gl-container #scene2 canvas');

            expect(sceneLayout.aspectratio).toEqual({x: 1, y: 1, z: 1});
            expect(sceneLayout2.aspectratio).toEqual({x: 3, y: 2, z: 1});
        })
        .then(function() {
            return scroll(sceneTarget);
        })
        .then(function() {
            expect(relayoutCnt).toEqual(1);

            aspectratio = relayoutEvent['scene.aspectratio'];
            expect(aspectratio.x).toBeCloseTo(0.909, 3, 'aspectratio.x');
            expect(aspectratio.y).toBeCloseTo(0.909, 3, 'aspectratio.y');
            expect(aspectratio.z).toBeCloseTo(0.909, 3, 'aspectratio.z');

            expect(relayoutEvent['scene.aspectmode']).toBe('manual');
            expect(gd._fullLayout.scene._scene.fullSceneLayout.aspectmode).toBe('manual');
        })
        .then(function() {
            return scroll(sceneTarget2);
        })
        .then(function() {
            expect(relayoutCnt).toEqual(2);

            aspectratio = relayoutEvent['scene2.aspectratio'];
            expect(aspectratio.x).toBeCloseTo(2.727, 3, 'aspectratio.x');
            expect(aspectratio.y).toBeCloseTo(1.818, 3, 'aspectratio.y');
            expect(aspectratio.z).toBeCloseTo(0.909, 3, 'aspectratio.z');

            expect(relayoutEvent['scene2.aspectmode']).toBe('manual');
            expect(gd._fullLayout.scene2._scene.fullSceneLayout.aspectmode).toBe('manual');
        })
        .then(function() {
            var buttonDefault = selectButton(modeBar, 'resetCameraDefault3d');

            buttonDefault.click();
        })
        .then(function() {
            expect(gd._fullLayout.scene._scene.aspectmode).toEqual(undefined);
            expect(gd._fullLayout.scene2._scene.aspectmode).toEqual(undefined);

            expect(gd._fullLayout.scene._scene.glplot.getAspectratio().x).toBeCloseTo(1);
            expect(gd._fullLayout.scene._scene.glplot.getAspectratio().y).toBeCloseTo(1);
            expect(gd._fullLayout.scene._scene.glplot.getAspectratio().z).toBeCloseTo(1);
            expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().x).toBeCloseTo(3);
            expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().y).toBeCloseTo(2);
            expect(gd._fullLayout.scene2._scene.glplot.getAspectratio().z).toBeCloseTo(1);
        })
        .then(done, done.fail);
    });

    it('@gl should fire plotly_relayouting events when dragged - perspective case', function(done) {
        var sceneTarget, relayoutEvent;

        var nsteps = 10;
        var relayoutCnt = 0;
        var events = [];

        var mock = {
            data: [
                { type: 'scatter3d', x: [1, 2, 3], y: [2, 3, 1], z: [3, 1, 2] }
            ],
            layout: {
                scene: { camera: { projection: {type: 'perspective'}, eye: { x: 0.1, y: 0.1, z: 1 }}},
                width: 400, height: 400
            }
        };

        Plotly.newPlot(gd, mock)
        .then(function() {
            gd.on('plotly_relayout', function(e) {
                relayoutCnt++;
                relayoutEvent = e;
            });
            gd.on('plotly_relayouting', function(e) {
                events.push(e);
            });

            sceneTarget = gd.querySelector('.svg-container .gl-container #scene canvas');

            return drag({
                node: sceneTarget,
                pos0: [200, 200],
                posN: [100, 100],
                nsteps: nsteps,
                buttons: 1,
                noCover: true
            });
        })
        .then(function() {
            expect(events.length).toEqual(nsteps);
            expect(relayoutCnt).toEqual(1);

            Object.keys(relayoutEvent).sort().forEach(function(key) {
                expect(Object.keys(events[0])).toContain(key);
                expect(key).not.toBe('scene.aspectratio');
                expect(key).not.toBe('scene.aspectmode');
            });
        })
        .then(done, done.fail);
    });

    it('@gl should fire plotly_relayouting events when dragged - orthographic case', function(done) {
        var sceneTarget, relayoutEvent;

        var nsteps = 10;
        var relayoutCnt = 0;
        var events = [];

        var mock = {
            data: [
                { type: 'scatter3d', x: [1, 2, 3], y: [2, 3, 1], z: [3, 1, 2] }
            ],
            layout: {
                scene: { camera: { projection: {type: 'orthographic'}, eye: { x: 0.1, y: 0.1, z: 1 }}},
                width: 400, height: 400
            }
        };

        Plotly.newPlot(gd, mock)
        .then(function() {
            gd.on('plotly_relayout', function(e) {
                relayoutCnt++;
                relayoutEvent = e;
            });
            gd.on('plotly_relayouting', function(e) {
                events.push(e);
            });

            sceneTarget = gd.querySelector('.svg-container .gl-container #scene canvas');

            return drag({
                node: sceneTarget,
                pos0: [200, 200],
                posN: [100, 100],
                nsteps: nsteps,
                buttons: 1,
                noCover: true
            });
        })
        .then(function() {
            expect(events.length).toEqual(nsteps);
            expect(relayoutCnt).toEqual(1);
            Object.keys(relayoutEvent).sort().forEach(function(key) {
                expect(Object.keys(events[0])).toContain(key);
                expect(key).not.toBe('scene.aspectratio');
                expect(key).not.toBe('scene.aspectmode');
            });
        })
        .then(done, done.fail);
    });


    it('@gl should fire plotly_relayouting events when dragged - orthographic case', function(done) {
        var sceneTarget, relayoutEvent;

        var nsteps = 10;
        var relayoutCnt = 0;
        var events = [];

        var mock = {
            data: [
                { type: 'scatter3d', x: [1, 2, 3], y: [2, 3, 1], z: [3, 1, 2] }
            ],
            layout: {
                scene: { camera: { projection: {type: 'orthographic'}, eye: { x: 0.1, y: 0.1, z: 1 }}},
                width: 400, height: 400
            }
        };

        Plotly.newPlot(gd, mock)
        .then(function() {
            gd.on('plotly_relayout', function(e) {
                relayoutCnt++;
                relayoutEvent = e;
            });
            gd.on('plotly_relayouting', function(e) {
                events.push(e);
            });

            sceneTarget = gd.querySelector('.svg-container .gl-container #scene canvas');

            return drag({
                node: sceneTarget,
                pos0: [200, 200],
                posN: [100, 100],
                nsteps: nsteps,
                buttons: 1,
                noCover: true
            });
        })
        .then(function() {
            expect(events.length).toEqual(nsteps);
            expect(relayoutCnt).toEqual(1);
            Object.keys(relayoutEvent).sort().forEach(function(key) {
                expect(Object.keys(events[0])).toContain(key);
            });
        })
        .then(done, done.fail);
    });

    it('@gl should preserve aspectratio values when orthographic scroll zoom i.e. after restyle', function(done) {
        var coords = {
            x: [1, 2, 10, 4, 5],
            y: [10, 2, 4, 4, 2],
            z: [10, 2, 4, 8, 16],
        };

        var mock = {
            data: [{
                type: 'scatter3d',
                x: coords.x,
                y: coords.y,
                z: coords.z,
                mode: 'markers',
                marker: {
                    color: 'red',
                    size: 16,
                }
            }, {
                type: 'scatter3d',
                x: [coords.x[0]],
                y: [coords.y[0]],
                z: [coords.z[0]],
                mode: 'markers',
                marker: {
                    color: 'blue',
                    size: 32,
                }
            }],
            layout: {
                width: 400,
                height: 400,
                scene: {
                    camera: {
                        projection: {
                            type: 'orthographic'
                        }
                    },
                }
            }
        };

        var sceneTarget;
        var relayoutEvent;
        var relayoutCnt = 0;

        Plotly.newPlot(gd, mock)
        .then(function() {
            gd.on('plotly_relayout', function(e) {
                relayoutCnt++;
                relayoutEvent = e;
            });

            sceneTarget = gd.querySelector('.svg-container .gl-container #scene canvas');
        })
        .then(function() {
            var aspectratio = gd._fullLayout.scene.aspectratio;
            expect(aspectratio.x).toBeCloseTo(0.898, 3, 'aspectratio.x');
            expect(aspectratio.y).toBeCloseTo(0.798, 3, 'aspectratio.y');
            expect(aspectratio.z).toBeCloseTo(1.396, 3, 'aspectratio.z');
        })
        .then(function() {
            return scroll(sceneTarget);
        })
        .then(function() {
            expect(relayoutCnt).toEqual(1);

            var aspectratio = relayoutEvent['scene.aspectratio'];
            expect(aspectratio.x).toBeCloseTo(0.816, 3, 'aspectratio.x');
            expect(aspectratio.y).toBeCloseTo(0.725, 3, 'aspectratio.y');
            expect(aspectratio.z).toBeCloseTo(1.269, 3, 'aspectratio.z');

            expect(relayoutEvent['scene.aspectmode']).toBe('manual');
            expect(gd._fullLayout.scene._scene.fullSceneLayout.aspectmode).toBe('manual');
        })
        .then(function() {
            // select a point
            var i = 2;

            return Plotly.restyle(gd, {
                x: [[coords.x[i]]],
                y: [[coords.y[i]]],
                z: [[coords.z[i]]],
            }, 1);
        })
        .then(function() {
            var aspectratio = gd._fullLayout.scene.aspectratio;
            expect(aspectratio.x).toBeCloseTo(0.816, 3, 'aspectratio.x');
            expect(aspectratio.y).toBeCloseTo(0.725, 3, 'aspectratio.y');
            expect(aspectratio.z).toBeCloseTo(1.269, 3, 'aspectratio.z');
        })
        .then(done, done.fail);
    });
});

describe('Test gl3d relayout calls', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl should be able to adjust margins', function(done) {
        var w = 500;
        var h = 500;

        function assertMargins(t, l, b, r) {
            var div3d = document.getElementById('scene');
            expect(parseFloat(div3d.style.top)).toEqual(t, 'top');
            expect(parseFloat(div3d.style.left)).toEqual(l, 'left');
            expect(h - parseFloat(div3d.style.height) - t).toEqual(b, 'bottom');
            expect(w - parseFloat(div3d.style.width) - l).toEqual(r, 'right');
        }

        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }], {
            width: w,
            height: h
        })
        .then(function() {
            assertMargins(100, 80, 80, 80);

            return Plotly.relayout(gd, 'margin', {
                l: 0, t: 0, r: 0, b: 0
            });
        })
        .then(function() {
            assertMargins(0, 0, 0, 0);
        })
        .then(done, done.fail);
    });

    it('@gl should skip root-level axis objects', function(done) {
        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }])
        .then(function() {
            return Plotly.relayout(gd, {
                xaxis: {},
                yaxis: {},
                zaxis: {}
            });
        })
        .then(done, done.fail);
    });

    it('@gl should maintain projection type when resetCamera buttons clicked after switching projection type from perspective to orthographic', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'surface',
                x: [0, 1],
                y: [0, 1],
                z: [[0, 1], [1, 0]]
            }],
            layout: {
                width: 300,
                height: 200,
                scene: {
                    camera: {
                        eye: {
                            x: 2,
                            y: 1,
                            z: 0.5
                        }
                    }
                }
            }
        })
        .then(function() {
            expect(gd._fullLayout.scene._scene.camera._ortho).toEqual(false, 'perspective');

            return Plotly.relayout(gd, 'scene.camera.projection.type', 'orthographic');
        })
        .then(function() {
            expect(gd._fullLayout.scene._scene.camera._ortho).toEqual(true, 'orthographic');

            selectButton(gd._fullLayout._modeBar, 'resetCameraLastSave3d').click();
            expect(gd._fullLayout.scene._scene.camera._ortho).toEqual(true, 'orthographic');

            selectButton(gd._fullLayout._modeBar, 'resetCameraDefault3d').click();
            expect(gd._fullLayout.scene._scene.camera._ortho).toEqual(true, 'orthographic');
        })
        .then(done, done.fail);
    });

    it('@gl should maintain projection type when resetCamera buttons clicked after switching projection type from orthographic to perspective', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'surface',
                x: [0, 1],
                y: [0, 1],
                z: [[0, 1], [1, 0]]
            }],
            layout: {
                width: 300,
                height: 200,
                scene: {
                    camera: {
                        eye: {
                            x: 2,
                            y: 1,
                            z: 0.5
                        },
                        projection: {
                            type: 'orthographic'
                        }
                    }
                }
            }
        })
        .then(function() {
            expect(gd._fullLayout.scene._scene.camera._ortho).toEqual(true, 'orthographic');

            return Plotly.relayout(gd, 'scene.camera.projection.type', 'perspective');
        })
        .then(function() {
            expect(gd._fullLayout.scene._scene.camera._ortho).toEqual(false, 'perspective');

            selectButton(gd._fullLayout._modeBar, 'resetCameraLastSave3d').click();
            expect(gd._fullLayout.scene._scene.camera._ortho).toEqual(false, 'perspective');

            selectButton(gd._fullLayout._modeBar, 'resetCameraDefault3d').click();
            expect(gd._fullLayout.scene._scene.camera._ortho).toEqual(false, 'perspective');
        })
        .then(done, done.fail);
    });
});

describe('Test gl3d annotations', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function assertAnnotationText(expectations, msg) {
        var anns = d3SelectAll('g.annotation-text-g');

        expect(anns.size()).toBe(expectations.length, msg);

        anns.each(function(_, i) {
            var tx = d3Select(this).select('text').text();
            expect(tx).toEqual(expectations[i], msg + ' - ann ' + i);
        });
    }

    function assertAnnotationsXY(expectations, msg) {
        var TOL = 2.5;
        var anns = d3SelectAll('g.annotation-text-g');

        expect(anns.size()).toBe(expectations.length, msg);

        anns.each(function(_, i) {
            var ann = d3Select(this).select('g');
            var translate = Drawing.getTranslate(ann);

            expect(translate.x).toBeWithin(expectations[i][0], TOL, msg + ' - ann ' + i + ' x');
            expect(translate.y).toBeWithin(expectations[i][1], TOL, msg + ' - ann ' + i + ' y');
        });
    }

    // more robust (especially on CI) than update camera via mouse events
    function updateCamera(x, y, z) {
        var scene = gd._fullLayout.scene._scene;
        var camera = scene.getCamera();

        camera.eye = {x: x, y: y, z: z};
        scene.setViewport({
            camera: camera,
            aspectratio: gd._fullLayout.scene.aspectratio
        });
        // need a fairly long delay to let the camera update here
        // 300 was not robust for me (AJ), 500 seems to be.
        return delay(500)();
    }

    it('@gl should move with camera', function(done) {
        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }], {
            scene: {
                camera: {eye: {x: 2.1, y: 0.1, z: 0.9}},
                annotations: [{
                    text: 'hello',
                    x: 1, y: 1, z: 1
                }, {
                    text: 'sup?',
                    x: 1, y: 1, z: 2
                }, {
                    text: 'look!',
                    x: 2, y: 2, z: 1
                }]
            }
        })
        .then(function() {
            assertAnnotationsXY([[262, 199], [257, 135], [325, 233]], 'base 0');

            return updateCamera(1.5, 2.5, 1.5);
        })
        .then(function() {
            assertAnnotationsXY([[340, 187], [341, 142], [325, 221]], 'after camera update');

            return updateCamera(2.1, 0.1, 0.9);
        })
        .then(function() {
            assertAnnotationsXY([[262, 199], [257, 135], [325, 233]], 'base 0');
        })
        .then(done, done.fail);
    });

    it('@gl should be removed when beyond the scene axis ranges', function(done) {
        var mock = Lib.extendDeep({}, require('../../image/mocks/gl3d_annotations'));

        // replace text with something easier to identify
        mock.layout.scene.annotations.forEach(function(ann, i) { ann.text = String(i); });

        Plotly.newPlot(gd, mock).then(function() {
            assertAnnotationText(['0', '1', '2', '3', '4', '5', '6'], 'base');

            return Plotly.relayout(gd, 'scene.yaxis.range', [0.5, 1.5]);
        })
        .then(function() {
            assertAnnotationText(['1', '4', '5', '6'], 'after yaxis range relayout');

            return Plotly.relayout(gd, 'scene.yaxis.range', null);
        })
        .then(function() {
            assertAnnotationText(['0', '1', '2', '3', '4', '5', '6'], 'back to base after yaxis range relayout');

            return Plotly.relayout(gd, 'scene.zaxis.range', [0, 3]);
        })
        .then(function() {
            assertAnnotationText(['0', '4', '5', '6'], 'after zaxis range relayout');

            return Plotly.relayout(gd, 'scene.zaxis.range', null);
        })
        .then(function() {
            assertAnnotationText(['0', '1', '2', '3', '4', '5', '6'], 'back to base after zaxis range relayout');
        })
        .then(done, done.fail);
    });

    it('@gl should be able to add/remove and hide/unhide themselves via relayout', function(done) {
        var mock = Lib.extendDeep({}, require('../../image/mocks/gl3d_annotations'));

        // replace text with something easier to identify
        mock.layout.scene.annotations.forEach(function(ann, i) { ann.text = String(i); });

        var annNew = {
            x: '2017-03-01',
            y: 'C',
            z: 3,
            text: 'new!'
        };

        Plotly.newPlot(gd, mock).then(function() {
            assertAnnotationText(['0', '1', '2', '3', '4', '5', '6'], 'base');

            return Plotly.relayout(gd, 'scene.annotations[1].visible', false);
        })
        .then(function() {
            assertAnnotationText(['0', '2', '3', '4', '5', '6'], 'after [1].visible:false');

            return Plotly.relayout(gd, 'scene.annotations[1].visible', true);
        })
        .then(function() {
            assertAnnotationText(['0', '1', '2', '3', '4', '5', '6'], 'back to base (1)');

            return Plotly.relayout(gd, 'scene.annotations[0]', null);
        })
        .then(function() {
            assertAnnotationText(['1', '2', '3', '4', '5', '6'], 'after [0] null');

            return Plotly.relayout(gd, 'scene.annotations[0]', annNew);
        })
        .then(function() {
            assertAnnotationText(['new!', '1', '2', '3', '4', '5', '6'], 'after add new (1)');

            return Plotly.relayout(gd, 'scene.annotations', null);
        })
        .then(function() {
            assertAnnotationText([], 'after rm all');

            return Plotly.relayout(gd, 'scene.annotations[0]', annNew);
        })
        .then(function() {
            assertAnnotationText(['new!'], 'after add new (2)');
        })
        .then(done, done.fail);
    });

    it('@gl should work across multiple scenes', function(done) {
        function assertAnnotationCntPerScene(id, cnt) {
            expect(d3SelectAll('g.annotation-' + id).size()).toEqual(cnt);
        }

        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }, {
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [2, 1, 2],
            scene: 'scene2'
        }], {
            scene: {
                annotations: [{
                    text: 'hello',
                    x: 1, y: 1, z: 1
                }]
            },
            scene2: {
                annotations: [{
                    text: 'sup?',
                    x: 1, y: 1, z: 2
                }, {
                    text: 'look!',
                    x: 2, y: 2, z: 1
                }]
            }
        })
        .then(function() {
            assertAnnotationCntPerScene('scene', 1);
            assertAnnotationCntPerScene('scene2', 2);

            return Plotly.deleteTraces(gd, [1]);
        })
        .then(function() {
            assertAnnotationCntPerScene('scene', 1);
            assertAnnotationCntPerScene('scene2', 2);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            assertAnnotationCntPerScene('scene', 1);
            assertAnnotationCntPerScene('scene2', 2);
        })
        .then(done, done.fail);
    });

    it('@gl should contribute to scene axis autorange', function(done) {
        function assertSceneAxisRanges(xRange, yRange, zRange) {
            var sceneLayout = gd._fullLayout.scene;

            expect(sceneLayout.xaxis.range).toBeCloseToArray(xRange, 1, 'xaxis range');
            expect(sceneLayout.yaxis.range).toBeCloseToArray(yRange, 1, 'yaxis range');
            expect(sceneLayout.zaxis.range).toBeCloseToArray(zRange, 1, 'zaxis range');
        }

        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }], {
            scene: {
                annotations: [{
                    text: 'hello',
                    x: 1, y: 1, z: 3
                }]
            }
        })
        .then(function() {
            assertSceneAxisRanges([0.9375, 3.0625], [0.9375, 3.0625], [0.9375, 3.0625]);

            return Plotly.relayout(gd, 'scene.annotations[0].z', 10);
        })
        .then(function() {
            assertSceneAxisRanges([0.9375, 3.0625], [0.9375, 3.0625], [0.7187, 10.2813]);
        })
        .then(done, done.fail);
    });

    it('@gl should allow text and tail position edits under `editable: true`', function(done) {
        function editText(newText, expectation) {
            return new Promise(function(resolve) {
                gd.once('plotly_relayout', function(eventData) {
                    expect(eventData).toEqual(expectation);
                    setTimeout(resolve, 0);
                });

                var clickNode = d3Select('g.annotation-text-g').select('g').node();
                clickNode.dispatchEvent(new window.MouseEvent('click'));

                var editNode = d3Select('.plugin-editable.editable').node();
                editNode.dispatchEvent(new window.FocusEvent('focus'));

                editNode.textContent = newText;
                editNode.dispatchEvent(new window.FocusEvent('focus'));
                editNode.dispatchEvent(new window.FocusEvent('blur'));
            });
        }

        function moveArrowTail(dx, dy, expectation) {
            var px = 243;
            var py = 150;

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', function(eventData) {
                    expect(eventData).toEqual(expectation);
                    resolve();
                });

                drag({pos0: [px, py], dpos: [dx, dy], noCover: true});
            });
        }

        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }], {
            scene: {
                annotations: [{
                    text: 'hello',
                    x: 2, y: 2, z: 2,
                    font: { size: 30 }
                }]
            },
            margin: {l: 0, t: 0, r: 0, b: 0},
            width: 500,
            height: 500
        }, {
            editable: true
        })
        .then(function() {
            return editText('allo', {'scene.annotations[0].text': 'allo'});
        })
        .then(function() {
            return moveArrowTail(-100, -50, {
                'scene.annotations[0].ax': -110,
                'scene.annotations[0].ay': -80
            });
        })
        .then(done, done.fail);
    });

    it('@gl should display hover labels and trigger *plotly_clickannotation* event', function(done) {
        function dispatch(eventType) {
            var target = d3Select('g.annotation-text-g').select('g').node();
            target.dispatchEvent(new MouseEvent(eventType));
        }

        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }], {
            scene: {
                annotations: [{
                    text: 'hello',
                    x: 2, y: 2, z: 2,
                    ax: 0, ay: -100,
                    hovertext: 'HELLO',
                    hoverlabel: {
                        bgcolor: 'red',
                        font: { size: 20 }
                    }
                }]
            },
            width: 500,
            height: 500
        })
        .then(function() {
            dispatch('mouseover');
            expect(d3Select('.hovertext').size()).toEqual(1);
        })
        .then(function() {
            return new Promise(function(resolve, reject) {
                gd.once('plotly_clickannotation', function(eventData) {
                    expect(eventData.index).toEqual(0);
                    expect(eventData.subplotId).toEqual('scene');
                    resolve();
                });

                setTimeout(function() {
                    reject('plotly_clickannotation did not get called!');
                }, 100);

                dispatch('click');
            });
        })
        .then(done, done.fail);
    });
});

describe('Test removal of gl contexts', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('@gl Plots.cleanPlot should remove gl context from the graph div of a gl3d plot', function(done) {
        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [2, 1, 3],
            z: [3, 2, 1]
        }])
        .then(function() {
            expect(gd._fullLayout.scene._scene.glplot).toBeDefined();

            Plots.cleanPlot([], {}, gd._fullData, gd._fullLayout);
            expect(gd._fullLayout.scene._scene.glplot).toBe(null);
        })
        .then(done, done.fail);
    });

    it('@gl Plotly.newPlot should remove gl context from the graph div of a gl3d plot', function(done) {
        var firstGlplotObject, firstGlContext, firstCanvas;

        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [2, 1, 3],
            z: [3, 2, 1]
        }])
        .then(function() {
            firstGlplotObject = gd._fullLayout.scene._scene.glplot;
            firstGlContext = firstGlplotObject.gl;
            firstCanvas = firstGlContext.canvas;

            expect(firstGlplotObject).toBeDefined();

            return Plotly.newPlot(gd, [{
                type: 'scatter3d',
                x: [2, 1, 3],
                y: [1, 2, 3],
                z: [2, 1, 3]
            }], {});
        })
        .then(function() {
            var secondGlplotObject = gd._fullLayout.scene._scene.glplot;
            var secondGlContext = secondGlplotObject.gl;
            var secondCanvas = secondGlContext.canvas;

            expect(secondGlplotObject).not.toBe(firstGlplotObject);
            expect(firstGlplotObject.gl === null);
            expect(secondGlContext instanceof WebGLRenderingContext);
            expect(secondGlContext).not.toBe(firstGlContext);

            // The same canvas can't possibly be reassinged a new WebGL context, but let's leave room
            // for the implementation to make the context get lost and have the old canvas stick around
            // in a disused state.
            expect(
                firstCanvas.parentNode === null ||
                firstCanvas !== secondCanvas && firstGlContext.isContextLost()
            );
        })
        .then(done, done.fail);
    });

    it('@gl @noVirtualWebgl should fire *plotly_webglcontextlost* when on webgl context lost', function(done) {
        var _mock = Lib.extendDeep({}, require('../../image/mocks/gl3d_marker-arrays.json'));

        Plotly.newPlot(gd, _mock).then(function() {
            return new Promise(function(resolve, reject) {
                gd.on('plotly_webglcontextlost', resolve);
                setTimeout(reject, 10);

                var ev = new window.WebGLContextEvent('webglcontextlost');
                var canvas = gd.querySelector('div#scene > canvas');
                canvas.dispatchEvent(ev);
            });
        })
        .then(function(eventData) {
            expect((eventData || {}).event).toBeDefined();
            expect((eventData || {}).layer).toBe('scene');
        })
        .then(done, done.fail);
    });
});

describe('Test gl3d drag events', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    // Expected shape of projection-related data
    var cameraStructure = {
        projection: {type: jasmine.any(String)},
        up: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)},
        center: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)},
        eye: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)}
    };

    function makePlot(gd, mock) {
        return Plotly.newPlot(gd, mock.data, mock.layout);
    }

    function addEventCallback(graphDiv) {
        var relayoutCallback = jasmine.createSpy('relayoutCallback');
        graphDiv.on('plotly_relayout', relayoutCallback);
        return {graphDiv: graphDiv, relayoutCallback: relayoutCallback};
    }

    function verifyInteractionEffects(tuple) {
        return drag({pos0: [400, 200], posN: [320, 320], buttons: 1, noCover: true}).then(function() {
            // Check event emission count
            expect(tuple.relayoutCallback).toHaveBeenCalledTimes(1);

            // Check structure of event callback value contents
            expect(tuple.relayoutCallback).toHaveBeenCalledWith(jasmine.objectContaining({'scene.camera': cameraStructure}));

            // Check camera contents on the DIV layout
            var divCamera = tuple.graphDiv.layout.scene.camera;
            expect(divCamera).toEqual(cameraStructure);
        });
    }

    function testEvents(plot) {
        return plot.then(function(graphDiv) {
            var tuple = addEventCallback(graphDiv);
            return verifyInteractionEffects(tuple);
        });
    }

    it('@gl should respond to drag interactions with mock of unset camera', function(done) {
        testEvents(makePlot(gd, require('../../image/mocks/gl3d_scatter3d-connectgaps.json')))
            .then(done, done.fail);
    });

    it('@gl should respond to drag interactions with mock of partially set camera', function(done) {
        testEvents(makePlot(gd, require('../../image/mocks/gl3d_errorbars_zx.json')))
            .then(done, done.fail);
    });
});
