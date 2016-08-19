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

    var containerIn = Lib.isPlainObject(layoutIn[axName].rangeslider) ?
            layoutIn[axName].rangeslider : {},
        containerOut = layoutOut[axName].rangeslider = {};

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, attributes, attr, dflt);
    }

    coerce('bgcolor');
    coerce('bordercolor');
    coerce('borderwidth');
    coerce('thickness');
    coerce('visible');
    coerce('range');

    // Expand slider range to the axis range
    if(containerOut.range && !layoutOut[axName].autorange) {
        var outRange = containerOut.range,
            axRange = layoutOut[axName].range;

        outRange[0] = Math.min(outRange[0], axRange[0]);
        outRange[1] = Math.max(outRange[1], axRange[1]);
    } else {
        layoutOut[axName]._needsExpand = true;
    }

    if(containerOut.visible) {
        counterAxes.forEach(function(ax) {
            var opposing = layoutOut[ax] || {};
            opposing.fixedrange = true;
            layoutOut[ax] = opposing;
        });
    }
};
