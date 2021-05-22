'use strict';

var Lib = require('../../lib');
var handleHoverLabelDefaults = require('./hoverlabel_defaults');
var layoutAttributes = require('./layout_attributes');

module.exports = function supplyLayoutGlobalDefaults(layoutIn, layoutOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    handleHoverLabelDefaults(layoutIn, layoutOut, coerce);
};
