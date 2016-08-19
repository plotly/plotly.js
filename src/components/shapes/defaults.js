/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var handleShapeDefaults = require('./shape_defaults');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {
    var containerIn = layoutIn.shapes || [],
        containerOut = layoutOut.shapes = [];

    for(var i = 0; i < containerIn.length; i++) {
        var shapeIn = containerIn[i] || {},
            shapeOut = handleShapeDefaults(shapeIn, layoutOut);

        containerOut.push(shapeOut);
    }
};
