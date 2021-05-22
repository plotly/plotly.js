'use strict';

var plots = require('../../plots/plots');

exports.name = 'sunburst';

exports.plot = function(gd, traces, transitionOpts, makeOnCompleteCallback) {
    plots.plotBasePlot(exports.name, gd, traces, transitionOpts, makeOnCompleteCallback);
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    plots.cleanBasePlot(exports.name, newFullData, newFullLayout, oldFullData, oldFullLayout);
};
