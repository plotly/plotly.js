/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    coerce('x');
    coerce('y');
    coerce('bounds');

    if(traceIn.xy && traceIn.xy instanceof Float32Array) {
        traceOut.xy = traceIn.xy;
    }

    if(traceIn.indexid && traceIn.indexid instanceof Int32Array) {
        traceOut.indexid = traceIn.indexid;
    }

    coerce('text');
    coerce('marker.color', defaultColor);
    coerce('marker.opacity');
    coerce('marker.blend');
    coerce('marker.sizemin');
    coerce('marker.sizemax');
    coerce('marker.border.color', defaultColor);
    coerce('marker.border.arearatio');
};
