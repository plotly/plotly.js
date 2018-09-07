/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attrs = require('./layout_attributes');

module.exports = function(layoutIn, layoutOut) {
    var subplotIds = layoutOut._subplots.polar;
    var sp;

    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn[sp] || {}, layoutOut[sp], attrs, attr, dflt);
    }

    for(var i = 0; i < subplotIds.length; i++) {
        sp = subplotIds[i];
        coerce('barmode');
        coerce('bargap');
    }
};
