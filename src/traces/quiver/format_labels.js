'use strict';

var Axes = require('../../plots/cartesian/axes');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var labels = {};

    var xa = Axes.getFromId({ _fullLayout: fullLayout }, trace.xaxis || 'x');
    var ya = Axes.getFromId({ _fullLayout: fullLayout }, trace.yaxis || 'y');

    var x = cdi.x;
    var y = cdi.y;

    labels.xLabel = Axes.tickText(xa, xa.c2l(x), true).text;
    labels.yLabel = Axes.tickText(ya, ya.c2l(y), true).text;

    var u = trace.u ? trace.u[cdi.i] : 0;
    var v = trace.v ? trace.v[cdi.i] : 0;

    // Format u and v as plain numbers
    labels.uLabel = String(u);
    labels.vLabel = String(v);

    return labels;
};
