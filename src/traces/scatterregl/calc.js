/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var calcScatter = require('../scatter/calc')
var kdtree = require('kdgrass')

module.exports = function calc(gd, trace) {
    var cd = calcScatter(gd, trace)

    //TODO: delegate this to webworker if possible

    //FIXME: bench if it is faster than mapping to kdbush
    var positions = Array(cd.length*2)
    for (var i = 0, j = 0; i < positions.length; i+=2, j++) {
        positions[i] = cd[j].x
        positions[i+1] = cd[j].y
    }

    var tree = kdtree(positions, 512)

    //FIXME: make sure it is a good place to store the tree
    trace._tree = tree

    return cd;
};
