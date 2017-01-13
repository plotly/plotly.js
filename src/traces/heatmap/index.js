/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Heatmap = {};

Heatmap.attributes = require('./attributes');
Heatmap.supplyDefaults = require('./defaults');
Heatmap.calc = require('./calc');
Heatmap.plot = require('./plot');
Heatmap.colorbar = require('./colorbar');
Heatmap.style = require('./style');
Heatmap.hoverPoints = require('./hover');

Heatmap.moduleType = 'trace';
Heatmap.name = 'heatmap';
Heatmap.basePlotModule = require('../../plots/cartesian');
Heatmap.categories = ['cartesian', '2dMap'];
Heatmap.meta = {
    description: [
        'The data that describes the heatmap value-to-color mapping',
        'is set in `z`.',
        'Data in `z` can either be a {2D array} of values (ragged or not)',
        'or a 1D array of values.',

        'In the case where `z` is a {2D array},',
        'say that `z` has N rows and M columns.',
        'Then, by default, the resulting heatmap will have N partitions along',
        'the y axis and M partitions along the x axis.',
        'In other words, the i-th row/ j-th column cell in `z`',
        'is mapped to the i-th partition of the y axis',
        '(starting from the bottom of the plot) and the j-th partition',
        'of the x-axis (starting from the left of the plot).',
        'This behavior can be flipped by using `transpose`.',
        'Moreover, `x` (`y`) can be provided with M or M+1 (N or N+1) elements.',
        'If M (N), then the coordinates correspond to the center of the',
        'heatmap cells and the cells have equal width.',
        'If M+1 (N+1), then the coordinates correspond to the edges of the',
        'heatmap cells.',

        'In the case where `z` is a 1D {array}, the x and y coordinates must be',
        'provided in `x` and `y` respectively to form data triplets.'
    ].join(' ')
};

module.exports = Heatmap;
