/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var labels = {};

    var subplot = fullLayout[trace.subplot]._subplot;
    labels.aLabel = Axes.tickText(subplot.aaxis, cdi.a, true).text;
    labels.bLabel = Axes.tickText(subplot.baxis, cdi.b, true).text;
    labels.cLabel = Axes.tickText(subplot.caxis, cdi.c, true).text;

    return labels;
};
