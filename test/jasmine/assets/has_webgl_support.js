'use strict';

var getContext = require('webgl-context');

module.exports = function hasWebGLSupport(testName) {
    var gl, canvas;

    canvas = document.createElement('canvas');
    gl = getContext({canvas: canvas});

    var hasSupport = !!gl;

    if(!hasSupport) {
        console.warn('Cannot get WebGL context. Skip test *' + testName + '*');
    }

    return hasSupport;
};
