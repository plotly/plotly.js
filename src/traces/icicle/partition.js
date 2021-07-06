'use strict';

var d3Hierarchy = require('d3-hierarchy');
var flipTree = require('../treemap/flip_tree');

module.exports = function partition(entry, size, opts) {
    var flipX = opts.flipX;
    var flipY = opts.flipY;
    var swapXY = opts.orientation === 'h';
    var maxDepth = opts.maxDepth;

    var newWidth = size[0];
    var newHeight = size[1];
    if(maxDepth) {
        newWidth = (entry.height + 1) * size[0] / Math.min(entry.height + 1, maxDepth);
        newHeight = (entry.height + 1) * size[1] / Math.min(entry.height + 1, maxDepth);
    }

    var result = d3Hierarchy
        .partition()
        .padding(opts.pad.inner)
        .size(
            swapXY ? [size[1], newWidth] : [size[0], newHeight]
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
