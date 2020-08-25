'use strict';

module.exports = {
    findParentSVG: findParentSVG
};

function findParentSVG(node) {
    var parentNode = node.parentNode;

    if(parentNode.tagName === 'svg') {
        return parentNode;
    } else {
        return findParentSVG(parentNode);
    }
}
