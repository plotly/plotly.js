'use strict';

var calc = require('../sunburst/calc');

exports.calc = function(gd, trace) {
    return calc.calc(gd, trace);
};

exports.crossTraceCalc = function(gd) {
    return calc._runCrossTraceCalc('treemap', gd);
};
