'use strict';

var Color = require('../../components/color');
var subtypes = require('./subtypes');


module.exports = function getTraceColor(trace, di) {
    var lc, tc;

    // TODO: text modes

    if(trace.mode === 'lines') {
        lc = trace.line.color;
        return (lc && Color.opacity(lc)) ?
            lc : trace.fillcolor;
    } else if(trace.mode === 'none') {
        return trace.fill ? trace.fillcolor : '';
    } else {
        var mc = di.mcc || (trace.marker || {}).color;
        var mlc = di.mlcc || ((trace.marker || {}).line || {}).color;

        tc = (mc && Color.opacity(mc)) ? mc :
            (mlc && Color.opacity(mlc) &&
                (di.mlw || ((trace.marker || {}).line || {}).width)) ? mlc : '';

        if(tc) {
            // make sure the points aren't TOO transparent
            if(Color.opacity(tc) < 0.3) {
                return Color.addOpacity(tc, 0.3);
            } else return tc;
        } else {
            lc = (trace.line || {}).color;
            return (lc && Color.opacity(lc) &&
                subtypes.hasLines(trace) && trace.line.width) ?
                    lc : trace.fillcolor;
        }
    }
};
