'use strict';

var Scene = require('./scene.js'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Gl3dLayout = require('./gl3dlayout'),
    Gl3dAxes = require('./gl3daxes'),
    Scatter3D = require('./scatter3d'),
    Surface = require('./surface');

function SceneFrame () {
    this.ID = 0;

    this.modules = [
        {module: Gl3dAxes,   namespace: 'Gl3dAxes'},
        {module: Gl3dLayout, namespace: 'Gl3dLayout'},
        {module: Scatter3D,  namespace: 'Scatter3D'},
        {module: Surface,    namespace: 'Surface'}
    ];
}

util.inherits(SceneFrame, EventEmitter);

module.exports = new SceneFrame();

var proto = SceneFrame.prototype;

proto.createScene = function (opts) {
    opts = opts || {};
    var container = opts.container || document.body;
    var newIframe = document.createElement('iframe');
    var glOptions = opts.glOptions || {};
    var _this = this;
    newIframe.width = opts.width || '100%';
    newIframe.height = opts.height || '100%';
    newIframe.style.zIndex = '' + (opts.zIndex || '1000');
    newIframe.frameBorder = '0';
    newIframe.src = opts.baseurl + '/glcontext.html';

    newIframe.id = opts.id || ('scene-'+ this.ID);
    this.ID++;

    container.appendChild(newIframe);

    newIframe.onload = function () {

    //Create canvas
    var canvas = document.createElement('canvas');

    //Try initializing WebGL
    var gl = canvas.getContext('webgl', glOptions) ||
             canvas.getContext('experimental-webgl', glOptions);

        if(gl){

            var shell = newIframe.contentWindow.glnow({
                clearFlags: 0,
                glOptions: glOptions,
                tickRate: 3
            });

            // contain all events within the iframe, necessary to
            // contain zoom events to prevent parent window scrolling.
            shell.preventDefaults = true;
            shell.stopPropagation = true;

            // Once the shell has initialized create and pass a new scene to the user.
            // set the container of the shell to be the new iframe
            shell.once('gl-init', function () {
                opts.container = newIframe;
                var scene = new Scene(opts, shell);
            });

        }else{
            opts.container = newIframe;
            var scene = new Scene(opts, null);
            newIframe.contentDocument.getElementById('no3D').style.display= 'block';
            _this.emit('scene-error', scene);
        }

    canvas = null;
    gl = null;

    };
};
