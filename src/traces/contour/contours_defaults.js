/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');

module.exports = function handleContourDefaults(traceIn, traceOut, coerce) {
    var contourStart = Lib.coerce2(traceIn, traceOut, attributes, 'contours.start');
    var contourEnd = Lib.coerce2(traceIn, traceOut, attributes, 'contours.end');
    var missingEnd = (contourStart === false) || (contourEnd === false);

    // normally we only need size if autocontour is off. But contour.calc
    // pushes its calculated contour size back to the input trace, so for
    // things like restyle that can call supplyDefaults without calc
    // after the initial draw, we can just reuse the previous calculation
    var contourSize = coerce('contours.size');
    var autoContour;

    if(missingEnd) autoContour = traceOut.autocontour = true;
    else autoContour = coerce('autocontour', false);

    if(autoContour || !contourSize) coerce('ncontours');
};
