/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

var autorange = require('./autorange');
var id2name = require('./axis_ids').id2name;
var layoutAttributes = require('./layout_attributes');
var scaleZoom = require('./scale_zoom');
var setConvert = require('./set_convert');

var ALMOST_EQUAL = require('../../constants/numerical').ALMOST_EQUAL;
var FROM_BL = require('../../constants/alignment').FROM_BL;

exports.handleDefaults = function(layoutIn, layoutOut, opts) {
    var axIds = opts.axIds;
    var axHasImage = opts.axHasImage;

    // sets of axes linked by `scaleanchor` OR `matches` along with the
    // scaleratios compounded together, populated in handleConstraintDefaults
    var constraintGroups = layoutOut._axisConstraintGroups = [];
    // similar to _axisConstraintGroups, but only matching axes
    var matchGroups = layoutOut._axisMatchGroups = [];

    var i, group, axId, axName, axIn, axOut, attr, val;

    for(i = 0; i < axIds.length; i++) {
        axName = id2name(axIds[i]);
        axIn = layoutIn[axName];
        axOut = layoutOut[axName];

        handleOneAxDefaults(axIn, axOut, {
            axIds: axIds,
            layoutOut: layoutOut,
            hasImage: axHasImage[axName]
        });
    }

    // save matchGroup on each matching axis
    function stash(groups, stashAttr) {
        for(i = 0; i < groups.length; i++) {
            group = groups[i];
            for(axId in group) {
                layoutOut[id2name(axId)][stashAttr] = group;
            }
        }
    }
    stash(matchGroups, '_matchGroup');

    // If any axis in a constraint group is fixedrange, they all get fixed
    // This covers matches axes, as they're now in the constraintgroup too
    // and have not yet been removed (if the group is *only* matching)
    for(i = 0; i < constraintGroups.length; i++) {
        group = constraintGroups[i];
        for(axId in group) {
            axOut = layoutOut[id2name(axId)];
            if(axOut.fixedrange) {
                for(var axId2 in group) {
                    var axName2 = id2name(axId2);
                    if((layoutIn[axName2] || {}).fixedrange === false) {
                        Lib.warn(
                            'fixedrange was specified as false for axis ' +
                            axName2 + ' but was overridden because another ' +
                            'axis in its constraint group has fixedrange true'
                        );
                    }
                    layoutOut[axName2].fixedrange = true;
                }
                break;
            }
        }
    }

    // remove constraint groups that simply duplicate match groups
    i = 0;
    while(i < constraintGroups.length) {
        group = constraintGroups[i];
        for(axId in group) {
            axOut = layoutOut[id2name(axId)];
            if(axOut._matchGroup && Object.keys(axOut._matchGroup).length === Object.keys(group).length) {
                constraintGroups.splice(i, 1);
                i--;
            }
            break;
        }
        i++;
    }

    // save constraintGroup on each constrained axis
    stash(constraintGroups, '_constraintGroup');

    // make sure `matching` axes share values of necessary attributes
    // Precedence (base axis is the one that doesn't list a `matches`, ie others
    // all point to it):
    // (1) explicitly defined value in the base axis
    // (2) explicitly defined in another axis (arbitrary order)
    // (3) default in the base axis
    var matchAttrs = [
        'constrain',
        'range',
        'autorange',
        'rangemode',
        'rangebreaks',
        'categoryorder',
        'categoryarray'
    ];
    var hasRange = false;
    var hasDayOfWeekBreaks = false;

    function setAttrVal() {
        val = axOut[attr];
        if(attr === 'rangebreaks') {
            hasDayOfWeekBreaks = axOut._hasDayOfWeekBreaks;
        }
    }

    for(i = 0; i < matchGroups.length; i++) {
        group = matchGroups[i];

        // find 'matching' range attrs
        for(var j = 0; j < matchAttrs.length; j++) {
            attr = matchAttrs[j];
            val = null;
            var baseAx;
            for(axId in group) {
                axName = id2name(axId);
                axIn = layoutIn[axName];
                axOut = layoutOut[axName];
                if(!(attr in axOut)) {
                    continue;
                }
                if(!axOut.matches) {
                    baseAx = axOut;
                    // top priority: explicit value in base axis
                    if(attr in axIn) {
                        setAttrVal();
                        break;
                    }
                }
                if(val === null && attr in axIn) {
                    // second priority: first explicit value in another axis
                    setAttrVal();
                }
            }

            // special logic for coupling of range and autorange
            // if nobody explicitly specifies autorange, but someone does
            // explicitly specify range, autorange must be disabled.
            if(attr === 'range' && val) {
                hasRange = true;
            }
            if(attr === 'autorange' && val === null && hasRange) {
                val = false;
            }

            if(val === null && attr in baseAx) {
                // fallback: default value in base axis
                val = baseAx[attr];
            }
            // but we still might not have a value, which is fine.
            if(val !== null) {
                for(axId in group) {
                    axOut = layoutOut[id2name(axId)];
                    axOut[attr] = attr === 'range' ? val.slice() : val;

                    if(attr === 'rangebreaks') {
                        axOut._hasDayOfWeekBreaks = hasDayOfWeekBreaks;
                        setConvert(axOut, layoutOut);
                    }
                }
            }
        }
    }
};

