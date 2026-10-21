'use strict';

module.exports = {
    attributes: require('./attributes').default,
    supplyDefaults: require('./defaults').default,
    colorbar: require('../heatmap/colorbar'),
    calc: require('./calc').default,
    plot: require('./plot').default,
    hoverPoints: require('./hover').default,
    eventData: require('./event_data').default,
    getBelow: require('../choroplethmap').getBelow,

    moduleType: 'trace',
    name: 'vectortilemap',
    basePlotModule: require('../../plots/map'),
    categories: ['map', 'gl', 'noOpacity', 'showLegend'],
    meta: {
        hr_name: 'vector_tile_map',
        description: [
            'Draws the polygons of a Mapbox Vector Tile source, set in `source` and `sourcelayer`.',
            'The data that describes the location-to-color mapping is set in `locations` and `z`.',
            'The trace sends `z` to the map as feature state, so the tiles load once.'
        ].join(' ')
    }
};
