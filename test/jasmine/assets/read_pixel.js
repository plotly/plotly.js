'use strict';

module.exports = function(canvas, x, y, w, h) {
    if(!canvas) return null;

    if (!w) w = 1;
    if (!h) h = 1;

    var gl = canvas.getContext('webgl');

    var pixels = new Uint8Array(4 * w * h);

    gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    return pixels;
};
