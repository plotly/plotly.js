'use strict';

var Lib = require('../../lib');
var layoutAttributes = require('./layout_attributes');

module.exports = function handleHoverModeDefaults(layoutIn, layoutOut) {
    function coerce(attr, dflt) {
        // don't coerce if it is already coerced in other place e.g. in cartesian defaults
        if(layoutOut[attr] !== undefined) return layoutOut[attr];

        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    coerce('clickmode');
    coerce('hoversubplots');
    return coerce('hovermode');
};
