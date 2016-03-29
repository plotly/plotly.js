'use strict';


/**
 * Get the screen coordinates of the center of
 * an SVG rectangle node.
 *
 * @param {rect} rect svg <rect> node
 */
module.exports = function getRectCenter(rect) {
    var corners = getRectScreenCoords(rect);

    return [
        corners.nw.x + (corners.ne.x - corners.nw.x) / 2,
        corners.ne.y + (corners.se.y - corners.ne.y) / 2
    ];
};

// Taken from: http://stackoverflow.com/a/5835212/4068492
function getRectScreenCoords(rect) {
    var svg = findParentSVG(rect);
    var pt = svg.createSVGPoint();
    var corners = {};
    var matrix = rect.getScreenCTM();

    pt.x = rect.x.animVal.value;
    pt.y = rect.y.animVal.value;
    corners.nw = pt.matrixTransform(matrix);
    pt.x += rect.width.animVal.value;
    corners.ne = pt.matrixTransform(matrix);
    pt.y += rect.height.animVal.value;
    corners.se = pt.matrixTransform(matrix);
    pt.x -= rect.width.animVal.value;
    corners.sw = pt.matrixTransform(matrix);

    return corners;
}

function findParentSVG(node) {
    var parentNode = node.parentNode;

    if(parentNode.tagName === 'svg') {
        return parentNode;
    }
    else {
        return findParentSVG(parentNode);
    }
}
