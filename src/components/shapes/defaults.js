/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var handleArrayContainerDefaults = require('../../plots/array_container_defaults');
var handleShapeDefaults = require('./shape_defaults');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {
    var opts = {
        name: 'shapes',
        handleItemDefaults: handleShapeDefaults
    };

    handleArrayContainerDefaults(layoutIn, layoutOut, opts);
};
