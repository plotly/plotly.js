/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isosurfaceDefaults = require('../isosurface/defaults');
var opacityscaleDefaults = require('../../components/opacityscale/defaults');
var Lib = require('../../lib');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    isosurfaceDefaults(traceIn, traceOut, defaultColor, layout);

    opacityscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: ''});
};
