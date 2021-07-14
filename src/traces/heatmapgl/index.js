'use strict';

var deprecationWarning = [
    '*heatmapgl* trace is deprecated!',
    'Please consider switching to the *heatmap* or *image* trace types.',
    'Alternatively you could contribute/sponsor rewriting this trace type',
    'based on cartesian features and using regl framework.'
].join(' ');

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../heatmap/colorbar'),

    calc: require('../heatmap/calc'),
    plot: require('./convert'),

    moduleType: 'trace',
    name: 'heatmapgl',
    basePlotModule: require('../../plots/gl2d'),
    categories: ['gl', 'gl2d', '2dMap'],
    meta: {
        description: [
            deprecationWarning,
            'WebGL version of the heatmap trace type.'
        ].join(' ')
    }
};
