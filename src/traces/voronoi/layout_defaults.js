'use strict';

var Lib = require('../../lib');
var layoutAttributes = require('./layout_attributes');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }
    coerce('treemapcolorway', layoutOut.colorway);
    coerce('extendtreemapcolors');
};
