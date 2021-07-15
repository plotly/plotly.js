'use strict';

function getTraceFromCd(cd) {
    var trace = cd.trace;
    if(trace) return trace;

    for(var i = 0; i < cd.length; i++) {
        trace = cd[i].trace;
        if(trace) return trace;
    }
}

module.exports = getTraceFromCd;
