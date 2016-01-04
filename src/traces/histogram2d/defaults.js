/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var handleSampleDefaults = require('./sample_defaults');
var colorscaleDefaults = require('../../components/colorscale/defaults');
var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    handleSampleDefaults(traceIn, traceOut, coerce);

    coerce('zsmooth');

    colorscaleDefaults(
        traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'z'}
    );
};
