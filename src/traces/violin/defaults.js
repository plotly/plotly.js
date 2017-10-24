/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');

var boxDefaults = require('../box/defaults');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    boxDefaults.handleSampleDefaults(traceIn, traceOut, coerce, layout);
    if(traceOut.visible === false) return;

    coerce('bandwidth');
    coerce('scaleby');
    coerce('span');
    coerce('side');

    coerce('line.color', (traceIn.marker || {}).color || defaultColor);
    coerce('line.width');
    coerce('line.smoothing');
    coerce('fillcolor', Color.addOpacity(traceOut.line.color, 0.5));

    boxDefaults.handlePointsDefaults(traceIn, traceOut, coerce, {prefix: ''});
};
