/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var hasColumns = require('../heatmap/has_columns');
var handleXYZDefaults = require('../heatmap/xyz_defaults');
var handleStyleDefaults = require('../contour/style_defaults');
var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYZDefaults(traceIn, traceOut, coerce, layout);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('connectgaps', hasColumns(traceOut));

    var contourStart = Lib.coerce2(traceIn, traceOut, attributes, 'contours.start'),
        contourEnd = Lib.coerce2(traceIn, traceOut, attributes, 'contours.end'),
        missingEnd = (contourStart === false) || (contourEnd === false),

        // normally we only need size if autocontour is off. But contour.calc
        // pushes its calculated contour size back to the input trace, so for
        // things like restyle that can call supplyDefaults without calc
        // after the initial draw, we can just reuse the previous calculation
        contourSize = coerce('contours.size'),
        autoContour;

    if(missingEnd) autoContour = traceOut.autocontour = true;
    else autoContour = coerce('autocontour', false);

    if(autoContour || !contourSize) coerce('ncontours');

    handleStyleDefaults(traceIn, traceOut, coerce, layout);
};
