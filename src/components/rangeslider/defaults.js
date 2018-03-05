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

    function coerceRange(rangeContainerIn, rangeContainerOut, attr, dflt) {
        return Lib.coerce(rangeContainerIn, rangeContainerOut, rangeAttributes, attr, dflt);
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
    if(subplots) {
        var yIds = subplots.cartesian
            .filter(function(subplotId) {
                return subplotId.substr(0, subplotId.indexOf('y')) === axisIds.name2id(axName);
            })
            .map(function(subplotId) {
                return subplotId.substr(subplotId.indexOf('y'), subplotId.length);
            });
        var yNames = Lib.simpleMap(yIds, axisIds.id2name);
        for(var i = 0; i < yNames.length; i++) {
            var yName = yNames[i];

            var rangeContainerIn = containerIn[yName] || {};
            var rangeContainerOut = containerOut[yName] = {};

            if(rangeContainerIn.range && layoutOut[yName].isValidRange(rangeContainerIn.range)) {
                coerceRange(rangeContainerIn, rangeContainerOut, 'rangemode', 'fixed');
            } else {
                coerceRange(rangeContainerIn, rangeContainerOut, 'rangemode');
            }

            coerceRange(rangeContainerIn, rangeContainerOut, 'range', layoutOut[yName].range.slice());
        }
    }

    // to map back range slider (auto) range
    containerOut._input = containerIn;
};
