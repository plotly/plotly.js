'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    calc: require('./calc'),
    plot: require('./plot'),

    moduleType: 'trace',
    name: 'table',
    basePlotModule: require('./base_plot'),
    categories: ['noOpacity'],
    meta: {
        description: [
            'Table view for detailed data viewing.',
            'The data are arranged in a grid of rows and columns.',
            'Most styling can be specified for columns, rows or individual cells.',
            'Table is using a column-major order, ie. the grid is represented as a vector of column vectors.'
        ].join(' ')
    }
};
