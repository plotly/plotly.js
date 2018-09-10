/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plot = {};

Plot.attributes = require('./attributes');
Plot.supplyDefaults = require('./defaults');
Plot.calc = require('./calc');
Plot.plot = require('./plot');

Plot.moduleType = 'trace';
Plot.name = 'sankey';
Plot.basePlotModule = require('./base_plot');
Plot.categories = ['noOpacity'];
Plot.meta = {
    description: [
        'Sankey plots for network flow data analysis.',
        'The nodes are specified in `nodes` and the links between sources and targets in `links`.',
        'The colors are set in `nodes[i].color` and `links[i].color`; otherwise defaults are used.'
    ].join(' ')
};

module.exports = Plot;
