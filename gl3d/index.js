'use strict'

var Gl3dLayout = require('./modules/gl3dlayout'),
    Gl3dAxes = require('./modules/gl3daxes'),
    Scatter3D = require('./modules/scatter3d'),
    createPlot = require('gl-plot3d')
    /*Surface = require('./modules/surface');*/

function Scene(options) {
  console.log('scene ctor')

  options.element = options.container
  this.scene      = createPlot(options)
}

var proto = Scene.prototype

proto.plot = function() {
    console.log('called plot');
}

function createScene(options) {

    console.log('created scene');

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