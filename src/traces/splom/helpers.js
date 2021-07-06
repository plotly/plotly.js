'use strict';

exports.getDimIndex = function getDimIndex(trace, ax) {
    var axId = ax._id;
    var axLetter = axId.charAt(0);
    var ind = {x: 0, y: 1}[axLetter];
    var visibleDims = trace._visibleDims;

    for(var k = 0; k < visibleDims.length; k++) {
        var i = visibleDims[k];
        if(trace._diag[i][ind] === axId) return k;
    }
    return false;
};
