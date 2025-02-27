'use strict';

var hover = require('./hover');

module.exports = {
    moduleType: 'trace',
    name: 'scattergl',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['gl', 'regl', 'cartesian', 'symbols', 'errorBarsOK', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    crossTraceDefaults: require('../scatter/cross_trace_defaults'),
    colorbar: require('../scatter/marker_colorbar'),
    formatLabels: require('./format_labels'),
    calc: require('./calc'),
    hoverPoints: hover.hoverPoints,
    selectPoints: require('./select'),

    meta: {
        hrName: 'scatter_gl',
        description: [
            'The data visualized as scatter point or lines is set in `x` and `y`',
            'using the WebGL plotting engine.',
            'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
            'to a numerical arrays.'
        ].join(' ')
    }
};
