/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var handleSampleDefaults = require('./sample_defaults');
var handleStyleDefaults = require('../heatmap/style_defaults');
var colorscaleDefaults = require('../../components/colorscale/defaults');
var attributes = require('./attributes');


module.exports = function supplyDefaults(gd, traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    handleSampleDefaults(gd, traceIn, traceOut, coerce, layout);
    if(traceOut.visible === false) return;

    handleStyleDefaults(gd, traceIn, traceOut, coerce, layout);
    colorscaleDefaults(gd, traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'z'});
    coerce('hovertemplate');
};
