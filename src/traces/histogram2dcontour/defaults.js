/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var handleSampleDefaults = require('../histogram2d/sample_defaults');
var handleContoursDefaults = require('../contour/contours_defaults');
var handleStyleDefaults = require('../contour/style_defaults');
var attributes = require('./attributes');


module.exports = function supplyDefaults(gd, traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    function coerce2(attr) {
        return Lib.coerce2(traceIn, traceOut, attributes, attr);
    }

    handleSampleDefaults(gd, traceIn, traceOut, coerce, layout);
    if(traceOut.visible === false) return;

    handleContoursDefaults(gd, traceIn, traceOut, coerce, coerce2);
    handleStyleDefaults(gd, traceIn, traceOut, coerce, layout);
    coerce('hovertemplate');
};
