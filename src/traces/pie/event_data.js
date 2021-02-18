'use strict';

var appendArrayMultiPointValues = require('../../components/fx/helpers').appendArrayMultiPointValues;

// Note: like other eventData routines, this creates the data for hover/unhover/click events
// but it has a different API and goes through a totally different pathway.
// So to ensure it doesn't get misused, it's not attached to the Pie module.
module.exports = function eventData(pt, trace) {
    var out = {
        curveNumber: trace.index,
        pointNumbers: pt.pts,
        data: trace._input,
        fullData: trace,
        label: pt.label,
        color: pt.color,
        value: pt.v,
        percent: pt.percent,
        text: pt.text,

        // pt.v (and pt.i below) for backward compatibility
        v: pt.v,

        // TODO: These coordinates aren't quite correct and don't take into account some offset
        // I still haven't quite located (similar to xa._offset)
        bbox: {
            x0: pt.x0,
            x1: pt.x1,
            y0: pt.y0,
            y1: pt.y1,
        },
    };

    // Only include pointNumber if it's unambiguous
    if(pt.pts.length === 1) out.pointNumber = out.i = pt.pts[0];

    // Add extra data arrays to the output
    // notice that this is the multi-point version ('s' on the end!)
    // so added data will be arrays matching the pointNumbers array.
    appendArrayMultiPointValues(out, trace, pt.pts);

    // don't include obsolete fields in new funnelarea traces
    if(trace.type === 'funnelarea') {
        delete out.v;
        delete out.i;
    }

    return out;
};
