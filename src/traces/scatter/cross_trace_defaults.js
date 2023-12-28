'use strict';

var Lib = require('../../lib');
var handleGroupingDefaults = require('./grouping_defaults');
var attributes = require('./attributes');

// remove opacity for any trace that has a fill or is filled to
module.exports = function crossTraceDefaults(fullData, fullLayout) {
    var traceIn, traceOut, i;

    function coerce(attr) {
        return Lib.coerce(traceOut._input, traceOut, attributes, attr);
    }

    if(fullLayout.scattermode === 'group') {
        for(i = 0; i < fullData.length; i++) {
            traceOut = fullData[i];

            if(traceOut.type === 'scatter') {
                traceIn = traceOut._input;
                handleGroupingDefaults(traceIn, traceOut, fullLayout, coerce);
            }
        }
    }

    for(i = 0; i < fullData.length; i++) {
        var tracei = fullData[i];
        if(tracei.type !== 'scatter') continue;

        var filli = tracei.fill;
        if(filli === 'none' || filli === 'toself') continue;

        tracei.opacity = undefined;

        if(filli === 'tonexty' || filli === 'tonextx') {
            for(var j = i - 1; j >= 0; j--) {
                var tracej = fullData[j];

                if((tracej.type === 'scatter') &&
                        (tracej.xaxis === tracei.xaxis) &&
                        (tracej.yaxis === tracei.yaxis)) {
                    tracej.opacity = undefined;
                    break;
                }
            }
        }
    }
};
