/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var heatmapSupplyDefaults = require('../heatmap/defaults');

var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var contourStart = Lib.coerce2(traceIn, traceOut, attributes, 'contours.start'),
        contourEnd = Lib.coerce2(traceIn, traceOut, attributes, 'contours.end'),
        autocontour = coerce('autocontour', !(contourStart && contourEnd));

    if(autocontour) coerce('ncontours');
    else coerce('contours.size');

    var coloring = coerce('contours.coloring');

    if(coloring === 'fill') coerce('contours.showlines');

    if(traceOut.contours.showlines!==false) {
        if(coloring !== 'lines') coerce('line.color', '#000');
        coerce('line.width', 0.5);
        coerce('line.dash');
    }

    coerce('line.smoothing');

    heatmapSupplyDefaults(traceIn, traceOut, defaultColor, layout);
};
