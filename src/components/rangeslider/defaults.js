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
var oppAxisAttrs = require('./oppaxis_attributes');
var axisIds = require('../../plots/cartesian/axis_ids');

module.exports = function handleDefaults(layoutIn, layoutOut, axName) {
    var axIn = layoutIn[axName];
    var axOut = layoutOut[axName];

    if(!(axIn.rangeslider || layoutOut._requestRangeslider[axOut._id])) return;

    // not super proud of this (maybe store _ in axis object instead
    if(!Lib.isPlainObject(axIn.rangeslider)) {
        axIn.rangeslider = {};
    }

    var containerIn = axIn.rangeslider;
    var containerOut = axOut.rangeslider = {};

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, attributes, attr, dflt);
    }

    function coerceRange(rangeContainerIn, rangeContainerOut, attr, dflt) {
        return Lib.coerce(rangeContainerIn, rangeContainerOut, oppAxisAttrs, attr, dflt);
    }

    var visible = coerce('visible');
    if(!visible) return;

    coerce('bgcolor', layoutOut.plot_bgcolor);
    coerce('bordercolor');
    coerce('borderwidth');
    coerce('thickness');

    axOut._rangesliderAutorange = coerce('autorange', !axOut.isValidRange(containerIn.range));
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

            var yAxOut = layoutOut[yName];

            var rangemodeDflt;
            if(rangeContainerIn.range && yAxOut.isValidRange(rangeContainerIn.range)) {
                rangemodeDflt = 'fixed';
            }

            var rangeMode = coerceRange(rangeContainerIn, rangeContainerOut, 'rangemode', rangemodeDflt);
            if(rangeMode !== 'match') {
                coerceRange(rangeContainerIn, rangeContainerOut, 'range', yAxOut.range.slice());
            }
            yAxOut._rangesliderAutorange = (rangeMode === 'auto');
        }
    }

    // to map back range slider (auto) range
    containerOut._input = containerIn;
};
