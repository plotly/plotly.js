'use strict';

module.exports = {
    moduleType: 'trace',
    name: 'scatterternarygl',
    basePlotModule: require('../../plots/ternary'),
    categories: ['gl', 'regl', 'ternary', 'symbols', 'showLegend', 'scatter-like'],
    attributes: require('./attributes').default,
    supplyDefaults: require('./defaults'),
    calc: require('./calc'),
    colorbar: require('../scatter/marker_colorbar'),
    formatLabels: require('./format_labels'),
    hoverPoints: require('./hover'),
    selectPoints: require('../scattergl/select'),
    eventData: require('./event_data'),
    meta: {
        hrName: 'scatter_ternary_gl',
        description: [
            'Provides similar functionality to the *scatter* type but on a ternary phase diagram',
            'using the WebGL plotting engine.',
            'The data is provided by at least two arrays out of `a`, `b`, `c` triplets.'
        ].join(' ')
    }
};
