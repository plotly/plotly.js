'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    calc: require('./calc'),
    colorbar: {
        min: 'cmin',
        max: 'cmax'
    },
    plot: require('./convert'),

    moduleType: 'trace',
    name: 'bar3d',
    basePlotModule: require('../../plots/gl3d'),
    categories: ['gl3d', 'showLegend'],
    meta: {
        description: [
            'Draws bar3ds with the height in `z` direction.'
        ].join(' ')
    }
};
