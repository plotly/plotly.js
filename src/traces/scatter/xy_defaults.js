/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


module.exports = function handleXYDefaults(traceIn, traceOut, coerce) {
    var len,
        x = coerce('x'),
        y = coerce('y');

    if(x) {
        if(y) {
            len = Math.min(x.length, y.length);
            // TODO: not sure we should do this here... but I think
            // the way it works in calc is wrong, because it'll delete data
            // which could be a problem eg in streaming / editing if x and y
            // come in at different times
            // so we need to revisit calc before taking this out
            if(len < x.length) traceOut.x = x.slice(0, len);
            if(len < y.length) traceOut.y = y.slice(0, len);
        }
        else {
            len = x.length;
            coerce('y0');
            coerce('dy');
        }
    }
    else {
        if(!y) return 0;

        len = traceOut.y.length;
        coerce('x0');
        coerce('dx');
    }
    return len;
};
