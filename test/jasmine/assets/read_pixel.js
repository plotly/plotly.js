'use strict';

module.exports = function(canvas, x, y) {
    if(!canvas) return null;

    var gl = canvas.getContext('webgl');

    var pixels = new Uint8Array(4);

    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    return pixels;
};
