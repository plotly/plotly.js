'use strict';

var Plots = require('../../plots/plots');
var Lib = require('../../lib');

var layoutAttributes = require('./layout_attributes');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    var hasBoxes;
    for(var i = 0; i < fullData.length; i++) {
        if(Plots.traceIs(fullData[i], 'box')) {
            hasBoxes = true;
            break;
        }
    }
    if(!hasBoxes) return;

    coerce('boxmode');
    coerce('boxgap');
    coerce('boxgroupgap');
};
