/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');


module.exports = function handleDefaults(layoutIn, layoutOut, axName, counterAxes) {
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

    coerce('bgcolor', layoutOut.plot_bgcolor);
    coerce('bordercolor');
    coerce('borderwidth');
    coerce('thickness');
    coerce('visible');
    coerce('range');

    // Expand slider range to the axis range
    if(containerOut.range && !axOut.autorange) {
        var outRange = containerOut.range,
            axRange = axOut.range,
            l2r = axOut.l2r,
            r2l = axOut.r2l;

        outRange[0] = l2r(Math.min(r2l(outRange[0]), r2l(axRange[0])));
        outRange[1] = l2r(Math.max(r2l(outRange[1]), r2l(axRange[1])));
    } else {
        axOut._needsExpand = true;
    }

    if(containerOut.visible) {
        counterAxes.forEach(function(ax) {
            var opposing = layoutOut[ax] || {};
            opposing.fixedrange = true;
            layoutOut[ax] = opposing;
        });
    }

    // to map back range slider (auto) range
    containerOut._input = containerIn;
};
