// Pixelated image rendering
// The actual CSS declaration is prepended with fallbacks for older browsers.
// NB. IE's `-ms-interpolation-mode` works only with <img> not with SVG <image>
// https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering
// https://caniuse.com/?search=image-rendering
// http://phrogz.net/tmp/canvas_image_zoom.html

export const CSS_DECLARATIONS = [
    ['image-rendering', 'optimizeSpeed'],
    ['image-rendering', '-moz-crisp-edges'],
    ['image-rendering', '-o-crisp-edges'],
    ['image-rendering', '-webkit-optimize-contrast'],
    ['image-rendering', 'optimize-contrast'],
    ['image-rendering', 'crisp-edges'],
    ['image-rendering', 'pixelated']
] as const satisfies [string, string][];

export const STYLE = CSS_DECLARATIONS.map((d) => d.join(': ') + '; ').join('');
