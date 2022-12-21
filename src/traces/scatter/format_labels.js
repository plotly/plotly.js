'use strict';

var Axes = require('../../plots/cartesian/axes');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var labels = {};

    var mockGd = {_fullLayout: fullLayout};
    var xa = Axes.getFromTrace(mockGd, trace, 'x');
    var ya = Axes.getFromTrace(mockGd, trace, 'y');

    var x = cdi.orig_x;
    if(x === undefined) x = cdi.x;

    var y = cdi.orig_y;
    if(y === undefined) y = cdi.y;

    labels.xLabel = Axes.tickText(xa, xa.c2l(x), true).text;
    labels.yLabel = Axes.tickText(ya, ya.c2l(y), true).text;

    return labels;
};
