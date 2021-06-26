'use strict';

module.exports = {
    moduleType: 'trace',
    name: 'scatterpolar',
    basePlotModule: require('../../plots/polar'),
    categories: ['polar', 'symbols', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults').supplyDefaults,
    colorbar: require('../scatter/marker_colorbar'),
    formatLabels: require('./format_labels'),
    calc: require('./calc'),
    plot: require('./plot'),
    style: require('../scatter/style').style,
    styleOnSelect: require('../scatter/style').styleOnSelect,
    hoverPoints: require('./hover').hoverPoints,
    selectPoints: require('../scatter/select'),

    meta: {
        hrName: 'scatter_polar',
        description: [
            'The scatterpolar trace type encompasses line charts, scatter charts, text charts, and bubble charts',
            'in polar coordinates.',
            'The data visualized as scatter point or lines is set in',
            '`r` (radial) and `theta` (angular) coordinates',
            'Text (appearing either on the chart or on hover only) is via `text`.',
            'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
            'to numerical arrays.'
        ].join(' ')
    }
};
