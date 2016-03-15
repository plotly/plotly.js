'use strict';

var d3 = require('d3');

var ATTRS = ['x', 'y', 'width', 'height'];


// In-house implementation of SVG getBBox that takes clip paths into account
module.exports = function getBBox(element) {
    var elementBBox = element.getBBox();

    var s = d3.select(element);
    var clipPathAttr = s.attr('clip-path');

    if(!clipPathAttr) return elementBBox;

    // only supports 'url(#<id>)' at the moment
    var clipPathId = clipPathAttr.substring(5, clipPathAttr.length-1);
    var clipBBox = getClipBBox(clipPathId);

    return minBBox(elementBBox, clipBBox);
};

function getClipBBox(clipPathId) {
    var clipPath = d3.select('#' + clipPathId);
    var clipBBox;

    try {
        // this line throws an error in FF (38 and 45 at least)
        clipBBox = clipPath.node().getBBox();
    }
    catch(e) {
        // use DOM attributes as fallback
        var path = d3.select(clipPath.node().firstChild);

        clipBBox = {};

        ATTRS.forEach(function(attr) {
            clipBBox[attr] = path.attr(attr);
        });
    }

    return clipBBox;
}

function minBBox(bbox1, bbox2) {
    var out = {};

    function min(attr) {
        return Math.min(bbox1[attr], bbox2[attr]);
    }

    ATTRS.forEach(function(attr) {
        out[attr] = min(attr);
    });

    return out;
}
