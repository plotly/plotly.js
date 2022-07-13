'use strict';

var Lib = require('../../lib');

var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    coerce('x');
    coerce('y');

    coerce('xbounds');
    coerce('ybounds');

    if(traceIn.xy && traceIn.xy instanceof Float32Array) {
        traceOut.xy = traceIn.xy;
    }

    if(traceIn.indices && traceIn.indices instanceof Int32Array) {
        traceOut.indices = traceIn.indices;
    }

    coerce('text');
    coerce('marker.color', defaultColor);
    coerce('marker.opacity');
    coerce('marker.blend');
    coerce('marker.sizemin');
    coerce('marker.sizemax');
    coerce('marker.border.color', defaultColor);
    coerce('marker.border.arearatio');

    // disable 1D transforms - that would defeat the purpose of this trace type, performance!
    traceOut._length = null;
};
