/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plots = require('../../plots/plots');
var Scatter = require('../scatter');


var ScatterGeo = {};

Plots.register(ScatterGeo, 'scattergeo',
    ['geo', 'symbols', 'markerColorscale', 'showLegend'], {
        hrName: 'scatter_geo',
        description: [
            'The data visualized as scatter point or lines on a geographic map',
            'is provided either by longitude/latitude pairs in `lon` and `lat`',
            'respectively or by geographic location IDs or names in `locations`.'
        ].join(' ')
    });

ScatterGeo.attributes = require('./attributes');
ScatterGeo.supplyDefaults = require('./defaults');
ScatterGeo.colorbar = Scatter.colorbar;
ScatterGeo.plot = require('./plot');

ScatterGeo.calc = function(gd, trace) {

    Scatter.calcMarkerColorscales(trace);

};

module.exports = ScatterGeo;
