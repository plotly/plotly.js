'use strict';

module.exports = {
    moduleType: 'trace',
    name: 'scatterpolargl',
    basePlotModule: require('../../plots/polar'),
    categories: ['gl', 'regl', 'polar', 'symbols', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../scatter/marker_colorbar'),
    formatLabels: require('./format_labels'),

    calc: require('./calc'),
    hoverPoints: require('./hover').hoverPoints,
    selectPoints: require('../scattergl/select'),

    meta: {
        hrName: 'scatter_polar_gl',
        description: [
            'The scatterpolargl trace type encompasses line charts, scatter charts, and bubble charts',
            'in polar coordinates using the WebGL plotting engine.',
            'The data visualized as scatter point or lines is set in',
            '`r` (radial) and `theta` (angular) coordinates',
            'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
            'to numerical arrays.'
        ].join(' ')
    }
};
