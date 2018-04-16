/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var FP_SAFE = require('../../constants/numerical').FP_SAFE;

module.exports = {
    getAutoRange: getAutoRange,
    makePadFn: makePadFn,
    doAutoRange: doAutoRange,
    expand: expand
};

// Find the autorange for this axis
//
// assumes ax._min and ax._max have already been set by calling axes.expand
// using calcdata from all traces. These are arrays of objects:
// {
//    val: calcdata value,
//    pad: extra pixels beyond this value,
//    extrapad: bool, does this point want 5% extra padding
// }
//
// Returns an array of [min, max]. These are calcdata for log and category axes
// and data for linear and date axes.
//
// TODO: we want to change log to data as well, but it's hard to do this
// maintaining backward compatibility. category will always have to use calcdata
// though, because otherwise values between categories (or outside all categories)
// would be impossible.
function getAutoRange(ax) {
    var newRange = [];
    var minmin = ax._min[0].val;
    var maxmax = ax._max[0].val;
    var mbest = 0;
    var axReverse = false;

    var getPad = makePadFn(ax);

    var i, j, minpt, maxpt, minbest, maxbest, dp, dv;

    for(i = 1; i < ax._min.length; i++) {
        if(minmin !== maxmax) break;
        minmin = Math.min(minmin, ax._min[i].val);
    }
    for(i = 1; i < ax._max.length; i++) {
        if(minmin !== maxmax) break;
        maxmax = Math.max(maxmax, ax._max[i].val);
    }

    if(ax.range) {
        var rng = Lib.simpleMap(ax.range, ax.r2l);
        axReverse = rng[1] < rng[0];
    }

    // one-time setting to easily reverse the axis
    // when plotting from code
    if(ax.autorange === 'reversed') {
        axReverse = true;
        ax.autorange = true;
    }

    for(i = 0; i < ax._min.length; i++) {
        minpt = ax._min[i];
        for(j = 0; j < ax._max.length; j++) {
            maxpt = ax._max[j];
            dv = maxpt.val - minpt.val;
            dp = ax._length - getPad(minpt) - getPad(maxpt);
            if(dv > 0 && dp > 0 && dv / dp > mbest) {
                minbest = minpt;
                maxbest = maxpt;
                mbest = dv / dp;
            }
        }
    }

    if(minmin === maxmax) {
        var lower = minmin - 1;
        var upper = minmin + 1;
        if(ax.rangemode === 'tozero') {
            newRange = minmin < 0 ? [lower, 0] : [0, upper];
        }
        else if(ax.rangemode === 'nonnegative') {
            newRange = [Math.max(0, lower), Math.max(0, upper)];
        }
        else {
            newRange = [lower, upper];
        }
    }
    else if(mbest) {
        if(ax.type === 'linear' || ax.type === '-') {
            if(ax.rangemode === 'tozero') {
                if(minbest.val >= 0) {
                    minbest = {val: 0, pad: 0};
                }
                if(maxbest.val <= 0) {
                    maxbest = {val: 0, pad: 0};
                }
            }
            else if(ax.rangemode === 'nonnegative') {
                if(minbest.val - mbest * getPad(minbest) < 0) {
                    minbest = {val: 0, pad: 0};
                }
                if(maxbest.val < 0) {
                    maxbest = {val: 1, pad: 0};
                }
            }

            // in case it changed again...
            mbest = (maxbest.val - minbest.val) /
                (ax._length - getPad(minbest) - getPad(maxbest));

        }

        newRange = [
            minbest.val - mbest * getPad(minbest),
            maxbest.val + mbest * getPad(maxbest)
        ];
    }

    // don't let axis have zero size, while still respecting tozero and nonnegative
    if(newRange[0] === newRange[1]) {
        if(ax.rangemode === 'tozero') {
            if(newRange[0] < 0) {
                newRange = [newRange[0], 0];
            }
            else if(newRange[0] > 0) {
                newRange = [0, newRange[0]];
            }
            else {
                newRange = [0, 1];
            }
        }
        else {
            newRange = [newRange[0] - 1, newRange[0] + 1];
            if(ax.rangemode === 'nonnegative') {
                newRange[0] = Math.max(0, newRange[0]);
            }
        }
    }

    // maintain reversal
    if(axReverse) newRange.reverse();

    return Lib.simpleMap(newRange, ax.l2r || Number);
}

