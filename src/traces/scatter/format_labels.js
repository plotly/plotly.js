'use strict';

var Axes = require('../../plots/cartesian/axes');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var labels = {};

    var mockGd = {_fullLayout: fullLayout};
    var xa = Axes.getFromTrace(mockGd, trace, 'x');
    var ya = Axes.getFromTrace(mockGd, trace, 'y');

    labels.xLabel = Axes.tickText(xa, xa.c2l(cdi.x), true).text;
    labels.yLabel = Axes.tickText(ya, ya.c2l(cdi.y), true).text;

    return labels;
};
