/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var id2name = require('./axis_ids').id2name;

var ALMOST_EQUAL = 1 - 1e-6;


module.exports = function enforceAxisConstraints(gd) {
    var fullLayout = gd._fullLayout;
    var layout = gd.layout;
    var constraintGroups = fullLayout._axisConstraintGroups;

    var i, j, axisID, ax, normScale;

    for(i = 0; i < constraintGroups.length; i++) {
        var group = constraintGroups[i];
        var axisIDs = Object.keys(group);

        var minScale = Infinity;
        var maxScale = 0;
        var normScales = {};
        var axes = {};

        // find the (normalized) scale of each axis in the group
        for(j = 0; j < axisIDs.length; j++) {
            axisID = axisIDs[j];
            axes[axisID] = ax = fullLayout[id2name(axisID)];

            // set axis scale here so we can use _m rather than
            // having to calculate it from length and range
            ax.setScale();

            // abs: inverted scales still satisfy the constraint
            normScales[axisID] = normScale = Math.abs(ax._m) / group[axisID];
            minScale = Math.min(minScale, normScale);
            maxScale = Math.max(maxScale, normScale);
        }

        // Do we have a constraint mismatch? Give a small buffer for rounding errors
        if(minScale > ALMOST_EQUAL * maxScale) continue;

        // now increase any ranges we need to until all normalized scales are equal
        for(j = 0; j < axisIDs.length; j++) {
            axisID = axisIDs[j];
            normScale = normScales[axisID];
            if(normScale > minScale) {
                ax = axes[axisID];
                var rangeLinear = [ax.r2l(ax.range[0]), ax.r2l(ax.range[1])];
                var center = (rangeLinear[0] + rangeLinear[1]) / 2;
                var newHalfSpan = (center - rangeLinear[0]) * normScale / minScale;
                ax.range = layout[id2name(axisID)].range = [
                    ax.l2r(center - newHalfSpan),
                    ax.l2r(center + newHalfSpan)
                ];
            }
        }
    }
};
