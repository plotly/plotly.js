'use strict';

var Lib = require('../../lib');

module.exports = function calcSelection(cd, trace) {
    if(Lib.isArrayOrTypedArray(trace.selectedpoints)) {
        Lib.tagSelected(cd, trace);
    }
};
