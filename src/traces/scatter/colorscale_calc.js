'use strict';

var hasColorscale = require('../../components/colorscale/helpers').hasColorscale;
var calcColorscale = require('../../components/colorscale/calc');

var subTypes = require('./subtypes');

module.exports = function calcMarkerColorscale(gd, trace) {
    if(subTypes.hasLines(trace) && hasColorscale(trace, 'line')) {
        calcColorscale(gd, trace, {
            vals: trace.line.color,
            containerStr: 'line',
            cLetter: 'c'
        });
    }

    if(subTypes.hasMarkers(trace)) {
        if(hasColorscale(trace, 'marker')) {
            calcColorscale(gd, trace, {
                vals: trace.marker.color,
                containerStr: 'marker',
                cLetter: 'c'
            });
        }
        if(hasColorscale(trace, 'marker.line')) {
            calcColorscale(gd, trace, {
                vals: trace.marker.line.color,
                containerStr: 'marker.line',
                cLetter: 'c'
            });
        }
    }
};
