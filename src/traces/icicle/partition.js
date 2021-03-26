'use strict';

var d3Hierarchy = require('d3-hierarchy');

module.exports = function partition(entry, size, opts) {
    var flipX = opts.flipX;
    var flipY = opts.flipY;
    var swapXY = opts.orientation === 'h';
    var maxDepth = opts.maxDepth;

    var newWidth = (entry.height + 1) * size[0] / Math.min(entry.height+1, maxDepth);

    var result = d3Hierarchy
        .partition()
        .padding(opts.pad.inner)
        .size(
            swapXY ? [size[1], newWidth] : size
        )(entry);

    if(swapXY || flipX || flipY) {
        flipTree(result, size, {
            swapXY: swapXY,
            flipX: flipX,
            flipY: flipY
        });
    }
    return result;
};

function flipTree(node, size, opts) {
    var tmp;

    if(opts.swapXY) {
        // swap x0 and y0
        tmp = node.x0;
        node.x0 = node.y0;
        node.y0 = tmp;

        // swap x1 and y1
        tmp = node.x1;
        node.x1 = node.y1;
        node.y1 = tmp;
    }

    if(opts.flipX) {
        tmp = node.x0;
        node.x0 = size[0] - node.x1;
        node.x1 = size[0] - tmp;
    }

    if(opts.flipY) {
        tmp = node.y0;
        node.y0 = size[1] - node.y1;
        node.y1 = size[1] - tmp;
    }

    var children = node.children;
    if(children) {
        for(var i = 0; i < children.length; i++) {
            flipTree(children[i], size, opts);
        }
    }
}
