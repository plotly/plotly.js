/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


var ScatterMapbox = {};

ScatterMapbox.attributes = require('./attributes');
ScatterMapbox.supplyDefaults = require('./defaults');
ScatterMapbox.colorbar = require('../scatter/marker_colorbar');
ScatterMapbox.calc = require('../scattergeo/calc');
ScatterMapbox.plot = require('./plot');
ScatterMapbox.hoverPoints = require('./hover');
ScatterMapbox.eventData = require('./event_data');
ScatterMapbox.selectPoints = require('./select');

ScatterMapbox.style = function(_, cd) {
    if(cd) {
        var trace = cd[0].trace;
        trace._glTrace.update(cd);
    }
};

ScatterMapbox.moduleType = 'trace';
ScatterMapbox.name = 'scattermapbox';
ScatterMapbox.basePlotModule = require('../../plots/mapbox');
ScatterMapbox.categories = ['mapbox', 'gl', 'symbols', 'showLegend', 'scatterlike'];
ScatterMapbox.meta = {
    hrName: 'scatter_mapbox',
    description: [
        'The data visualized as scatter point, lines or marker symbols',
        'on a Mapbox GL geographic map',
        'is provided by longitude/latitude pairs in `lon` and `lat`.'
    ].join(' ')
};

module.exports = ScatterMapbox;