function handleOneAxDefaults(axIn, axOut, opts) {
    var axIds = opts.axIds;
    var layoutOut = opts.layoutOut;
    var hasImage = opts.hasImage;
    var constraintGroups = layoutOut._axisConstraintGroups;
    var matchGroups = layoutOut._axisMatchGroups;
    var axId = axOut._id;
    var axLetter = axId.charAt(0);
    var splomStash = ((layoutOut._splomAxes || {})[axLetter] || {})[axId] || {};
    var thisID = axOut._id;
    var isX = thisID.charAt(0) === 'x';

    // Clear _matchGroup & _constraintGroup so relinkPrivateKeys doesn't keep
    // an old one around. If this axis is in a group we'll set this again later
    axOut._matchGroup = null;
    axOut._constraintGroup = null;

    function coerce(attr, dflt) {
        return Lib.coerce(axIn, axOut, layoutAttributes, attr, dflt);
    }

    // coerce the constraint mechanics even if this axis has no scaleanchor
    // because it may be the anchor of another axis.
    coerce('constrain', hasImage ? 'domain' : 'range');
    Lib.coerce(axIn, axOut, {
        constraintoward: {
            valType: 'enumerated',
            values: isX ? ['left', 'center', 'right'] : ['bottom', 'middle', 'top'],
            dflt: isX ? 'center' : 'middle'
        }
    }, 'constraintoward');

    // If this axis is already part of a constraint group, we can't
    // scaleanchor any other axis in that group, or we'd make a loop.
    // Filter axIds to enforce this, also matching axis types.
    var thisType = axOut.type;
    var i, idi;

    var linkableAxes = [];
    for(i = 0; i < axIds.length; i++) {
        idi = axIds[i];
        if(idi === thisID) continue;

        var axi = layoutOut[id2name(idi)];
        if(axi.type === thisType) {
            linkableAxes.push(idi);
        }
    }

    var thisGroup = getConstraintGroup(constraintGroups, thisID);
    if(thisGroup) {
        var linkableAxesNoLoops = [];
        for(i = 0; i < linkableAxes.length; i++) {
            idi = linkableAxes[i];
            if(!thisGroup[idi]) linkableAxesNoLoops.push(idi);
        }
        linkableAxes = linkableAxesNoLoops;
    }

    var canLink = linkableAxes.length;

    var matches, scaleanchor;

    if(canLink && (axIn.matches || splomStash.matches)) {
        matches = Lib.coerce(axIn, axOut, {
            matches: {
                valType: 'enumerated',
                values: linkableAxes,
                dflt: linkableAxes.indexOf(splomStash.matches) !== -1 ? splomStash.matches : undefined
            }
        }, 'matches');
    }

    // 'matches' wins over 'scaleanchor' - each axis can only specify one
    // constraint, but you can chain matches and scaleanchor constraints by
    // specifying them in separate axes.
    var scaleanchorDflt = hasImage && !isX ? axOut.anchor : undefined;
    if(canLink && !matches && (axIn.scaleanchor || scaleanchorDflt)) {
        scaleanchor = Lib.coerce(axIn, axOut, {
            scaleanchor: {
                valType: 'enumerated',
                values: linkableAxes
            }
        }, 'scaleanchor', scaleanchorDflt);
    }

    if(matches) {
        axOut._matchGroup = updateConstraintGroups(matchGroups, thisID, matches, 1);

        // Also include match constraints in the scale groups
        var matchedAx = layoutOut[id2name(matches)];
        var matchRatio = extent(layoutOut, axOut) / extent(layoutOut, matchedAx);
        if(isX !== (matches.charAt(0) === 'x')) {
            // We don't yet know the actual scale ratio of x/y matches constraints,
            // due to possible automargins, so just leave a placeholder for this:
            // 'x' means "x size over y size", 'y' means the inverse.
            // in principle in the constraint group you could get multiple of these.
            matchRatio = (isX ? 'x' : 'y') + matchRatio;
        }
        updateConstraintGroups(constraintGroups, thisID, matches, matchRatio);
    } else if(axIn.matches && axIds.indexOf(axIn.matches) !== -1) {
        Lib.warn('ignored ' + axOut._name + '.matches: "' +
            axIn.matches + '" to avoid an infinite loop');
    }

    if(scaleanchor) {
        var scaleratio = coerce('scaleratio');

        // TODO: I suppose I could do attribute.min: Number.MIN_VALUE to avoid zero,
        // but that seems hacky. Better way to say "must be a positive number"?
        // Of course if you use several super-tiny values you could eventually
        // force a product of these to zero and all hell would break loose...
        // Likewise with super-huge values.
        if(!scaleratio) scaleratio = axOut.scaleratio = 1;

        updateConstraintGroups(constraintGroups, thisID, scaleanchor, scaleratio);
    } else if(axIn.scaleanchor && axIds.indexOf(axIn.scaleanchor) !== -1) {
        Lib.warn('ignored ' + axOut._name + '.scaleanchor: "' +
            axIn.scaleanchor + '" to avoid either an infinite loop ' +
            'and possibly inconsistent scaleratios, or because this axis ' +
            'declares a *matches* constraint.');
    }
}

