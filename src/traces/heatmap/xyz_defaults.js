'use strict';

var isNumeric = require('fast-isnumeric');
var Lib = require('../../lib');

var Registry = require('../../registry');

module.exports = function handleXYZDefaults(traceIn, traceOut, coerce, layout, xName, yName) {
    var z = coerce('z');
    xName = xName || 'x';
    yName = yName || 'y';
    var x, y;

    if(z === undefined || !z.length) return 0;

    if(Lib.isArray1D(traceIn.z)) {
        x = coerce(xName);
        y = coerce(yName);

        var xlen = Lib.minRowLength(x);
        var ylen = Lib.minRowLength(y);

        // column z must be accompanied by xName and yName arrays
        if(xlen === 0 || ylen === 0) return 0;

        traceOut._length = Math.min(xlen, ylen, z.length);
    } else {
        x = coordDefaults(xName, coerce);
        y = coordDefaults(yName, coerce);

        // TODO put z validation elsewhere
        if(!isValidZ(z)) return 0;

        coerce('transpose');

        traceOut._length = null;
    }

    if(traceIn.type === 'heatmapgl') return true; // skip calendars until we handle them in those traces

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, [xName, yName], layout);

    return true;
};

function coordDefaults(coordStr, coerce) {
    var coord = coerce(coordStr);
    var coordType = coord ? coerce(coordStr + 'type', 'array') : 'scaled';

    if(coordType === 'scaled') {
        coerce(coordStr + '0');
        coerce('d' + coordStr);
    }

    return coord;
}

function isValidZ(z) {
    var allRowsAreArrays = true;
    var oneRowIsFilled = false;
    var hasOneNumber = false;
    var zi;

    /*
     * Without this step:
     *
     * hasOneNumber = false breaks contour but not heatmap
     * allRowsAreArrays = false breaks contour but not heatmap
     * oneRowIsFilled = false breaks both
     */

    for(var i = 0; i < z.length; i++) {
        zi = z[i];
        if(!Lib.isArrayOrTypedArray(zi)) {
            allRowsAreArrays = false;
            break;
        }
        if(zi.length > 0) oneRowIsFilled = true;
        for(var j = 0; j < zi.length; j++) {
            if(isNumeric(zi[j])) {
                hasOneNumber = true;
                break;
            }
        }
    }

    return (allRowsAreArrays && oneRowIsFilled && hasOneNumber);
}
