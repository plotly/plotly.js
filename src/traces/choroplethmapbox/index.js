/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../heatmap/colorbar'),
    calc: require('../choropleth/calc'),
    plot: require('./plot'),
    hoverPoints: require('../choropleth/hover'),
    eventData: require('../choropleth/event_data'),
    selectPoints: require('../choropleth/select'),

    styleOnSelect: function(_, cd) {
        if(cd) {
            var trace = cd[0].trace;
            trace._glTrace.updateOnSelect(cd);
        }
    },

    getBelow: function(trace, subplot) {
        var mapLayers = subplot.getMapLayers();

        // find layer just above top-most "water" layer
        // that is not a plotly layer
        for(var i = mapLayers.length - 2; i >= 0; i--) {
            var layerId = mapLayers[i].id;

            if(typeof layerId === 'string' &&
                layerId.indexOf('water') === 0
             ) {
                for(var j = i + 1; j < mapLayers.length; j++) {
                    layerId = mapLayers[j].id;

                    if(typeof layerId === 'string' &&
                        layerId.indexOf('plotly-') === -1
                    ) {
                        return layerId;
                    }
                }
            }
        }
    },

    moduleType: 'trace',
    name: 'choroplethmapbox',
    basePlotModule: require('../../plots/mapbox'),
    categories: ['mapbox', 'gl', 'noOpacity', 'showLegend'],
    meta: {
        hr_name: 'choropleth_mapbox',
        description: [
            'GeoJSON features to be filled are set in `geojson`',
            'The data that describes the choropleth value-to-color mapping',
            'is set in `locations` and `z`.'
        ].join(' ')
    }
};
