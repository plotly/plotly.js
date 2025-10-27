'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var constants = require('./constants');
var dataUri = require('../../snapshot/helpers').IMAGE_URL_PREFIX;

module.exports = function supplyDefaults(traceIn, traceOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }
    coerce('source');
    // sanitize source to only allow for data URI representing images
    if (traceOut.source && !traceOut.source.match(dataUri)) delete traceOut.source;
    traceOut._hasSource = !!traceOut.source;

    var z = coerce('z');
    traceOut._hasZ = !(z === undefined || !z.length || !z[0] || !z[0].length);
    if (!traceOut._hasZ && !traceOut._hasSource) {
        traceOut.visible = false;
        return;
    }

    coerce('x0');
    coerce('y0');
    coerce('dx');
    coerce('dy');

    var cm;
    if (traceOut._hasZ) {
        coerce('colormodel', 'rgb');
        cm = constants.colormodel[traceOut.colormodel];
        coerce('zmin', cm.zminDflt || cm.min);
        coerce('zmax', cm.zmaxDflt || cm.max);
    } else if (traceOut._hasSource) {
        traceOut.colormodel = 'rgba256';
        cm = constants.colormodel[traceOut.colormodel];
        traceOut.zmin = cm.zminDflt;
        traceOut.zmax = cm.zmaxDflt;
    }

    coerce('zsmooth');
    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('hovertemplatefallback');

    traceOut._length = null;

    coerce('zorder');
};
