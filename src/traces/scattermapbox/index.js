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
    calc: require('../scattergeo/calc'),
    plot: require('./plot'),
    hoverPoints: require('./hover'),
    eventData: require('./event_data'),
    selectPoints: require('./select'),

    styleOnSelect: function(_, cd) {
        if(cd) {
            var trace = cd[0].trace;
            trace._glTrace.update(cd);
        }
    },

    moduleType: 'trace',
    name: 'scattermapbox',
    basePlotModule: require('../../plots/mapbox'),
    categories: ['mapbox', 'gl', 'symbols', 'showLegend', 'scatter-like'],
    meta: {
        hrName: 'scatter_mapbox',
        description: [
            'The data visualized as scatter point, lines or marker symbols',
            'on a Mapbox GL geographic map',
            'is provided by longitude/latitude pairs in `lon` and `lat`.'
        ].join(' ')
    }
};
