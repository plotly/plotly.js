/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var handleXYDefaults = require('./xy_defaults');
var handleABDefaults = require('./ab_defaults');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, fullLayout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    console.log('fullLayout:', fullLayout);

    coerce('carpetid');
    coerce('cheaterslope');

    Lib.coerceFont(coerce, 'font');
    console.log('traceOut.font:', fullLayout.font);

    traceOut.cheaterslope = parseFloat(traceIn.cheaterslope);

    handleABDefaults(traceIn, traceOut, fullLayout, coerce);

    if (traceOut.a.length < 3) {
        traceOut.aaxis.smoothing = 0;
    }

    if (traceOut.b.length < 3) {
        traceOut.baxis.smoothing = 0;
    }

    var len = handleXYDefaults(traceIn, traceOut, coerce);

    if(!len) {
        traceOut.visible = false;
        return;
    }
};
