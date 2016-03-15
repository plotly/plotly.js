'use strict';

var d3 = require('d3');


// In-house implementation of SVG getBBox that takes clip paths into account
module.exports = function getBBox(element) {
    var elementBBox = element.getBBox();

    var s = d3.select(element);
    var clipPathAttr = s.attr('clip-path');

    if(!clipPathAttr) return elementBBox;

    // only supports 'url(#<id>)' at the moment
    var clipPathId = clipPathAttr.substring(5, clipPathAttr.length-1);
    var clipPath = d3.select('#' + clipPathId).node();

    return minBBox(elementBBox, clipPath.getBBox());
};

function minBBox(bbox1, bbox2) {
    var keys = ['x', 'y', 'width', 'height'];
    var out = {};

    function min(attr) {
        return Math.min(bbox1[attr], bbox2[attr]);
    }

    keys.forEach(function(key) {
        out[key] = min(key);
    });

    return out;
}
