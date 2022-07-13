'use strict';

var Lib = require('../../lib');
var attrs = require('./layout_attributes');

module.exports = function(layoutIn, layoutOut, fullData) {
    var subplotsDone = {};
    var sp;

    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn[sp] || {}, layoutOut[sp], attrs, attr, dflt);
    }

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        if(trace.type === 'barpolar' && trace.visible === true) {
            sp = trace.subplot;
            if(!subplotsDone[sp]) {
                coerce('barmode');
                coerce('bargap');
                subplotsDone[sp] = 1;
            }
        }
    }
};
