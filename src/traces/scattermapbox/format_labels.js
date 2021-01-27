'use strict';

var Axes = require('../../plots/cartesian/axes');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var labels = {};

    var subplot = fullLayout[trace.subplot]._subplot;
    var ax = subplot.mockAxis;

    var lonlat = cdi.lonlat;
    labels.lonLabel = Axes.tickText(ax, ax.c2l(lonlat[0]), true).text;
    labels.latLabel = Axes.tickText(ax, ax.c2l(lonlat[1]), true).text;

    return labels;
};
