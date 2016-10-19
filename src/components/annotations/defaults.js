/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var handleAnnotationDefaults = require('./annotation_defaults');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {
    var containerIn = layoutIn.annotations || [],
        containerOut = layoutOut.annotations = [];

    for(var i = 0; i < containerIn.length; i++) {
        var annIn = containerIn[i] || {},
            annOut = handleAnnotationDefaults(annIn, layoutOut);

        containerOut.push(annOut);
    }
};
