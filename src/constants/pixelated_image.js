'use strict';

// Pixelated image rendering
// The actual CSS declaration is prepended with fallbacks for older browsers.
// NB. IE's `-ms-interpolation-mode` works only with <img> not with SVG <image>
// https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering
// https://caniuse.com/?search=image-rendering
// http://phrogz.net/tmp/canvas_image_zoom.html

exports.CSS_DECLARATIONS = [
    ['image-rendering', 'optimizeSpeed'],
    ['image-rendering', '-moz-crisp-edges'],
    ['image-rendering', '-o-crisp-edges'],
    ['image-rendering', '-webkit-optimize-contrast'],
    ['image-rendering', 'optimize-contrast'],
    ['image-rendering', 'crisp-edges'],
    ['image-rendering', 'pixelated']
];

exports.STYLE = exports.CSS_DECLARATIONS.map(function(d) {
    return d.join(': ') + '; ';
}).join('');