function extent(layoutOut, ax) {
    var domain = ax.domain;
    if(!domain) {
        // at this point overlaying axes haven't yet inherited their main domains
        // TODO: constrain: domain with overlaying axes is likely a bug.
        domain = layoutOut[id2name(ax.overlaying)].domain;
    }
    return domain[1] - domain[0];
}

function getConstraintGroup(groups, thisID) {
    for(var i = 0; i < groups.length; i++) {
        if(groups[i][thisID]) {
            return groups[i];
        }
    }
    return null;
}

/*
 * Add this axis to the axis constraint groups, which is the collection
 * of axes that are all constrained together on scale (or matching).
 *
 * constraintGroups: a list of objects. each object is
 * {axis_id: scale_within_group}, where scale_within_group is
 * only important relative to the rest of the group, and defines
 * the relative scales between all axes in the group
 *
 * thisGroup: the group the current axis is already in
 * thisID: the id if the current axis
 * thatID: the id of the axis to scale it with
 * scaleratio: the ratio of this axis to the thatID axis
 */
function updateConstraintGroups(constraintGroups, thisID, thatID, scaleratio) {
    var i, j, groupi, keyj, thisGroupIndex;

    var thisGroup = getConstraintGroup(constraintGroups, thisID);

    if(thisGroup === null) {
        thisGroup = {};
        thisGroup[thisID] = 1;
        thisGroupIndex = constraintGroups.length;
        constraintGroups.push(thisGroup);
    } else {
        thisGroupIndex = constraintGroups.indexOf(thisGroup);
    }

    var thisGroupKeys = Object.keys(thisGroup);

    // we know that this axis isn't in any other groups, but we don't know
    // about the thatID axis. If it is, we need to merge the groups.
    for(i = 0; i < constraintGroups.length; i++) {
        groupi = constraintGroups[i];
        if(i !== thisGroupIndex && groupi[thatID]) {
            var baseScale = groupi[thatID];
            for(j = 0; j < thisGroupKeys.length; j++) {
                keyj = thisGroupKeys[j];
                groupi[keyj] = multiplyScales(baseScale, multiplyScales(scaleratio, thisGroup[keyj]));
            }
            constraintGroups.splice(thisGroupIndex, 1);
            return;
        }
    }

    // otherwise, we insert the new thatID axis as the base scale (1)
    // in its group, and scale the rest of the group to it
    if(scaleratio !== 1) {
        for(j = 0; j < thisGroupKeys.length; j++) {
            var key = thisGroupKeys[j];
            thisGroup[key] = multiplyScales(scaleratio, thisGroup[key]);
        }
    }
    thisGroup[thatID] = 1;
}

