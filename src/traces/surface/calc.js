'use strict';

var colorscaleCalc = require('../../components/colorscale/calc');


// Compute auto-z and autocolorscale if applicable
module.exports = function calc(gd, trace) {
    if(trace.surfacecolor) {
        colorscaleCalc(gd, trace, {
            vals: trace.surfacecolor,
            containerStr: '',
            cLetter: 'c'
        });
    } else {
        colorscaleCalc(gd, trace, {
            vals: trace.z,
            containerStr: '',
            cLetter: 'c'
        });
    }
};
