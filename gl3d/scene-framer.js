var Scene = require('./scene.js'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Gl3dLayout = require('./gl3dlayout'),
    Gl3dAxes = require('./gl3daxes'),
    Scatter3D = require('./scatter3d'),
    Surface = require('./surface');

function SceneFrame () {
    'use strict';
    this.ID = 0;

    this.modules = [Gl3dAxes, Gl3dLayout, Scatter3D, Surface];

}

util.inherits(SceneFrame, EventEmitter);

module.exports = new SceneFrame();

var proto = SceneFrame.prototype;

proto.createScene = function (opts) {
    'use strict';
    opts = opts || {};
    var container = opts.container || document.body;
    var newIframe = document.createElement('iframe');
    var glOptions = opts.glOptions || {};
    var _this = this;
    newIframe.width = opts.width || '100%';
    newIframe.height = opts.height || '100%';
    newIframe.style.zIndex = '' + (opts.zIndex || '1000');
    newIframe.frameBorder = '0';
    newIframe.src = ENV.BASE_URL + '/glcontext.html';

    newIframe.id = opts.id || ('scene-'+ this.ID);
    this.ID++;

    container.appendChild(newIframe);

    newIframe.onload = function () {
        var shell = newIframe.contentWindow.glnow({
            clearColor: [0,0,0,0],
            glOptions: glOptions,
            tickRate: 3
        });
        // Once the shell has initialized create and pass a new scene to the user.
        // set the container of the shell to be the new iframe
        shell.on('gl-init', function () {
            opts.container = newIframe;
            var scene = new Scene(opts, shell);

            _this.emit('scene-loaded', scene);
        });

    };
};
