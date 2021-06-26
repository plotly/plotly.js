'use strict';

module.exports = {
    plot: require('./convert'),
    attributes: require('./attributes'),
    markerSymbols: require('../../constants/gl3d_markers'),
    supplyDefaults: require('./defaults'),
    colorbar: [
        {
            container: 'marker',
            min: 'cmin',
            max: 'cmax'
        }, {
            container: 'line',
            min: 'cmin',
            max: 'cmax'
        }
    ],
    calc: require('./calc'),

    moduleType: 'trace',
    name: 'scatter3d',
    basePlotModule: require('../../plots/gl3d'),
    categories: ['gl3d', 'symbols', 'showLegend', 'scatter-like'],
    meta: {
        hrName: 'scatter_3d',
        description: [
            'The data visualized as scatter point or lines in 3D dimension',
            'is set in `x`, `y`, `z`.',
            'Text (appearing either on the chart or on hover only) is via `text`.',
            'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
            'Projections are achieved via `projection`.',
            'Surface fills are achieved via `surfaceaxis`.'
        ].join(' ')
    }
};
