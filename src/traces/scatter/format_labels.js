'use strict';

var Axes = require('../../plots/cartesian/axes');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var labels = {};

    var mockGd = {_fullLayout: fullLayout};
    var xa = Axes.getFromTrace(mockGd, trace, 'x');
    var ya = Axes.getFromTrace(mockGd, trace, 'y');

    var x = cdi.x;
    var y = cdi.y;

    if(xa.type === 'log') x = xa.c2r(x);
    if(ya.type === 'log') y = ya.c2r(y);

    labels.xLabel = Axes.tickText(xa, x, true).text;
    labels.yLabel = Axes.tickText(ya, y, true).text;

    return labels;
};
