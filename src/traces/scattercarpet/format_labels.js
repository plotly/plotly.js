'use strict';

module.exports = function formatLabels(cdi, trace) {
    var labels = {};

    var carpet = trace._carpet;
    var ij = carpet.ab2ij([cdi.a, cdi.b]);
    var i0 = Math.floor(ij[0]);
    var ti = ij[0] - i0;
    var j0 = Math.floor(ij[1]);
    var tj = ij[1] - j0;
    var xy = carpet.evalxy([], i0, j0, ti, tj);

    labels.yLabel = xy[1].toFixed(3);

    return labels;
};
