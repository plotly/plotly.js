/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var ContourGl = {};

ContourGl.attributes = require('../contour/attributes');
ContourGl.supplyDefaults = require('../contour/defaults');
ContourGl.colorbar = require('../contour/colorbar');

ContourGl.calc = require('../contour/calc');
ContourGl.plot = require('./convert');

ContourGl.moduleType = 'trace';
ContourGl.name = 'contourgl';
ContourGl.basePlotModule = require('../../plots/gl2d');
ContourGl.categories = ['gl2d', '2dMap'];
ContourGl.meta = {
    description: [
        'WebGL contour (beta)'
    ].join(' ')
};

module.exports = ContourGl;
