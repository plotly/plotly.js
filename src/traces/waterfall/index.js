/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Waterfall = {};

Waterfall.attributes = require('./attributes');
Waterfall.layoutAttributes = require('../bar/layout_attributes');
Waterfall.supplyDefaults = require('./defaults');
Waterfall.supplyLayoutDefaults = require('../bar/layout_defaults');
Waterfall.calc = require('./calc');
Waterfall.crossTraceCalc = require('../bar/cross_trace_calc').crossTraceCalc;
Waterfall.colorbar = require('../scatter/marker_colorbar');
Waterfall.arraysToCalcdata = require('../bar/arrays_to_calcdata');
Waterfall.plot = require('../bar/plot');
Waterfall.style = require('../bar/style').style;
Waterfall.styleOnSelect = require('../bar/style').styleOnSelect;
Waterfall.hoverPoints = require('../bar/hover').hoverPoints;
Waterfall.selectPoints = require('../bar/select');

Waterfall.moduleType = 'trace';
Waterfall.name = 'waterfall';
Waterfall.basePlotModule = require('../../plots/cartesian');
Waterfall.categories = ['cartesian', 'svg', 'bar', 'oriented', 'errorBarsOK', 'showLegend', 'zoomScale'];
Waterfall.meta = {
    description: [
        'Draws waterfall trace which is useful graph to displays the',
        'contribution of various elements (either positive or negative)',
        'in a bar chart. The data visualized by the span of the bars is',
        'set in `y` if `orientation` is set th *v* (the default) and the',
        'labels are set in `x`.',
        'By setting `orientation` to *h*, the roles are interchanged.'
    ].join(' ')
};

module.exports = Waterfall;
