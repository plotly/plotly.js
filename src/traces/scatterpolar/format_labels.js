'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var labels = {};

    var subplot = fullLayout[trace.subplot]._subplot;
    var radialAxis;
    var angularAxis;

    // for scatterpolargl texttemplate, _subplot is NOT defined, this takes part during the convert step
    // TODO we should consider moving the texttemplate formatting logic to the plot step
    if(!subplot) {
        subplot = fullLayout[trace.subplot];
        radialAxis = subplot.radialaxis;
        angularAxis = subplot.angularaxis;
    } else {
        radialAxis = subplot.radialAxis;
        angularAxis = subplot.angularAxis;
    }

    var rVal = radialAxis.c2l(cdi.r);
    labels.rLabel = Axes.tickText(radialAxis, rVal, true).text;

    // N.B here the ° sign is part of the formatted value for thetaunit:'degrees'
    var thetaVal = angularAxis.thetaunit === 'degrees' ? Lib.rad2deg(cdi.theta) : cdi.theta;
    labels.thetaLabel = Axes.tickText(angularAxis, thetaVal, true).text;

    return labels;
};
