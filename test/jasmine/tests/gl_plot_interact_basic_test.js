'use strict';

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

function teardown(gd, done) {

    // The teardown function needs information of what to tear down so afterEach can not be used without global vars.
    // In addition to removing the plot from the DOM it also destroy possibly present 2D or 3D scenes

    // TODO we should figure out something to only rely on public API calls
    // In other words, how can users themselves properly destroy the plot through the API?
    // This function is left in this file until the above todo is looked into.
    var fullLayout = gd._fullLayout;

    Plots.getSubplotIds(fullLayout, 'gl3d').forEach(function(sceneId) {
        var scene = fullLayout[sceneId]._scene;
        if(scene.glplot) scene.destroy();
    });

    Plots.getSubplotIds(fullLayout, 'gl2d').forEach(function(sceneId) {
        var scene2d = fullLayout._plots[sceneId]._scene2d;
        if(scene2d.glplot) {
            scene2d.stopped = true;
            scene2d.destroy();
        }
    });

    destroyGraphDiv();

    // A test case can only be called 'done' when the above destroy methods had been performed.
    // One way of helping ensure that the destroys are not forgotten is that done() is part of
    // the teardown, consequently if a test case omits the teardown by accident, the test will
    // visibly hang. If the teardown receives no proper arguments, it'll also visibly fail.
    done();
}

describe('Test gl plot interactions', function() {

    describe('gl3d plots', function() {

        // Expected shape of projection-related data
        var cameraStructure = {
            up: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)},
            center: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)},
            eye: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)}
        };

        function makePlot(mock) {
            return Plotly.plot(createGraphDiv(), mock.data, mock.layout);
        }

        function addEventCallback(graphDiv) {
            var relayoutCallback = jasmine.createSpy('relayoutCallback');
            graphDiv.on('plotly_relayout', relayoutCallback);
            return {graphDiv: graphDiv, relayoutCallback: relayoutCallback};
        }

        function verifyInteractionEffects(tuple) {

            // One 'drag': simulating fairly thoroughly as the mouseup event is also needed here
            mouseEvent('mousemove', 400, 200);
            mouseEvent('mousedown', 400, 200);
            mouseEvent('mousemove', 320, 320, {buttons: 1});
            mouseEvent('mouseup', 320, 320);

            // Check event emission count
            expect(tuple.relayoutCallback).toHaveBeenCalledTimes(1);

            // Check structure of event callback value contents
            expect(tuple.relayoutCallback).toHaveBeenCalledWith(jasmine.objectContaining({scene: cameraStructure}));

            // Check camera contents on the DIV layout
            var divCamera = tuple.graphDiv.layout.scene.camera;

            expect(divCamera).toEqual(cameraStructure);

            return tuple.graphDiv;
        }

        function testEvents(plot, done) {
            plot.then(function(graphDiv) {
                var tuple = addEventCallback(graphDiv); // TODO disuse tuple with ES6
                verifyInteractionEffects(tuple);
                teardown(graphDiv, done);
            });
        }

        it('should respond to drag interactions with mock of unset camera', function(done) {
            testEvents(makePlot(require('@mocks/gl3d_scatter3d-connectgaps.json')), done);
        });

        it('should respond to drag interactions with mock of partially set camera', function(done) {
            testEvents(makePlot(require('@mocks/gl3d_errorbars_zx.json')), done);
        });
    });
});
