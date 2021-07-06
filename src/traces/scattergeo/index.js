'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../scatter/marker_colorbar'),
    formatLabels: require('./format_labels'),
    calc: require('./calc'),
    calcGeoJSON: require('./plot').calcGeoJSON,
    plot: require('./plot').plot,
    style: require('./style'),
    styleOnSelect: require('../scatter/style').styleOnSelect,
    hoverPoints: require('./hover'),
    eventData: require('./event_data'),
    selectPoints: require('./select'),

    moduleType: 'trace',
    name: 'scattergeo',
    basePlotModule: require('../../plots/geo'),
    categories: ['geo', 'symbols', 'showLegend', 'scatter-like'],
    meta: {
        hrName: 'scatter_geo',
        description: [
            'The data visualized as scatter point or lines on a geographic map',
            'is provided either by longitude/latitude pairs in `lon` and `lat`',
            'respectively or by geographic location IDs or names in `locations`.'
        ].join(' ')
    }
};
