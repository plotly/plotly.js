'use strict';

var Lib = require('../../lib');

var layoutAttributes = require('./layout_attributes');

module.exports = function(layoutIn, layoutOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    var groupBarmode = layoutOut.barmode === 'group';

    if(layoutOut.scattermode === 'group') {
        coerce('scattergap', groupBarmode ? layoutOut.bargap : 0.2);
    }
};
