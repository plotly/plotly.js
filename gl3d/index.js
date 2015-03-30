'use strict'

//TODO: Error handling (context creation failure)
//TODO: Scatter plots
//TODO: Surface plots
//TODO: Units for labels (use pixels)
//TODO: Fix camera (default to turntable)
//TODO: Add camera buttons

var createPlot          = require('gl-plot3d'),
    Gl3dLayout          = require('./defaults/gl3dlayout'),
    Gl3dAxes            = require('./defaults/gl3daxes'),
    Scatter3D           = require('./defaults/scatter3d'),
    Surface             = require('./defaults/surface'),
    createAxesOptions   = require('./convert/axes'),
    createSpikeOptions  = require('./convert/spikes'),
    createScatterTrace  = require('./convert/scatter'),
    createSurfaceTrace  = require('./convert/surface'),
    computeTickMarks    = require('./lib/tick-marks');
    
function render(scene) {
    //Recompute tick markers
    computeTickMarks(scene);
    scene.scene.axes.update(scene.axesOptions);
}

function Scene(options) {
    var glOptions = options.glOptions
    glOptions.premultipliedAlpha = true

    this.Plotly       = options.Plotly
    this.sceneLayout  = options.sceneLayout

    this.axesOptions  = createAxesOptions(options.sceneLayout)
    this.spikeOptions = createSpikeOptions(options.sceneLayout)

    this.container    = options.container

    this.scene        = createPlot({
        container:  options.container,
        glOptions:  glOptions,
        axes:       this.axesOptions,
        spikes:     this.spikeOptions,
        pickRadius: 10
    })

    this.scene.onrender = render.bind(null, this)

    //List of scene objects
    this.traces = {};
}

var proto = Scene.prototype

proto.plot = function(sceneData, sceneLayout) {
    //Update layout
    this.sceneLayout = sceneLayout;
    this.axesOptions.merge(sceneLayout);
    this.spikeOptions.merge(sceneLayout);
    this.scene.update({});

    //Update traces
    if(sceneData) {
        if(!Array.isArray(sceneData)) {
            sceneData = [sceneData]
        }
        for(var i=0; i<sceneData.length; ++i) {
            var data = sceneData[i];
            var trace = this.traces[data.uid];
            if(trace) {
                trace.update(data);
            } else {
                switch(data.type) {
                    case 'scatter3d':
                        trace = createScatterTrace(this, data);
                    break;

                    case 'surface':
                        trace = createSurfaceTrace(this, data);
                    break;

                    default:
                }
                this.traces[data.uid] = trace;
            }
        }
    }
}

proto.destroy = function() {
    this.scene.dispose();
    this.container.parentNode.removeChild(this.container);
}

function createScene(options) {
    options = options || {};
    
    //Create scene
    return new Scene(options)
}


exports.modules = [
    {module: Gl3dAxes,   namespace: 'Gl3dAxes'},
    {module: Gl3dLayout, namespace: 'Gl3dLayout'},
    {module: Scatter3D,  namespace: 'Scatter3D'},
    {module: Surface,    namespace: 'Surface'}
];

exports.createScene = createScene