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
    basePlotModule: require('../../plots/mapbox'),
    calc: require('../scattergeo/calc'),
    categories: ['mapbox', 'gl', 'symbols', 'showLegend', 'scatter-like'],
    colorbar: require('../scatter/marker_colorbar'),
    eventData: require('../scattermapbox/event_data'),
    formatLabels: require('../scattermapbox/format_labels'),
    hoverPoints: require('./hover'),
    meta: {
        hrName: 'scatter_cluster_mapbox',
        description: [
            'The data visualized as clustered scatter point',
            'on a Mapbox GL geographic map',
            'is provided by longitude/latitude pairs in `lon` and `lat`.'
        ].join(' ')
    },
    moduleType: 'trace',
    name: 'scatterclustermapbox',
    plot: require('./plot'),
    supplyDefaults: require('./defaults'),
};
