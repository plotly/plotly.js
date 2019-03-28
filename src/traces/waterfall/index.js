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
Waterfall.layoutAttributes = require('./layout_attributes');
Waterfall.supplyDefaults = require('./defaults').supplyDefaults;
Waterfall.crossTraceDefaults = require('./defaults').crossTraceDefaults;
Waterfall.supplyLayoutDefaults = require('./layout_defaults');
Waterfall.calc = require('./calc');
Waterfall.crossTraceCalc = require('./cross_trace_calc');
Waterfall.plot = require('./plot');
Waterfall.style = require('./style').style;
Waterfall.hoverPoints = require('./hover');
Waterfall.selectPoints = require('../bar/select');

Waterfall.moduleType = 'trace';
Waterfall.name = 'waterfall';
Waterfall.basePlotModule = require('../../plots/cartesian');
Waterfall.categories = ['cartesian', 'svg', 'oriented', 'showLegend', 'zoomScale'];
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
