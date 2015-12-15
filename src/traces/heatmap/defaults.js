/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Plotly = require('../../plotly');
var Plots = require('../../plots/plots');
var Lib = require('../../lib');
var Colorscale = require('../../components/colorscale');

var attributes = require('./attributes');
var hasColumns = require('./has_columns');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    var isContour = Plots.traceIs(traceOut, 'contour');

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    if(!isContour) coerce('zsmooth');

    if(Plots.traceIs(traceOut, 'histogram')) {
        // x, y, z, marker.color, and x0, dx, y0, dy are coerced
        // in Histogram.supplyDefaults
        // (along with histogram-specific attributes)
        Plotly.Histogram.supplyDefaults(traceIn, traceOut);
        if(traceOut.visible === false) return;
    }
    else {
        var len = handleXYZDefaults(traceIn, traceOut, coerce);
        if(!len) {
            traceOut.visible = false;
            return;
        }

        coerce('text');

        var _hasColumns = hasColumns(traceOut);

        if(!_hasColumns) coerce('transpose');
        coerce('connectgaps', _hasColumns &&
            (isContour || traceOut.zsmooth !== false));
    }

    if(!isContour || (traceOut.contours || {}).coloring!=='none') {
        Colorscale.handleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'z'}
        );
    }
};

function handleXYZDefaults(traceIn, traceOut, coerce) {
    var z = coerce('z');
    var x, y;

    if(z===undefined || !z.length) return 0;

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
    }

    return traceOut.z.length;
}

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
