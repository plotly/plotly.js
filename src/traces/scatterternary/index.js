'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../scatter/marker_colorbar'),
    formatLabels: require('./format_labels'),
    calc: require('./calc'),
    plot: require('./plot'),
    style: require('../scatter/style').style,
    styleOnSelect: require('../scatter/style').styleOnSelect,
    hoverPoints: require('./hover'),
    selectPoints: require('../scatter/select'),
    eventData: require('./event_data'),

    moduleType: 'trace',
    name: 'scatterternary',
    basePlotModule: require('../../plots/ternary'),
    categories: ['ternary', 'symbols', 'showLegend', 'scatter-like'],
    meta: {
        hrName: 'scatter_ternary',
        description: [
            'Provides similar functionality to the *scatter* type but on a ternary phase diagram.',
            'The data is provided by at least two arrays out of `a`, `b`, `c` triplets.'
        ].join(' ')
    }
};
