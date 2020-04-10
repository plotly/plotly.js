'use strict';


var xmlns = 'http://www.w3.org/2000/xmlns/';
var svg = 'http://www.w3.org/2000/svg';
var xlink = 'http://www.w3.org/1999/xlink';

exports.xmlns = xmlns;
exports.svg = svg;
exports.xlink = xlink;


// the 'old' d3 quirk got fix in v3.5.7
// https://github.com/mbostock/d3/commit/a6f66e9dd37f764403fc7c1f26be09ab4af24fed
exports.svgAttrs = {
    xmlns: svg,
    'xmlns:xlink': xlink
};
