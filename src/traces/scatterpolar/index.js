/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    moduleType: 'trace',
    name: 'scatterpolar',
    basePlotModule: require('../../plots/polar'),
    categories: ['polar', 'symbols', 'markerColorscale', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    calc: require('./calc'),
    plot: require('./plot'),
    style: require('./style'),
    hoverPoints: require('./hover'),
    selectPoints: require('../scatter/select'),

    meta: {
        hrName: 'scatter_polar',
        description: [
            'The scatterpolar trace type encompasses line charts, scatter charts, text charts, and bubble charts.',
            'in polar coordinates.',
            'The data visualized as scatter point or lines is set in',
            '`r` (radial) and `theta` (angular). coordintes',
            'Text (appearing either on the chart or on hover only) is via `text`.',
            'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
            'to numerical arrays.'
        ].join(' ')
    }
};
