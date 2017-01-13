/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var pointcloud = {};

pointcloud.attributes = require('./attributes');
pointcloud.supplyDefaults = require('./defaults');

// reuse the Scatter3D 'dummy' calc step so that legends know what to do
pointcloud.calc = require('../scatter3d/calc');
pointcloud.plot = require('./convert');

pointcloud.moduleType = 'trace';
pointcloud.name = 'pointcloud';
pointcloud.basePlotModule = require('../../plots/gl2d');
pointcloud.categories = ['gl2d', 'showLegend'];
pointcloud.meta = {
    description: [
        'The data visualized as a point cloud set in `x` and `y`',
        'using the WebGl plotting engine.'
    ].join(' ')
};

module.exports = pointcloud;
