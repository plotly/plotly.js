/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3Hierarchy = require('d3-hierarchy');

module.exports = function partition(entry, size, opts) {
    var flipX = opts.mirrorX;
    var flipY = opts.mirrorY;
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
    var method;
    switch(key) {
        case 'squarify':
            method = d3Hierarchy.treemapSquarify.ratio(squarifyratio);
            break;
        case 'binary':
            method = d3Hierarchy.treemapBinary;
            break;
        case 'dice':
            method = d3Hierarchy.treemapDice;
            break;
        case 'slice':
            method = d3Hierarchy.treemapSlice;
            break;
        default: // i.e. 'slice-dice' | 'dice-slice'
            method = d3Hierarchy.treemapSliceDice;
    }

    return method;
}

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