// scales may be numbers or 'x1.3', 'yy4.5' etc to multiply by as-yet-unknown
// ratios between x and y plot sizes n times
function multiplyScales(a, b) {
    var aPrefix = '';
    var bPrefix = '';
    var aLen, bLen;

    if(typeof a === 'string') {
        aPrefix = a.match(/^[xy]*/)[0];
        aLen = aPrefix.length;
        a = +a.substr(aLen);
    }

    if(typeof b === 'string') {
        bPrefix = b.match(/^[xy]*/)[0];
        bLen = bPrefix.length;
        b = +b.substr(bLen);
    }

    var c = a * b;

    // just two numbers
    if(!aLen && !bLen) {
        return c;
    }

    // one or more prefixes of the same type
    if(!aLen || !bLen || aPrefix.charAt(0) === bPrefix.charAt(0)) {
        return aPrefix + bPrefix + (a * b);
    }

    // x and y cancel each other out exactly - back to a number
    if(aLen === bLen) {
        return c;
    }

    // partial cancelation of prefixes
    return (aLen > bLen ? aPrefix.substr(bLen) : bPrefix.substr(aLen)) + c;
}

function finalRatios(group, fullLayout) {
    var size = fullLayout._size;
    var yRatio = size.h / size.w;
    var out = {};
    var keys = Object.keys(group);
    for(var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var val = group[key];

        if(typeof val === 'string') {
            var prefix = val.match(/^[xy]*/)[0];
            var pLen = prefix.length;
            val = +val.substr(pLen);
            var mult = prefix.charAt(0) === 'y' ? yRatio : (1 / yRatio);
            for(var j = 0; j < pLen; j++) {
                val *= mult;
            }
        }

        out[key] = val;
    }
    return out;
}

exports.enforce = function enforce(gd) {
    var fullLayout = gd._fullLayout;
    var constraintGroups = fullLayout._axisConstraintGroups || [];

    var i, j, group, axisID, ax, normScale, mode, factor;

    // matching constraints are handled in the autorange code when autoranged,
    // or in the supplyDefaults code when explicitly ranged.
    // now we just need to handle scaleanchor constraints
    // matches constraints that chain with scaleanchor constraints are included
    // here too, but because matches has already been satisfied,
    // any changes here should preserve that.
    for(i = 0; i < constraintGroups.length; i++) {
        group = finalRatios(constraintGroups[i], fullLayout);
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
                } else {
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

                    if(ax.autorange) {
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
                        var getPadMin = autorange.makePadFn(fullLayout, ax, 0);
                        var getPadMax = autorange.makePadFn(fullLayout, ax, 1);

                        updateDomain(ax, factor);
                        var m = Math.abs(ax._m);
                        var extremes = autorange.concatExtremes(gd, ax);
                        var minArray = extremes.min;
                        var maxArray = extremes.max;
                        var newVal;
                        var k;

                        for(k = 0; k < minArray.length; k++) {
                            newVal = minArray[k].val - getPadMin(minArray[k]) / m;
                            if(newVal > outerMin && newVal < rangeMin) {
                                rangeMin = newVal;
                            }
                        }

                        for(k = 0; k < maxArray.length; k++) {
                            newVal = maxArray[k].val + getPadMax(maxArray[k]) / m;
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

exports.getAxisGroup = function getAxisGroup(fullLayout, axId) {
    var matchGroups = fullLayout._axisMatchGroups;

    for(var i = 0; i < matchGroups.length; i++) {
        var group = matchGroups[i];
        if(group[axId]) return 'g' + i;
    }
    return axId;
};

// For use before autoranging, check if this axis was previously constrained
// by domain but no longer is
exports.clean = function clean(gd, ax) {
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
    ax.setScale();
}
