'use strict';

var Lib = require('../../lib');
var Color = require('../color');
var attributes = require('./attributes');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, attributes, attr, dflt);
    }

    coerce('modebar.orientation');
    coerce('modebar.bgcolor', Color.addOpacity(layoutOut.paper_bgcolor, 0.5));
    var defaultColor = Color.contrast(Color.rgb(layoutOut.modebar.bgcolor));
    coerce('modebar.color', Color.addOpacity(defaultColor, 0.3));
    coerce('modebar.activecolor', Color.addOpacity(defaultColor, 0.7));
    coerce('modebar.uirevision', layoutOut.uirevision);
    coerce('modebar.buttonstoadd');
};
