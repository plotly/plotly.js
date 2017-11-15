/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function eventData(out, pt, trace, cd, pointNumber) {
    if(pt.xa) out.xaxis = pt.xa;
    if(pt.ya) out.yaxis = pt.ya;

    if(cd[pointNumber]) {
        var cdi = cd[pointNumber];

        // N.B. These are the scale coordinates !!!
        //
        // On master, hover events get the non-scaled coordinates
        // whereas selection events get the scaled version.
        // Note also that the hover labels show the scaled version.
        //
        // What about the 'raw' input coordinates?
        // Should we include them in parallel here or replace a/b/c with them?
        out.a = cdi.a;
        out.b = cdi.b;
        out.c = cdi.c;
    } else {
        // for fill-hover only
        out.a = pt.a;
        out.b = pt.b;
        out.c = pt.c;
    }

    return out;
};
