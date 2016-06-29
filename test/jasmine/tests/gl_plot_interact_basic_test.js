'use strict';

var Plotly = require('@lib/index');
var mouseEvent = require('../assets/mouse_event');

// Test utilities
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

// Expected shape of projection-related data
var cameraStructure = {
    up: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)},
    center: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)},
    eye: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)}
};

function makePlot(gd, mock) {
    return Plotly.plot(gd, mock.data, mock.layout);
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

function testEvents(plot) {
    return plot
        .then(function(graphDiv) {
            var tuple = addEventCallback(graphDiv); // TODO disuse tuple with ES6
            verifyInteractionEffects(tuple);
        });
}

describe('gl3d plots', function() {

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {return
        Plotly.purge(gd);
        destroyGraphDiv();
    });


    fit('streamtubes', function(done) {

        //var mock = require('@mocks/gl3d_errorbars_sqrt.json')
        //var mock = require('@mocks/gl3d_scatter3d-with-delaunay.json')
         var mock = require('@mocks/gl3d_streamtubes_basic.json')
        //var mock = require('@mocks/gl3d_projection-traces.json')


        var data = mock.data
        var s = data[0]

        var layout = mock.layout

        window.gd = gd
        window.data = data
        window.s = s
        window.Plotly = Plotly

        Plotly.plot(gd, data, layout)
            .then(done);
    });

});
