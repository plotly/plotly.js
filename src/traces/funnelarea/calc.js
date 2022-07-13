'use strict';

var pieCalc = require('../pie/calc');

function calc(gd, trace) {
    return pieCalc.calc(gd, trace);
}

function crossTraceCalc(gd) {
    pieCalc.crossTraceCalc(gd, { type: 'funnelarea' });
}

module.exports = {
    calc: calc,
    crossTraceCalc: crossTraceCalc
};
