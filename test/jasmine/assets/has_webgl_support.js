'use strict';


module.exports = function hasWebGLSupport(testName) {
    var gl, canvas;

    try {
        canvas = document.createElement('canvas');
        gl = canvas.getContext('webgl');
    }
    catch(err) {
        gl = null;
    }

    var hasSupport = !!gl;

    if(!hasSupport) {
        console.warn('Cannot get WebGL context. Skip test *' + testName + '*');
    }

    return hasSupport;
};
