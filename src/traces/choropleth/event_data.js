/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function eventData(out, pt, trace, cd, pointNumber) {
    out.location = pt.location;
    out.z = pt.z;

    // include feature properties from input geojson
    var cdi = cd[pointNumber];
    if(cdi.fIn && cdi.fIn.properties) {
        out.properties = cdi.fIn.properties;
    }
    out.ct = cdi.ct;

    return out;
};
