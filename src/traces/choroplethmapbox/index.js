/**
* Copyright 2012-2019, Plotly, Inc.
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

    style: function(_, cd) {
        if(cd) {
            var trace = cd[0].trace;
            trace._glTrace.updateOnSelect(cd);
        }
    },

    moduleType: 'trace',
    name: 'choroplethmapbox',
    basePlotModule: require('../../plots/mapbox'),
    categories: ['mapbox', 'gl', 'noOpacity'],
    meta: {
        hr_name: 'choropleth_mapbox',
        description: [
            'GeoJSON features to be filled are set in `geojson`',
            'The data that describes the choropleth value-to-color mapping',
            'is set in `locations` and `z`.'
        ].join(' ')
    }
};
