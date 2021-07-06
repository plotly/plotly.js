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
    name: 'scattercarpet',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['svg', 'carpet', 'symbols', 'showLegend', 'carpetDependent', 'zoomScale'],
    meta: {
        hrName: 'scatter_carpet',
        description: [
            'Plots a scatter trace on either the first carpet axis or the',
            'carpet axis with a matching `carpet` attribute.'
        ].join(' ')
    }
};
