/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Scatter = {};

var subtypes = require('./subtypes');
Scatter.hasLines = subtypes.hasLines;
Scatter.hasMarkers = subtypes.hasMarkers;
Scatter.hasText = subtypes.hasText;
Scatter.isBubble = subtypes.isBubble;

// traces with < this many points are by default shown
// with points and lines, > just get lines
Scatter.attributes = require('./attributes');
Scatter.supplyDefaults = require('./defaults');
Scatter.cleanData = require('./clean_data');
Scatter.calc = require('./calc');
Scatter.arraysToCalcdata = require('./arrays_to_calcdata');
Scatter.plot = require('./plot');
Scatter.colorbar = require('./colorbar');
Scatter.style = require('./style');
Scatter.hoverPoints = require('./hover');
Scatter.selectPoints = require('./select');
Scatter.animatable = true;

Scatter.moduleType = 'trace';
Scatter.name = 'scatter';
Scatter.basePlotModule = require('../../plots/cartesian');
Scatter.categories = ['cartesian', 'symbols', 'markerColorscale', 'errorBarsOK', 'showLegend', 'scatter-like'];
Scatter.meta = {
    description: [
        'The scatter trace type encompasses line charts, scatter charts, text charts, and bubble charts.',
        'The data visualized as scatter point or lines is set in `x` and `y`.',
        'Text (appearing either on the chart or on hover only) is via `text`.',
        'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
        'to numerical arrays.'
    ].join(' ')
};

module.exports = Scatter;
