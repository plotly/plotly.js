'use strict';

var Scene = require('./scene.js'),
    Gl3dLayout = require('./gl3dlayout'),
    Gl3dAxes = require('./gl3daxes'),
    Scatter3D = require('./scatter3d'),
    Surface = require('./surface');

function SceneFrame () {
    this.modules = [
        {module: Gl3dAxes,   namespace: 'Gl3dAxes'},
        {module: Gl3dLayout, namespace: 'Gl3dLayout'},
        {module: Scatter3D,  namespace: 'Scatter3D'},
        {module: Surface,    namespace: 'Surface'}
    ];
}

module.exports = new SceneFrame();

var proto = SceneFrame.prototype;

proto.createScene = function (options) {
    var container = options.container || document.body;

    // Make iframe dom element (the onload callback is in Scene)
    function makeIframe(options) {
        var newIframe = document.createElement('iframe');
        newIframe.width = options.width || '100%';
        newIframe.height = options.height || '100%';
        newIframe.style.zIndex = '1000';
        newIframe.frameBorder = '0';
        newIframe.src = options.baseurl + '/glcontext.html';
        newIframe.id = options.sceneKey;
        return newIframe;
    }

    var newIframe = makeIframe(options);
    container.appendChild(newIframe);    // append svg container

    var sceneOptions = options;
    sceneOptions.container = newIframe;  // the iframe is the scene container

    return new Scene(sceneOptions);
};
