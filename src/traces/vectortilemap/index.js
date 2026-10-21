'use strict';

module.exports = {
    attributes: require('./attributes').default,
    supplyDefaults: require('./defaults').default,
    colorbar: require('../heatmap/colorbar'),
    calc: require('./calc').default,
    plot: require('./plot').default,
    hoverPoints: require('./hover').default,
    eventData: require('./event_data').default,
    selectPoints: require('./select').default,

    styleOnSelect: function (_, cd) {
        if (cd) {
            var trace = cd[0].trace;
            if (trace._glTrace) trace._glTrace.updateOnSelect(cd);
        }
    },

    getBelow: require('../choroplethmap').getBelow,

    moduleType: 'trace',
    name: 'vectortilemap',
    basePlotModule: require('../../plots/map'),
    categories: ['map', 'gl', 'noOpacity', 'showLegend'],
    meta: {
        hr_name: 'vector_tile_map',
        description: [
            'Draws the polygons, lines or points of a Mapbox Vector Tile source,',
            'set in `source` and `sourcelayer`.',
            'The colors come from `locations` and `z`, which the trace sends to the map as feature state,',
            'from a numeric tile property set in `zkey`, or from one color.'
        ].join(' ')
    }
};
