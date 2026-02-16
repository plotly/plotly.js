'use strict';

module.exports = {
    moduleType: 'trace',
    name: 'quiver',
    basePlotModule: require('../../plots/cartesian'),
    categories: [
        'cartesian', 'svg', 'showLegend', 'scatter-like', 'zoomScale'
    ],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    calc: require('./calc'),
    plot: require('./plot'),
    style: require('./style').style,
    styleOnSelect: require('./style').styleOnSelect,
    hoverPoints: require('./hover'),
    formatLabels: require('./format_labels'),
    eventData: require('./event_data'),
    selectPoints: require('../scatter/select'),
    colorbar: require('../scatter/marker_colorbar'),
    animatable: true,

    meta: {
        description: [
            'The quiver trace type visualizes vector fields using arrows.',
            'Specify a vector field using 4 1D arrays:',
            '2 position arrays `x`, `y` and 2 vector component arrays `u`, `v`.',
            'The arrows are drawn exactly at the positions given by `x` and `y`.',
            'Arrow length and direction are determined by `u` and `v` components.'
        ].join(' ')
    }
};
