'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var handleHoverLabelDefaults = require('./hoverlabel_defaults');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var opts = Lib.extendFlat({}, layout.hoverlabel);
    if(traceOut.hovertemplate) opts.namelength = -1;

    handleHoverLabelDefaults(traceIn, traceOut, coerce, opts);
};
