'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../heatmap/colorbar'),
    calc: require('./calc'),
    calcGeoJSON: require('./plot').calcGeoJSON,
    plot: require('./plot').plot,
    style: require('./style').style,
    styleOnSelect: require('./style').styleOnSelect,
    hoverPoints: require('./hover'),
    eventData: require('./event_data'),
    selectPoints: require('./select'),

    moduleType: 'trace',
    name: 'choropleth',
    basePlotModule: require('../../plots/geo'),
    categories: ['geo', 'noOpacity', 'showLegend'],
    meta: {
        description: [
            'The data that describes the choropleth value-to-color mapping',
            'is set in `z`.',
            'The geographic locations corresponding to each value in `z`',
            'are set in `locations`.'
        ].join(' ')
    }
};
