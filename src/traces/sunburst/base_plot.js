/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var plots = require('../../plots/plots');

exports.name = 'sunburst';

exports.plot = function(gd, traces, transitionOpts, makeOnCompleteCallback) {
    plots.plotBasePlot(exports.name, gd, traces, transitionOpts, makeOnCompleteCallback);
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    plots.cleanBasePlot(exports.name, newFullData, newFullLayout, oldFullData, oldFullLayout);
};
