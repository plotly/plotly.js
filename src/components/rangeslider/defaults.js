/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var rangeAttributes = require('./range_attributes');
var axisIds = require('../../plots/cartesian/axis_ids');

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

    function coerceRange(yName, attr, dflt) {
        return Lib.coerce(containerIn[yName], containerOut[yName], rangeAttributes, attr, dflt);
    }

    var visible = coerce('visible');
    if(!visible) return;

    coerce('bgcolor', layoutOut.plot_bgcolor);
    coerce('bordercolor');
    coerce('borderwidth');
    coerce('thickness');

    coerce('autorange', !axOut.isValidRange(containerIn.range));
    coerce('range');

    var subplots = layoutOut._subplots;
    var yIds = subplots.yaxis;
    var yNames = Lib.simpleMap(yIds, axisIds.id2name);
    for(var i = 0; i < yNames.length; i++) {
        var yName = yNames[i];
        if(!containerIn[yName]) {
            containerIn[yName] = {};
        }
        if(!containerOut[yName]) {
            containerOut[yName] = {};
        }

        if(containerIn[yName].range && layoutOut[yName].isValidRange(containerIn[yName].range)) {
            coerceRange(yName, 'rangemode', 'fixed');
        } else {
            coerceRange(yName, 'rangemode', 'auto');
        }

        layoutOut[yName].cleanRange('rangeslider.' + yName + '.range');
        coerceRange(yName, 'range', layoutOut[yName].rangeslider[yName].range.slice());
        delete layoutOut[yName].rangeslider;
    }

    // to map back range slider (auto) range
    containerOut._input = containerIn;
};
