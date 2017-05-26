var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var selectButton = require('../assets/modebar_button');
var customMatchers = require('../assets/custom_matchers');

var MODEBAR_DELAY = 500;


describe('Test gl plot events', function() {
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

    // put callback in the event queue
    function delay(done) {
        setTimeout(done, 0);
    }

    describe('gl3d modebar click handlers', function() {
        var modeBar, relayoutCallback;

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

                relayoutCallback = jasmine.createSpy('relayoutCallback');

                gd.on('plotly_relayout', relayoutCallback);

                delay(done);
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

                    expect(relayoutCallback).toHaveBeenCalled(); // initiator: resetCameraDefault3d
                    expect(relayoutCallback).toHaveBeenCalledWith([
                        [1.25, 1.25, 1.25],
                        [0, 0, 0],
                        [0, 0, 1]
                    ]);

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

                        expect(relayoutCallback).toHaveBeenCalled(); // initiator: resetCameraLastSave3d
                        expect(relayoutCallback).toHaveBeenCalledWith([
                            [1.25, 1.25, 1.25],
                            [0, 0, 0],
                            [0, 0, 1]
                        ]); // looks like there's no real saved data so it reverts to default

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
    });
});