/*
 * calculate the pixel padding for ax._min and ax._max entries with
 * optional extrapad as 5% of the total axis length
 */
function makePadFn(ax) {
    // 5% padding for points that specify extrapad: true
    var extrappad = ax._length / 20;

    // domain-constrained axes: base extrappad on the unconstrained
    // domain so it's consistent as the domain changes
    if((ax.constrain === 'domain') && ax._inputDomain) {
        extrappad *= (ax._inputDomain[1] - ax._inputDomain[0]) /
            (ax.domain[1] - ax.domain[0]);
    }

    return function getPad(pt) { return pt.pad + (pt.extrapad ? extrappad : 0); };
}

function doAutoRange(ax) {
    if(!ax._length) ax.setScale();

    // TODO do we really need this?
    var hasDeps = (ax._min && ax._max && ax._min.length && ax._max.length);
    var axIn;

    if(ax.autorange && hasDeps) {
        ax.range = getAutoRange(ax);

        ax._r = ax.range.slice();
        ax._rl = Lib.simpleMap(ax._r, ax.r2l);

        // doAutoRange will get called on fullLayout,
        // but we want to report its results back to layout

        axIn = ax._input;
        axIn.range = ax.range.slice();
        axIn.autorange = ax.autorange;
    }

    if(ax._anchorAxis && ax._anchorAxis.rangeslider) {
        var axeRangeOpts = ax._anchorAxis.rangeslider[ax._name];
        if(axeRangeOpts) {
            if(axeRangeOpts.rangemode === 'auto') {
                if(hasDeps) {
                    axeRangeOpts.range = getAutoRange(ax);
                } else {
                    axeRangeOpts.range = ax._rangeInitial ? ax._rangeInitial.slice() : ax.range.slice();
                }
            }
        }
        axIn = ax._anchorAxis._input;
        axIn.rangeslider[ax._name] = Lib.extendFlat({}, axeRangeOpts);
    }
}

function needsAutorange(ax) {
    return ax.autorange || ax._rangesliderAutorange;
}

/*
 * expand: if autoranging, include new data in the outer limits for this axis.
 * Note that `expand` is called during `calc`, when we don't yet know the axis
 * length; all the inputs should be based solely on the trace data, nothing
 * about the axis layout.
 * Note that `ppad` and `vpad` as well as their asymmetric variants refer to
 * the before and after padding of the passed `data` array, not to the whole axis.
 *
 * @param {object} ax: the axis being expanded. The result will be more entries
 *      in ax._min and ax._max if necessary to include the new data
 * @param {array} data: an array of numbers (ie already run through ax.d2c)
 * @param {object} options: available keys are:
 *      vpad: (number or number array) pad values (data value +-vpad)
 *      ppad: (number or number array) pad pixels (pixel location +-ppad)
 *      ppadplus, ppadminus, vpadplus, vpadminus:
 *          separate padding for each side, overrides symmetric
 *      padded: (boolean) add 5% padding to both ends
 *          (unless one end is overridden by tozero)
 *      tozero: (boolean) make sure to include zero if axis is linear,
 *          and make it a tight bound if possible
 */
