/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

var subTypes = require('../scatter/subtypes');
var handleMarkerDefaults = require('../scatter/marker_defaults');
var handleLineDefaults = require('../scatter/line_defaults');
var handleFillColorDefaults = require('../scatter/fillcolor_defaults');
var PTS_LINESONLY = require('../scatter/constants').PTS_LINESONLY;

var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var r = coerce('r');
    var theta = coerce('theta');
    var len = (r && theta) ? Math.min(r.length, theta.length) : 0;

    if(!len) {
        traceOut.visible = false;
        return;
    }

    traceOut._length = len;

    coerce('thetaunit');
    coerce('mode', len < PTS_LINESONLY ? 'lines+markers' : 'lines');
    coerce('text');

    if(subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);
        coerce('connectgaps');
    }

    var dfltHoverOn = [];

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
        dfltHoverOn.push('points');
    }

    coerce('fill');
    if(traceOut.fill !== 'none') {
        handleFillColorDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    if(traceOut.fill === 'tonext' || traceOut.fill === 'toself') {
        dfltHoverOn.push('fills');
    }
    coerce('hoveron', dfltHoverOn.join('+') || 'points');

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};
