'use strict';

module.exports = {
    findParentSVG: findParentSVG,
    SVGRectToObj: SVGRectToObj
};

function findParentSVG(node) {
    var parentNode = node.parentNode;

    if (parentNode.tagName === 'svg') {
        return parentNode;
    } else {
        return findParentSVG(parentNode);
    }
}

function SVGRectToObj(svgrect) {
    var obj = {};
    obj.x = svgrect.x;
    obj.y = svgrect.y;
    obj.width = svgrect.width;
    obj.height = svgrect.height;
    return obj;
}