function expand(ax, data, options) {
    if(!needsAutorange(ax) || !data) return;

    if(!ax._min) ax._min = [];
    if(!ax._max) ax._max = [];
    if(!options) options = {};
    if(!ax._m) ax.setScale();

    var len = data.length;
    var extrapad = options.padded || false;
    var tozero = options.tozero && (ax.type === 'linear' || ax.type === '-');
    var isLog = (ax.type === 'log');

    var i, j, k, v, di, dmin, dmax, ppadiplus, ppadiminus, includeThis, vmin, vmax;

    var hasArrayOption = false;

    function makePadAccessor(item) {
        if(Array.isArray(item)) {
            hasArrayOption = true;
            return function(i) { return Math.max(Number(item[i]||0), 0); };
        }
        else {
            var v = Math.max(Number(item||0), 0);
            return function() { return v; };
        }
    }

    var ppadplus = makePadAccessor((ax._m > 0 ?
        options.ppadplus : options.ppadminus) || options.ppad || 0);
    var ppadminus = makePadAccessor((ax._m > 0 ?
        options.ppadminus : options.ppadplus) || options.ppad || 0);
    var vpadplus = makePadAccessor(options.vpadplus || options.vpad);
    var vpadminus = makePadAccessor(options.vpadminus || options.vpad);

    if(!hasArrayOption) {
        // with no arrays other than `data` we don't need to consider
        // every point, only the extreme data points
        vmin = Infinity;
        vmax = -Infinity;

        if(isLog) {
            for(i = 0; i < len; i++) {
                v = data[i];
                // data is not linearized yet so we still have to filter out negative logs
                if(v < vmin && v > 0) vmin = v;
                if(v > vmax && v < FP_SAFE) vmax = v;
            }
        }
        else {
            for(i = 0; i < len; i++) {
                v = data[i];
                if(v < vmin && v > -FP_SAFE) vmin = v;
                if(v > vmax && v < FP_SAFE) vmax = v;
            }
        }

        data = [vmin, vmax];
        len = 2;
    }

    function addItem(i) {
        di = data[i];
        if(!isNumeric(di)) return;
        ppadiplus = ppadplus(i);
        ppadiminus = ppadminus(i);
        vmin = di - vpadminus(i);
        vmax = di + vpadplus(i);
        // special case for log axes: if vpad makes this object span
        // more than an order of mag, clip it to one order. This is so
        // we don't have non-positive errors or absurdly large lower
        // range due to rounding errors
        if(isLog && vmin < vmax / 10) vmin = vmax / 10;

        dmin = ax.c2l(vmin);
        dmax = ax.c2l(vmax);

        if(tozero) {
            dmin = Math.min(0, dmin);
            dmax = Math.max(0, dmax);
        }

        for(k = 0; k < 2; k++) {
            var newVal = k ? dmax : dmin;
            if(goodNumber(newVal)) {
                var extremes = k ? ax._max : ax._min;
                var newPad = k ? ppadiplus : ppadiminus;
                var atLeastAsExtreme = k ? greaterOrEqual : lessOrEqual;

                includeThis = true;
                /*
                 * Take items v from ax._min/_max and compare them to the presently active point:
                 * - Since we don't yet know the relationship between pixels and values
                 *   (that's what we're trying to figure out!) AND we don't yet know how
                 *   many pixels `extrapad` represents (it's going to be 5% of the length,
                 *   but we don't want to have to redo _min and _max just because length changed)
                 *   two point must satisfy three criteria simultaneously for one to supersede the other:
                 *   - at least as extreme a `val`
                 *   - at least as big a `pad`
                 *   - an unpadded point cannot supersede a padded point, but any other combination can
                 *
                 * - If the item supersedes the new point, set includethis false
                 * - If the new pt supersedes the item, delete it from ax._min/_max
                 */
                for(j = 0; j < extremes.length && includeThis; j++) {
                    v = extremes[j];
                    if(atLeastAsExtreme(v.val, newVal) && v.pad >= newPad && (v.extrapad || !extrapad)) {
                        includeThis = false;
                        break;
                    }
                    else if(atLeastAsExtreme(newVal, v.val) && v.pad <= newPad && (extrapad || !v.extrapad)) {
                        extremes.splice(j, 1);
                        j--;
                    }
                }
                if(includeThis) {
                    var clipAtZero = (tozero && newVal === 0);
                    extremes.push({
                        val: newVal,
                        pad: clipAtZero ? 0 : newPad,
                        extrapad: clipAtZero ? false : extrapad
                    });
                }
            }
        }
    }

    // For efficiency covering monotonic or near-monotonic data,
    // check a few points at both ends first and then sweep
    // through the middle
    var iMax = Math.min(6, len);
    for(i = 0; i < iMax; i++) addItem(i);
    for(i = len - 1; i >= iMax; i--) addItem(i);
}

// In order to stop overflow errors, don't consider points
// too close to the limits of js floating point
function goodNumber(v) {
    return isNumeric(v) && Math.abs(v) < FP_SAFE;
}

function lessOrEqual(v0, v1) { return v0 <= v1; }
function greaterOrEqual(v0, v1) { return v0 >= v1; }
