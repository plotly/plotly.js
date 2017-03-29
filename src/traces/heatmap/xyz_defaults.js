/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Registry = require('../../registry');
var hasColumns = require('./has_columns');


module.exports = function handleXYZDefaults(traceIn, traceOut, coerce, layout) {
    var z = coerce('z');
    var x, y;

    if(z === undefined || !z.length) return 0;

    if(hasColumns(traceIn)) {
        x = coerce('x');
        y = coerce('y');

        // column z must be accompanied by 'x' and 'y' arrays
        if(!x || !y) return 0;
    }
    else {
        x = coordDefaults('x', coerce);
        y = coordDefaults('y', coerce);

        // TODO put z validation elsewhere
        if(!isValidZ(z)) return 0;

        coerce('transpose');
    }

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y'], layout);

    return traceOut.z.length;
};

function coordDefaults(coordStr, coerce) {
    var coord = coerce(coordStr),
        coordType = coord ?
            coerce(coordStr + 'type', 'array') :
            'scaled';

    if(coordType === 'scaled') {
        coerce(coordStr + '0');
        coerce('d' + coordStr);
    }

    return coord;
}

function isValidZ(z) {
    var allRowsAreArrays = true,
        oneRowIsFilled = false,
        hasOneNumber = false,
        zi;

    /*
     * Without this step:
     *
     * hasOneNumber = false breaks contour but not heatmap
     * allRowsAreArrays = false breaks contour but not heatmap
     * oneRowIsFilled = false breaks both
     */

    for(var i = 0; i < z.length; i++) {
        zi = z[i];
        if(!Array.isArray(zi)) {
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
