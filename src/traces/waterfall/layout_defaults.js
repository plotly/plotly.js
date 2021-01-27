'use strict';

var Lib = require('../../lib');
var layoutAttributes = require('./layout_attributes');

module.exports = function(layoutIn, layoutOut, fullData) {
    var hasTraceType = false;

    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];

        if(trace.visible && trace.type === 'waterfall') {
            hasTraceType = true;
            break;
        }
    }

    if(hasTraceType) {
        coerce('waterfallmode');
        coerce('waterfallgap', 0.2);
        coerce('waterfallgroupgap');
    }
};
