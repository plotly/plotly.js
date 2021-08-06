'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var labels = {};

    var subplot = fullLayout[trace.subplot]._subplot;
    var radialAxis;
    var angularAxis;

    radialAxis = subplot.radialAxis;
    angularAxis = subplot.angularAxis;

    var rVal = radialAxis.c2l(cdi.re);
    labels.rLabel = Axes.tickText(radialAxis, rVal, true).text;

    // N.B here the ° sign is part of the formatted value for thetaunit:'degrees'
    var thetaVal = angularAxis.thetaunit === 'degrees' ? Lib.rad2deg(cdi.im) : cdi.im;
    labels.thetaLabel = Axes.tickText(angularAxis, thetaVal, true).text;

    return labels;
};
