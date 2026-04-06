'use strict';

var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var labels = {};

    var mockGd = {_fullLayout: fullLayout};
    var xa = Axes.getFromTrace(mockGd, trace, 'x');
    var ya = Axes.getFromTrace(mockGd, trace, 'y');

    var x = cdi.x;
    var y = cdi.y;

    labels.xLabel = Axes.tickText(xa, xa.c2l(x), true).text;
    labels.yLabel = Axes.tickText(ya, ya.c2l(y), true).text;

    var u = trace.u ? trace.u[cdi.i] : 0;
    var v = trace.v ? trace.v[cdi.i] : 0;

    // Format u and v using hoverformat if provided
    var uhoverformat = trace.uhoverformat;
    var vhoverformat = trace.vhoverformat;

    labels.uLabel = uhoverformat ? Lib.numberFormat(uhoverformat)(u) : String(u);
    labels.vLabel = vhoverformat ? Lib.numberFormat(vhoverformat)(v) : String(v);

    return labels;
};
