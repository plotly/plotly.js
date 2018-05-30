/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Bar = {};

Bar.attributes = require('./attributes');
Bar.layoutAttributes = require('./layout_attributes');
Bar.supplyDefaults = require('./defaults');
Bar.supplyLayoutDefaults = require('./layout_defaults');
Bar.calc = require('./calc');
Bar.setPositions = require('./set_positions');
Bar.colorbar = require('../scatter/marker_colorbar');
Bar.arraysToCalcdata = require('./arrays_to_calcdata');
Bar.plot = require('./plot');
Bar.style = require('./style').style;
Bar.styleOnSelect = require('./style').styleOnSelect;
Bar.hoverPoints = require('./hover');
Bar.selectPoints = require('./select');

Bar.moduleType = 'trace';
Bar.name = 'bar';
Bar.basePlotModule = require('../../plots/cartesian');
Bar.categories = ['cartesian', 'svg', 'bar', 'oriented', 'errorBarsOK', 'showLegend', 'zoomScale'];
Bar.meta = {
    description: [
        'The data visualized by the span of the bars is set in `y`',
        'if `orientation` is set th *v* (the default)',
        'and the labels are set in `x`.',
        'By setting `orientation` to *h*, the roles are interchanged.'
    ].join(' ')
};

module.exports = Bar;
