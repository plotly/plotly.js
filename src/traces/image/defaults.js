/**
* Copyright 2012-2020, Plotly, Inc.
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
    var source = coerce('source');
    traceOut._isFromSource = !!source;

    var z = coerce('z');
    traceOut._isFromZ = !(z === undefined || !z.length || !z[0] || !z[0].length);
    if(!traceOut._isFromZ && !traceOut._isFromSource) {
        traceOut.visible = false;
        return;
    }

    coerce('x0');
    coerce('y0');
    coerce('dx');
    coerce('dy');

    if(traceOut._isFromZ) {
        coerce('colormodel');
        coerce('zmin', constants.colormodel[traceOut.colormodel].min);
        coerce('zmax', constants.colormodel[traceOut.colormodel].max);
    } else if(traceOut._isFromSource) {
        traceOut.colormodel = 'rgba';
        traceOut.zmin = constants.colormodel[traceOut.colormodel].min;
        traceOut.zmax = constants.colormodel[traceOut.colormodel].max;
    }

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');

    traceOut._length = null;
};
