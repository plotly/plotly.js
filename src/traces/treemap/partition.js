'use strict';

var d3Hierarchy = require('d3-hierarchy');
var flipTree = require('./flip_tree');

module.exports = function partition(entry, size, opts) {
    var flipX = opts.flipX;
    var flipY = opts.flipY;
    var swapXY = opts.packing === 'dice-slice';

    var top = opts.pad[flipY ? 'bottom' : 'top'];
    var left = opts.pad[flipX ? 'right' : 'left'];
    var right = opts.pad[flipX ? 'left' : 'right'];
    var bottom = opts.pad[flipY ? 'top' : 'bottom'];

    var tmp;
    if(swapXY) {
        tmp = left;
        left = top;
        top = tmp;

        tmp = right;
        right = bottom;
        bottom = tmp;
    }

    var result = d3Hierarchy
        .treemap()
        .tile(getTilingMethod(opts.packing, opts.squarifyratio))
        .paddingInner(opts.pad.inner)
        .paddingLeft(left)
        .paddingRight(right)
        .paddingTop(top)
        .paddingBottom(bottom)
        .size(
            swapXY ? [size[1], size[0]] : size
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

function getTilingMethod(key, squarifyratio) {
    switch(key) {
        case 'squarify':
            return d3Hierarchy.treemapSquarify.ratio(squarifyratio);
        case 'binary':
            return d3Hierarchy.treemapBinary;
        case 'dice':
            return d3Hierarchy.treemapDice;
        case 'slice':
            return d3Hierarchy.treemapSlice;
        default: // i.e. 'slice-dice' | 'dice-slice'
            return d3Hierarchy.treemapSliceDice;
    }
}
