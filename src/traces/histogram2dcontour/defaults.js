/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var handleSampleDefaults = require('../histogram2d/sample_defaults');
var handleStyleDefaults = require('../contour/style_defaults');
var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    handleSampleDefaults(traceIn, traceOut, coerce);

    var contourStart = Lib.coerce2(traceIn, traceOut, attributes, 'contours.start'),
        contourEnd = Lib.coerce2(traceIn, traceOut, attributes, 'contours.end'),
        autocontour = coerce('autocontour', !(contourStart && contourEnd));

    if(autocontour) coerce('ncontours');
    else coerce('contours.size');

    handleStyleDefaults(traceIn, traceOut, coerce, layout);
};
