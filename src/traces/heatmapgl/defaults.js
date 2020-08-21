/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var handleXYZDefaults = require('../heatmap/xyz_defaults');
var colorscaleDefaults = require('../../components/colorscale/defaults');
var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var validData = handleXYZDefaults(traceIn, traceOut, coerce, layout);
    if(!validData) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('zsmooth');

    colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'z'});
};
