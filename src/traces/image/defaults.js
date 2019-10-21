/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var constants = require('./constants');

module.exports = function supplyDefaults(traceIn, traceOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }
    var z = coerce('z');
    if(z === undefined || !z.length) {
        traceOut.visible = false;
        return;
    }

    coerce('x0');
    coerce('y0');
    coerce('dx');
    coerce('dy');
    var colormodel = coerce('colormodel');

    coerce('zmin', constants.colormodel[colormodel].min);
    coerce('zmax', constants.colormodel[colormodel].max);

    coerce('hovertemplate');
};
