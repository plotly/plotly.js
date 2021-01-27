'use strict';

/*
 * Given a trace, look up the carpet axis by carpet.
 */
module.exports = function(gd, trace) {
    var n = gd._fullData.length;
    var firstAxis;
    for(var i = 0; i < n; i++) {
        var maybeCarpet = gd._fullData[i];

        if(maybeCarpet.index === trace.index) continue;

        if(maybeCarpet.type === 'carpet') {
            if(!firstAxis) {
                firstAxis = maybeCarpet;
            }

            if(maybeCarpet.carpet === trace.carpet) {
                return maybeCarpet;
            }
        }
    }

    return firstAxis;
};
