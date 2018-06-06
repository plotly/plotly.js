/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var ScatterGeo = {};

ScatterGeo.attributes = require('./attributes');
ScatterGeo.supplyDefaults = require('./defaults');
ScatterGeo.colorbar = require('../scatter/marker_colorbar');
ScatterGeo.calc = require('./calc');
ScatterGeo.plot = require('./plot');
ScatterGeo.style = require('./style');
ScatterGeo.styleOnSelect = require('../scatter/style').styleOnSelect;
ScatterGeo.hoverPoints = require('./hover');
ScatterGeo.eventData = require('./event_data');
ScatterGeo.selectPoints = require('./select');

ScatterGeo.moduleType = 'trace';
ScatterGeo.name = 'scattergeo';
ScatterGeo.basePlotModule = require('../../plots/geo');
ScatterGeo.categories = ['geo', 'symbols', 'showLegend', 'scatter-like'];
ScatterGeo.meta = {
    hrName: 'scatter_geo',
    description: [
        'The data visualized as scatter point or lines on a geographic map',
        'is provided either by longitude/latitude pairs in `lon` and `lat`',
        'respectively or by geographic location IDs or names in `locations`.'
    ].join(' ')
};

module.exports = ScatterGeo;
