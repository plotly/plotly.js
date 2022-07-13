'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var supplyIsoDefaults = require('../isosurface/defaults').supplyIsoDefaults;
var opacityscaleDefaults = require('../surface/defaults').opacityscaleDefaults;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    supplyIsoDefaults(traceIn, traceOut, defaultColor, layout, coerce);

    opacityscaleDefaults(traceIn, traceOut, layout, coerce);
};
