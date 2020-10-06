'use strict';

var SVGTools = require('./svg_tools');

/**
 * Get the bounding box in screen coordinates of an SVG element.
 *
 * @param {elem} SVG element's node.
 */
module.exports = getSVGElemScreenBBox;

// Get the screen coordinates of an SVG Element's bounding box
// Based off of this:
// https://stackoverflow.com/questions/26049488/how-to-get-absolute-coordinates-of-object-inside-a-g-group
function getSVGElemScreenBBox(elem) {
    var svg = SVGTools.findParentSVG(elem);
    var rect = svg.createSVGRect();
    var pt = svg.createSVGPoint();
    var ctm = elem.getScreenCTM();
    var bbox = elem.getBBox();
    pt.x = bbox.x;
    pt.y = bbox.y;
    rect.width = bbox.width;
    rect.height = bbox.height;
    pt = pt.matrixTransform(ctm);
    rect.x = pt.x;
    rect.y = pt.y;
    return rect;
}
