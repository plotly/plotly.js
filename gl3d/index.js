'use strict'

var createPlot          = require('gl-plot3d'),
    Gl3dLayout          = require('./defaults/gl3dlayout'),
    Gl3dAxes            = require('./defaults/gl3daxes'),
    Scatter3D           = require('./defaults/scatter3d'),
    createAxesOptions   = require('./convert/axes'),
    createSpikeOptions  = require('./convert/spikes'),
    computeTickMarks    = require('./lib/tick-marks');
    /*Surface = require('./modules/surface');*/

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

    this.scene      = createPlot({
        container:  options.container,
        glOptions:  glOptions,
        axes:       this.axesOptions,
        spikes:     this.spikeOptions,
        pickRadius: 10
    })

    this.scene.onrender = render.bind(null, this)
}

var proto = Scene.prototype

proto.plot = function(sceneData, sceneLayout) {
    console.log('called plot', sceneData, sceneLayout);

    //Apply changes to scene layout
    this.sceneLayout = sceneLayout;
    this.axesOptions.merge(sceneLayout);
    this.spikeOptions.merge(sceneLayout);
    this.scene.update({})

    //Add trace
    //TODO
}

function createScene(options) {
    options = options || {};
    
    //Create scene
    return new Scene(options)
}


exports.modules = [
    {module: Gl3dAxes,   namespace: 'Gl3dAxes'},
    {module: Gl3dLayout, namespace: 'Gl3dLayout'},
    {module: Scatter3D,  namespace: 'Scatter3D'}
    /*
    {module: Surface,    namespace: 'Surface'}
    */
];

exports.createScene = createScene