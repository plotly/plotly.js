'use strict';

var deprecationWarning = [
    '*densitymapbox* trace is deprecated!',
    'Please consider switching to the *densitymap* trace type and `map` subplots.',
    'Learn more at: https://plotly.com/python/maplibre-migration/',
    'as well as https://plotly.com/javascript/maplibre-migration/'
].join(' ');

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../heatmap/colorbar'),
    formatLabels: require('../scattermapbox/format_labels'),
    calc: require('./calc'),
    plot: require('./plot'),
    hoverPoints: require('./hover'),
    eventData: require('./event_data'),

    getBelow: function(trace, subplot) {
        var mapLayers = subplot.getMapLayers();

        // find first layer with `type: 'symbol'`,
        // that is not a plotly layer
        for(var i = 0; i < mapLayers.length; i++) {
            var layer = mapLayers[i];
            var layerId = layer.id;
            if(layer.type === 'symbol' &&
                typeof layerId === 'string' && layerId.indexOf('plotly-') === -1
            ) {
                return layerId;
            }
        }
    },

    moduleType: 'trace',
    name: 'densitymapbox',
    basePlotModule: require('../../plots/mapbox'),
    categories: ['mapbox', 'gl', 'showLegend'],
    meta: {
        hr_name: 'density_mapbox',
        description: [
            deprecationWarning,
            'Draws a bivariate kernel density estimation with a Gaussian kernel',
            'from `lon` and `lat` coordinates and optional `z` values using a colorscale.'
        ].join(' ')
    }
};
