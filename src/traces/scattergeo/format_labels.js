'use strict';

var Axes = require('../../plots/cartesian/axes');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var labels = {};

    var geo = fullLayout[trace.geo]._subplot;
    var ax = geo.mockAxis;
    var lonlat = cdi.lonlat;
    labels.lonLabel = Axes.tickText(ax, ax.c2l(lonlat[0]), true).text;
    labels.latLabel = Axes.tickText(ax, ax.c2l(lonlat[1]), true).text;

    return labels;
};
