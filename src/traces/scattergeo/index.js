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
