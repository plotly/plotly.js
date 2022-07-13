'use strict';

var colorscaleCalc = require('../../components/colorscale/calc');

module.exports = function calc(gd, trace) {
    if(trace.intensity) {
        colorscaleCalc(gd, trace, {
            vals: trace.intensity,
            containerStr: '',
            cLetter: 'c'
        });
    }
};
