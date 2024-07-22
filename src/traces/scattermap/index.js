'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../scatter/marker_colorbar'),
    formatLabels: require('./format_labels'),
    calc: require('../scattergeo/calc'),
    plot: require('./plot'),
    hoverPoints: require('./hover').hoverPoints,
    eventData: require('./event_data'),
    selectPoints: require('./select'),

    styleOnSelect: function(_, cd) {
        if(cd) {
            var trace = cd[0].trace;
            trace._glTrace.update(cd);
        }
    },

    moduleType: 'trace',
    name: 'scattermap',
    basePlotModule: require('../../plots/map'),
    categories: ['map', 'gl', 'symbols', 'showLegend', 'scatter-like'],
    meta: {
        hrName: 'scatter_map',
        description: [
            'The data visualized as scatter point, lines or marker symbols',
            'on a MapLibre GL geographic map',
            'is provided by longitude/latitude pairs in `lon` and `lat`.'
        ].join(' ')
    }
};
