'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    calc: require('./calc'),
    plot: require('./plot'),
    colorbar: {
        container: 'line',
        min: 'cmin',
        max: 'cmax'
    },

    moduleType: 'trace',
    name: 'parcats',
    basePlotModule: require('./base_plot'),
    categories: ['noOpacity'],
    meta: {
        description: [
            'Parallel categories diagram for multidimensional categorical data.'
        ].join(' ')
    }
};
