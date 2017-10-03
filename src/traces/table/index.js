/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Table = {};

Table.attributes = require('./attributes');
Table.supplyDefaults = require('./defaults');
Table.calc = require('./calc');
Table.plot = require('./plot');

Table.moduleType = 'trace';
Table.name = 'table';
Table.basePlotModule = require('./base_plot');
Table.categories = [];
Table.meta = {
    description: [
        'Table view for detailed data viewing.',
        'The data are arranged in a grid of rows and columns.',
        'Most styling can be specified for columns, rows or individual cells.',
        'Table is using a column-major order, ie. the grid is represented as a vector of column vectors.'
    ].join(' ')
};

module.exports = Table;
