'use strict';

var Axes = require('../../plots/cartesian/axes');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var labels = {};

    var subplot = fullLayout[trace.subplot]._subplot;

    labels.realLabel = Axes.tickText(subplot.radialAxis, cdi.real, true).text;
    labels.imagLabel = Axes.tickText(subplot.angularAxis, cdi.imag, true).text;

    return labels;
};
