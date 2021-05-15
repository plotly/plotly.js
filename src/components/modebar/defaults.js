'use strict';

var Lib = require('../../lib');
var Color = require('../color');
var Template = require('../../plot_api/plot_template');
var attributes = require('./attributes');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {
    var containerIn = layoutIn.modebar || {};
    var containerOut = Template.newContainer(layoutOut, 'modebar');

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, attributes, attr, dflt);
    }

    coerce('orientation');
    coerce('bgcolor', Color.addOpacity(layoutOut.paper_bgcolor, 0.5));
    var defaultColor = Color.contrast(Color.rgb(layoutOut.modebar.bgcolor));
    coerce('color', Color.addOpacity(defaultColor, 0.3));
    coerce('activecolor', Color.addOpacity(defaultColor, 0.7));
    coerce('uirevision', layoutOut.uirevision);
    coerce('add');
    coerce('remove');
};
