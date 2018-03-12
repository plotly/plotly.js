/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var id2name = require('./axis_ids').id2name;
var scaleZoom = require('./scale_zoom');
var makePadFn = require('./autorange').makePadFn;

var ALMOST_EQUAL = require('../../constants/numerical').ALMOST_EQUAL;

var FROM_BL = require('../../constants/alignment').FROM_BL;


exports.enforce = function enforceAxisConstraints(gd) {
    var fullLayout = gd._fullLayout;
    var constraintGroups = fullLayout._axisConstraintGroups || [];

    var i, j, axisID, ax, normScale, mode, factor;

    for(i = 0; i < constraintGroups.length; i++) {
        var group = constraintGroups[i];
        var axisIDs = Object.keys(group);

        var minScale = Infinity;
        var maxScale = 0;
        // mostly matchScale will be the same as minScale
        // ie we expand axis ranges to encompass *everything*
        // that's currently in any of their ranges, but during
        // autorange of a subset of axes we will ignore other
        // axes for this purpose.
        var matchScale = Infinity;
        var normScales = {};
        var axes = {};
        var hasAnyDomainConstraint = false;

        // find the (normalized) scale of each axis in the group
        for(j = 0; j < axisIDs.length; j++) {
            axisID = axisIDs[j];
            axes[axisID] = ax = fullLayout[id2name(axisID)];

            if(ax._inputDomain) ax.domain = ax._inputDomain.slice();
            else ax._inputDomain = ax.domain.slice();

            if(!ax._inputRange) ax._inputRange = ax.range.slice();

            // set axis scale here so we can use _m rather than
            // having to calculate it from length and range
            ax.setScale();

            // abs: inverted scales still satisfy the constraint
            normScales[axisID] = normScale = Math.abs(ax._m) / group[axisID];
            minScale = Math.min(minScale, normScale);
            if(ax.constrain === 'domain' || !ax._constraintShrinkable) {
                matchScale = Math.min(matchScale, normScale);
            }

            // this has served its purpose, so remove it
            delete ax._constraintShrinkable;
            maxScale = Math.max(maxScale, normScale);

            if(ax.constrain === 'domain') hasAnyDomainConstraint = true;
        }

        // Do we have a constraint mismatch? Give a small buffer for rounding errors
        if(minScale > ALMOST_EQUAL * maxScale && !hasAnyDomainConstraint) continue;

        // now increase any ranges we need to until all normalized scales are equal
        for(j = 0; j < axisIDs.length; j++) {
            axisID = axisIDs[j];
            normScale = normScales[axisID];
            ax = axes[axisID];
            mode = ax.constrain;

            // even if the scale didn't change, if we're shrinking domain
            // we need to recalculate in case `constraintoward` changed
            if(normScale !== matchScale || mode === 'domain') {
                factor = normScale / matchScale;

                if(mode === 'range') {
                    scaleZoom(ax, factor);
                }
                else {
                    // mode === 'domain'

                    var inputDomain = ax._inputDomain;
                    var domainShrunk = (ax.domain[1] - ax.domain[0]) /
                        (inputDomain[1] - inputDomain[0]);
                    var rangeShrunk = (ax.r2l(ax.range[1]) - ax.r2l(ax.range[0])) /
                        (ax.r2l(ax._inputRange[1]) - ax.r2l(ax._inputRange[0]));

                    factor /= domainShrunk;

                    if(factor * rangeShrunk < 1) {
                        // we've asked to magnify the axis more than we can just by
                        // enlarging the domain - so we need to constrict range
                        ax.domain = ax._input.domain = inputDomain.slice();
                        scaleZoom(ax, factor);
                        continue;
                    }

                    if(rangeShrunk < 1) {
                        // the range has previously been constricted by ^^, but we've
                        // switched to the domain-constricted regime, so reset range
                        ax.range = ax._input.range = ax._inputRange.slice();
                        factor *= rangeShrunk;
                    }

                    if(ax.autorange && ax._min.length && ax._max.length) {
                        /*
                         * range & factor may need to change because range was
                         * calculated for the larger scaling, so some pixel
                         * paddings may get cut off when we reduce the domain.
                         *
                         * This is easier than the regular autorange calculation
                         * because we already know the scaling `m`, but we still
                         * need to cut out impossible constraints (like
                         * annotations with super-long arrows). That's what
                         * outerMin/Max are for - if the expansion was going to
                         * go beyond the original domain, it must be impossible
                         */
                        var rl0 = ax.r2l(ax.range[0]);
                        var rl1 = ax.r2l(ax.range[1]);
                        var rangeCenter = (rl0 + rl1) / 2;
                        var rangeMin = rangeCenter;
                        var rangeMax = rangeCenter;
                        var halfRange = Math.abs(rl1 - rangeCenter);
                        // extra tiny bit for rounding errors, in case we actually
                        // *are* expanding to the full domain
                        var outerMin = rangeCenter - halfRange * factor * 1.0001;
                        var outerMax = rangeCenter + halfRange * factor * 1.0001;
                        var getPad = makePadFn(ax);

                        updateDomain(ax, factor);
                        ax.setScale();
                        var m = Math.abs(ax._m);
                        var newVal;
                        var k;

                        for(k = 0; k < ax._min.length; k++) {
                            newVal = ax._min[k].val - getPad(ax._min[k]) / m;
                            if(newVal > outerMin && newVal < rangeMin) {
                                rangeMin = newVal;
                            }
                        }

                        for(k = 0; k < ax._max.length; k++) {
                            newVal = ax._max[k].val + getPad(ax._max[k]) / m;
                            if(newVal < outerMax && newVal > rangeMax) {
                                rangeMax = newVal;
                            }
                        }

                        var domainExpand = (rangeMax - rangeMin) / (2 * halfRange);
                        factor /= domainExpand;

                        rangeMin = ax.l2r(rangeMin);
                        rangeMax = ax.l2r(rangeMax);
                        ax.range = ax._input.range = (rl0 < rl1) ?
                            [rangeMin, rangeMax] : [rangeMax, rangeMin];
                    }

                    updateDomain(ax, factor);
                }
            }
        }
    }
};

// For use before autoranging, check if this axis was previously constrained
// by domain but no longer is
exports.clean = function cleanConstraints(gd, ax) {
    if(ax._inputDomain) {
        var isConstrained = false;
        var axId = ax._id;
        var constraintGroups = gd._fullLayout._axisConstraintGroups;
        for(var j = 0; j < constraintGroups.length; j++) {
            if(constraintGroups[j][axId]) {
                isConstrained = true;
                break;
            }
        }
        if(!isConstrained || ax.constrain !== 'domain') {
            ax._input.domain = ax.domain = ax._inputDomain;
            delete ax._inputDomain;
        }
    }
};

function updateDomain(ax, factor) {
    var inputDomain = ax._inputDomain;
    var centerFraction = FROM_BL[ax.constraintoward];
    var center = inputDomain[0] + (inputDomain[1] - inputDomain[0]) * centerFraction;

    ax.domain = ax._input.domain = [
        center + (inputDomain[0] - center) / factor,
        center + (inputDomain[1] - center) / factor
    ];
}
