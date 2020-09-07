/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


module.exports = function eventData(out, pt) {
    out.lon = pt.lon;
    out.lat = pt.lat;

    return out;
};
