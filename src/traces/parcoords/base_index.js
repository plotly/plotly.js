'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    calc: require('./calc'),
    colorbar: {
        container: 'line',
        min: 'cmin',
        max: 'cmax'
    },

    moduleType: 'trace',
    name: 'parcoords',
    basePlotModule: require('./base_plot'),
    categories: ['gl', 'regl', 'noOpacity', 'noHover'],
    meta: {
        description: [
            'Parallel coordinates for multidimensional exploratory data analysis.',
            'The samples are specified in `dimensions`.',
            'The colors are set in `line.color`.'
        ].join(' ')
    }
};
