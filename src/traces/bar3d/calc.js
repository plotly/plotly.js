'use strict';

var colorscaleCalc = require('../../components/colorscale/calc');
var filter = require('../streamtube/calc').filter;

module.exports = function calc(gd, trace) {
    var i;
    var len = Math.min(
        trace.x.length,
        trace.y.length,
        trace.value.length
    );

    trace._len = len;
    trace._value = filter(trace.value, len);
    trace._Xs = filter(trace.x, len);
    trace._Ys = filter(trace.y, len);

    if(!trace.base) trace.base = new Array(len).fill(0); // TODO: Improve me!
    trace.z = trace.base; // TODO: why we need to add z to trace?

    trace._Zs = filter(trace.base, len);

    for(i = 0; i < trace._Zs.length; i++) {
        var base = trace._Zs[i];
        if(!base || isNaN(base)) trace._Zs[i] = 0;
    }

    var min = Infinity;
    var max = -Infinity;
    for(i = 0; i < trace._len; i++) {
        var h =
            trace._Zs[i] +
            trace._value[i];

        min = Math.min(min, h);
        max = Math.max(max, h);
    }

    colorscaleCalc(gd, trace, {
        vals: [min, max],
        containerStr: '',
        cLetter: 'c'
    });
};
