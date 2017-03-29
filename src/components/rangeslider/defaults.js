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

module.exports = function handleDefaults(layoutIn, layoutOut, axName) {
    if(!layoutIn[axName].rangeslider) return;

    // not super proud of this (maybe store _ in axis object instead
    if(!Lib.isPlainObject(layoutIn[axName].rangeslider)) {
        layoutIn[axName].rangeslider = {};
    }

    var containerIn = layoutIn[axName].rangeslider,
        axOut = layoutOut[axName],
        containerOut = axOut.rangeslider = {};

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, attributes, attr, dflt);
    }

    var visible = coerce('visible');
    if(!visible) return;

    coerce('bgcolor', layoutOut.plot_bgcolor);
    coerce('bordercolor');
    coerce('borderwidth');
    coerce('thickness');

    coerce('autorange', !axOut.isValidRange(containerIn.range));
    coerce('range');

    // Expand slider range to the axis range
    // TODO: what if the ranges are reversed?
    if(containerOut.range) {
        var outRange = containerOut.range,
            axRange = axOut.range;

        outRange[0] = axOut.l2r(Math.min(axOut.r2l(outRange[0]), axOut.r2l(axRange[0])));
        outRange[1] = axOut.l2r(Math.max(axOut.r2l(outRange[1]), axOut.r2l(axRange[1])));
    }

    axOut.cleanRange('rangeslider.range');

    // to map back range slider (auto) range
    containerOut._input = containerIn;
};
