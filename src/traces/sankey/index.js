'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    calc: require('./calc'),
    plot: require('./plot'),

    moduleType: 'trace',
    name: 'sankey',
    basePlotModule: require('./base_plot'),
    selectPoints: require('./select.js'),
    categories: ['noOpacity'],
    meta: {
        description: [
            'Sankey plots for network flow data analysis.',
            'The nodes are specified in `nodes` and the links between sources and targets in `links`.',
            'The colors are set in `nodes[i].color` and `links[i].color`, otherwise defaults are used.'
        ].join(' ')
    }
};
