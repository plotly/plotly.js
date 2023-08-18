'use strict';

var d3 = require('@plotly/d3');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var FP_SAFE = require('../../constants/numerical').FP_SAFE;
var Registry = require('../../registry');
var Drawing = require('../../components/drawing');

var axIds = require('./axis_ids');
var getFromId = axIds.getFromId;
var isLinked = axIds.isLinked;

module.exports = {
    applyAutorangeOptions: applyAutorangeOptions,
    getAutoRange: getAutoRange,
    makePadFn: makePadFn,
    doAutoRange: doAutoRange,
    findExtremes: findExtremes,
    concatExtremes: concatExtremes
};

/**
 * getAutoRange
 *
 * Collects all _extremes values corresponding to a given axis
 * and computes its auto range.
 *
 * Note that getAutoRange uses return values from findExtremes.
 *
 * @param {object} gd:
 *   graph div object with filled-in fullData and fullLayout, in particular
 *   with filled-in '_extremes' containers:
 *   {
 *      val: calcdata value,
 *      pad: extra pixels beyond this value,
 *      extrapad: bool, does this point want 5% extra padding
 *   }
 * @param {object} ax:
 *   full axis object, in particular with filled-in '_traceIndices'
 *   and '_annIndices' / '_shapeIndices' if applicable
 * @return {array}
 *   an array of [min, max]. These are calcdata for log and category axes
 *   and data for linear and date axes.
 *
 * TODO: we want to change log to data as well, but it's hard to do this
 * maintaining backward compatibility. category will always have to use calcdata
 * though, because otherwise values between categories (or outside all categories)
 * would be impossible.
 */
function getAutoRange(gd, ax) {
    var i, j;
    var newRange = [];

    var fullLayout = gd._fullLayout;
    var getPadMin = makePadFn(fullLayout, ax, 0);
    var getPadMax = makePadFn(fullLayout, ax, 1);
    var extremes = concatExtremes(gd, ax);
    var minArray = extremes.min;
    var maxArray = extremes.max;

    if(minArray.length === 0 || maxArray.length === 0) {
        return Lib.simpleMap(ax.range, ax.r2l);
    }

    var minmin = minArray[0].val;
    var maxmax = maxArray[0].val;

    for(i = 1; i < minArray.length; i++) {
        if(minmin !== maxmax) break;
        minmin = Math.min(minmin, minArray[i].val);
    }
    for(i = 1; i < maxArray.length; i++) {
        if(minmin !== maxmax) break;
        maxmax = Math.max(maxmax, maxArray[i].val);
    }

    var autorange = ax.autorange;
    var axReverse =
        autorange === 'reversed' ||
        autorange === 'min reversed' ||
        autorange === 'max reversed';

    if(!axReverse && ax.range) {
        var rng = Lib.simpleMap(ax.range, ax.r2l);
        axReverse = rng[1] < rng[0];
    }

    // one-time setting to easily reverse the axis
    // when plotting from code
    if(ax.autorange === 'reversed') {
        ax.autorange = true;
    }

    var rangeMode = ax.rangemode;
    var toZero = rangeMode === 'tozero';
    var nonNegative = rangeMode === 'nonnegative';
    var axLen = ax._length;
    // don't allow padding to reduce the data to < 10% of the length
    var minSpan = axLen / 10;

    var mbest = 0;
    var minpt, maxpt, minbest, maxbest, dp, dv;

    for(i = 0; i < minArray.length; i++) {
        minpt = minArray[i];
        for(j = 0; j < maxArray.length; j++) {
            maxpt = maxArray[j];
            dv = maxpt.val - minpt.val - calcBreaksLength(ax, minpt.val, maxpt.val);
            if(dv > 0) {
                dp = axLen - getPadMin(minpt) - getPadMax(maxpt);
                if(dp > minSpan) {
                    if(dv / dp > mbest) {
                        minbest = minpt;
                        maxbest = maxpt;
                        mbest = dv / dp;
                    }
                } else if(dv / axLen > mbest) {
                    // in case of padding longer than the axis
                    // at least include the unpadded data values.
                    minbest = {val: minpt.val, nopad: 1};
                    maxbest = {val: maxpt.val, nopad: 1};
                    mbest = dv / axLen;
                }
            }
        }
    }

    function maximumPad(prev, pt) {
        return Math.max(prev, getPadMax(pt));
    }

    if(minmin === maxmax) {
        var lower = minmin - 1;
        var upper = minmin + 1;
        if(toZero) {
            if(minmin === 0) {
                // The only value we have on this axis is 0, and we want to
                // autorange so zero is one end.
                // In principle this could be [0, 1] or [-1, 0] but usually
                // 'tozero' pins 0 to the low end, so follow that.
                newRange = [0, 1];
            } else {
                var maxPad = (minmin > 0 ? maxArray : minArray).reduce(maximumPad, 0);
                // we're pushing a single value away from the edge due to its
                // padding, with the other end clamped at zero
                // 0.5 means don't push it farther than the center.
                var rangeEnd = minmin / (1 - Math.min(0.5, maxPad / axLen));
                newRange = minmin > 0 ? [0, rangeEnd] : [rangeEnd, 0];
            }
        } else if(nonNegative) {
            newRange = [Math.max(0, lower), Math.max(1, upper)];
        } else {
            newRange = [lower, upper];
        }
    } else {
        if(toZero) {
            if(minbest.val >= 0) {
                minbest = {val: 0, nopad: 1};
            }
            if(maxbest.val <= 0) {
                maxbest = {val: 0, nopad: 1};
            }
        } else if(nonNegative) {
            if(minbest.val - mbest * getPadMin(minbest) < 0) {
                minbest = {val: 0, nopad: 1};
            }
            if(maxbest.val <= 0) {
                maxbest = {val: 1, nopad: 1};
            }
        }

        // in case it changed again...
        mbest = (maxbest.val - minbest.val - calcBreaksLength(ax, minpt.val, maxpt.val)) /
            (axLen - getPadMin(minbest) - getPadMax(maxbest));

        newRange = [
            minbest.val - mbest * getPadMin(minbest),
            maxbest.val + mbest * getPadMax(maxbest)
        ];
    }

    newRange = applyAutorangeOptions(newRange, ax);

    if(ax.limitRange) ax.limitRange();

    // maintain reversal
    if(axReverse) newRange.reverse();

    return Lib.simpleMap(newRange, ax.l2r || Number);
}

// find axis rangebreaks in [v0,v1] and compute its length in value space
function calcBreaksLength(ax, v0, v1) {
    var lBreaks = 0;
    if(ax.rangebreaks) {
        var rangebreaksOut = ax.locateBreaks(v0, v1);
        for(var i = 0; i < rangebreaksOut.length; i++) {
            var brk = rangebreaksOut[i];
            lBreaks += brk.max - brk.min;
        }
    }
    return lBreaks;
}

/*
 * calculate the pixel padding for ax._min and ax._max entries with
 * optional extrapad as 5% of the total axis length
 */
function makePadFn(fullLayout, ax, max) {
    // 5% padding for points that specify extrapad: true
    var extrappad = 0.05 * ax._length;

    var anchorAxis = ax._anchorAxis || {};

    if(
        (ax.ticklabelposition || '').indexOf('inside') !== -1 ||
        (anchorAxis.ticklabelposition || '').indexOf('inside') !== -1
    ) {
        var axReverse = ax.isReversed();
        if(!axReverse) {
            var rng = Lib.simpleMap(ax.range, ax.r2l);
            axReverse = rng[1] < rng[0];
        }
        if(axReverse) max = !max;
    }

    var zero = 0;
    if(!isLinked(fullLayout, ax._id)) {
        zero = padInsideLabelsOnAnchorAxis(fullLayout, ax, max);
    }
    extrappad = Math.max(zero, extrappad);

    // domain-constrained axes: base extrappad on the unconstrained
    // domain so it's consistent as the domain changes
    if((ax.constrain === 'domain') && ax._inputDomain) {
        extrappad *= (ax._inputDomain[1] - ax._inputDomain[0]) /
            (ax.domain[1] - ax.domain[0]);
    }

    return function getPad(pt) {
        if(pt.nopad) return 0;
        return pt.pad + (pt.extrapad ? extrappad : zero);
    };
}

var TEXTPAD = 3;

function padInsideLabelsOnAnchorAxis(fullLayout, ax, max) {
    var pad = 0;

    var isX = ax._id.charAt(0) === 'x';

    for(var subplot in fullLayout._plots) {
        var plotinfo = fullLayout._plots[subplot];

        if(ax._id !== plotinfo.xaxis._id && ax._id !== plotinfo.yaxis._id) continue;

        var anchorAxis = (isX ? plotinfo.yaxis : plotinfo.xaxis) || {};

        if((anchorAxis.ticklabelposition || '').indexOf('inside') !== -1) {
            // increase padding to make more room for inside tick labels of the counter axis
            if((
                !max && (
                    anchorAxis.side === 'left' ||
                    anchorAxis.side === 'bottom'
                )
            ) || (
                max && (
                    anchorAxis.side === 'top' ||
                    anchorAxis.side === 'right'
                )
            )) {
                if(anchorAxis._vals) {
                    var rad = Lib.deg2rad(anchorAxis._tickAngles[anchorAxis._id + 'tick'] || 0);
                    var cosA = Math.abs(Math.cos(rad));
                    var sinA = Math.abs(Math.sin(rad));

                    // no stashed bounding boxes - stash bounding boxes
                    if(!anchorAxis._vals[0].bb) {
                        var cls = anchorAxis._id + 'tick';
                        var tickLabels = anchorAxis._selections[cls];
                        tickLabels.each(function(d) {
                            var thisLabel = d3.select(this);
                            var mathjaxGroup = thisLabel.select('.text-math-group');
                            if(mathjaxGroup.empty()) {
                                d.bb = Drawing.bBox(thisLabel.node());
                            }
                        });
                    }

                    // use bounding boxes
                    for(var i = 0; i < anchorAxis._vals.length; i++) {
                        var t = anchorAxis._vals[i];
                        var bb = t.bb;

                        if(bb) {
                            var w = 2 * TEXTPAD + bb.width;
                            var h = 2 * TEXTPAD + bb.height;

                            pad = Math.max(pad, isX ?
                                Math.max(w * cosA, h * sinA) :
                                Math.max(h * cosA, w * sinA)
                            );
                        }
                    }
                }

                if(anchorAxis.ticks === 'inside' && anchorAxis.ticklabelposition === 'inside') {
                    pad += anchorAxis.ticklen || 0;
                }
            }
        }
    }

    return pad;
}

function concatExtremes(gd, ax, noMatch) {
    var axId = ax._id;
    var fullData = gd._fullData;
    var fullLayout = gd._fullLayout;
    var minArray = [];
    var maxArray = [];
    var i, j, d;

    function _concat(cont, indices) {
        for(i = 0; i < indices.length; i++) {
            var item = cont[indices[i]];
            var extremes = (item._extremes || {})[axId];
            if(item.visible === true && extremes) {
                for(j = 0; j < extremes.min.length; j++) {
                    d = extremes.min[j];
                    collapseMinArray(minArray, d.val, d.pad, {extrapad: d.extrapad});
                }
                for(j = 0; j < extremes.max.length; j++) {
                    d = extremes.max[j];
                    collapseMaxArray(maxArray, d.val, d.pad, {extrapad: d.extrapad});
                }
            }
        }
    }

    _concat(fullData, ax._traceIndices);
    _concat(fullLayout.annotations || [], ax._annIndices || []);
    _concat(fullLayout.shapes || [], ax._shapeIndices || []);

    // Include the extremes from other matched axes with this one
    if(ax._matchGroup && !noMatch) {
        for(var axId2 in ax._matchGroup) {
            if(axId2 !== ax._id) {
                var ax2 = getFromId(gd, axId2);
                var extremes2 = concatExtremes(gd, ax2, true);
                // convert padding on the second axis to the first with lenRatio
                var lenRatio = ax._length / ax2._length;
                for(j = 0; j < extremes2.min.length; j++) {
                    d = extremes2.min[j];
                    collapseMinArray(minArray, d.val, d.pad * lenRatio, {extrapad: d.extrapad});
                }
                for(j = 0; j < extremes2.max.length; j++) {
                    d = extremes2.max[j];
                    collapseMaxArray(maxArray, d.val, d.pad * lenRatio, {extrapad: d.extrapad});
                }
            }
        }
    }

    return {min: minArray, max: maxArray};
}

function doAutoRange(gd, ax, presetRange) {
    ax.setScale();

    if(ax.autorange) {
        ax.range = presetRange ? presetRange.slice() : getAutoRange(gd, ax);

        ax._r = ax.range.slice();
        ax._rl = Lib.simpleMap(ax._r, ax.r2l);

        // doAutoRange will get called on fullLayout,
        // but we want to report its results back to layout

        var axIn = ax._input;

        // before we edit _input, store preGUI values
        var edits = {};
        edits[ax._attr + '.range'] = ax.range;
        edits[ax._attr + '.autorange'] = ax.autorange;
        Registry.call('_storeDirectGUIEdit', gd.layout, gd._fullLayout._preGUI, edits);

        axIn.range = ax.range.slice();
        axIn.autorange = ax.autorange;
    }

    var anchorAx = ax._anchorAxis;

    if(anchorAx && anchorAx.rangeslider) {
        var axeRangeOpts = anchorAx.rangeslider[ax._name];
        if(axeRangeOpts) {
            if(axeRangeOpts.rangemode === 'auto') {
                axeRangeOpts.range = getAutoRange(gd, ax);
            }
        }
        anchorAx._input.rangeslider[ax._name] = Lib.extendFlat({}, axeRangeOpts);
    }
}

/**
 * findExtremes
 *
 * Find min/max extremes of an array of coordinates on a given axis.
 *
 * Note that findExtremes is called during `calc`, when we don't yet know the axis
 * length; all the inputs should be based solely on the trace data, nothing
 * about the axis layout.
 *
 * Note that `ppad` and `vpad` as well as their asymmetric variants refer to
 * the before and after padding of the passed `data` array, not to the whole axis.
 *
 * @param {object} ax: full axis object
 *   relies on
 *   - ax.type
 *   - ax._m (just its sign)
 *   - ax.d2l
 * @param {array} data:
 *  array of numbers (i.e. already run though ax.d2c)
 * @param {object} opts:
 *  available keys are:
 *      vpad: (number or number array) pad values (data value +-vpad)
 *      ppad: (number or number array) pad pixels (pixel location +-ppad)
 *      ppadplus, ppadminus, vpadplus, vpadminus:
 *          separate padding for each side, overrides symmetric
 *      padded: (boolean) add 5% padding to both ends
 *          (unless one end is overridden by tozero)
 *      tozero: (boolean) make sure to include zero if axis is linear,
 *          and make it a tight bound if possible
 *      vpadLinearized: (boolean) whether or not vpad (or vpadplus/vpadminus)
 *          is linearized (for log scale axes)
 *
 * @return {object}
 *  - min {array of objects}
 *  - max {array of objects}
 *  each object item has fields:
 *    - val {number}
 *    - pad {number}
 *    - extrappad {number}
 *  - opts {object}: a ref to the passed "options" object
 */
function findExtremes(ax, data, opts) {
    if(!opts) opts = {};
    if(!ax._m) ax.setScale();

    var minArray = [];
    var maxArray = [];

    var len = data.length;
    var extrapad = opts.padded || false;
    var tozero = opts.tozero && (ax.type === 'linear' || ax.type === '-');
    var isLog = ax.type === 'log';
    var hasArrayOption = false;
    var vpadLinearized = opts.vpadLinearized || false;
    var i, v, di, dmin, dmax, ppadiplus, ppadiminus, vmin, vmax;

    function makePadAccessor(item) {
        if(Array.isArray(item)) {
            hasArrayOption = true;
            return function(i) { return Math.max(Number(item[i]||0), 0); };
        } else {
            var v = Math.max(Number(item||0), 0);
            return function() { return v; };
        }
    }

    var ppadplus = makePadAccessor((ax._m > 0 ?
        opts.ppadplus : opts.ppadminus) || opts.ppad || 0);
    var ppadminus = makePadAccessor((ax._m > 0 ?
        opts.ppadminus : opts.ppadplus) || opts.ppad || 0);
    var vpadplus = makePadAccessor(opts.vpadplus || opts.vpad);
    var vpadminus = makePadAccessor(opts.vpadminus || opts.vpad);

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
        } else {
            for(i = 0; i < len; i++) {
                v = data[i];
                if(v < vmin && v > -FP_SAFE) vmin = v;
                if(v > vmax && v < FP_SAFE) vmax = v;
            }
        }

        data = [vmin, vmax];
        len = 2;
    }

    var collapseOpts = {tozero: tozero, extrapad: extrapad};

    function addItem(i) {
        di = data[i];
        if(!isNumeric(di)) return;
        ppadiplus = ppadplus(i);
        ppadiminus = ppadminus(i);

        if(vpadLinearized) {
            dmin = ax.c2l(di) - vpadminus(i);
            dmax = ax.c2l(di) + vpadplus(i);
        } else {
            vmin = di - vpadminus(i);
            vmax = di + vpadplus(i);
            // special case for log axes: if vpad makes this object span
            // more than an order of mag, clip it to one order. This is so
            // we don't have non-positive errors or absurdly large lower
            // range due to rounding errors
            if(isLog && vmin < vmax / 10) vmin = vmax / 10;

            dmin = ax.c2l(vmin);
            dmax = ax.c2l(vmax);
        }

        if(tozero) {
            dmin = Math.min(0, dmin);
            dmax = Math.max(0, dmax);
        }
        if(goodNumber(dmin)) {
            collapseMinArray(minArray, dmin, ppadiminus, collapseOpts);
        }
        if(goodNumber(dmax)) {
            collapseMaxArray(maxArray, dmax, ppadiplus, collapseOpts);
        }
    }

    // For efficiency covering monotonic or near-monotonic data,
    // check a few points at both ends first and then sweep
    // through the middle
    var iMax = Math.min(6, len);
    for(i = 0; i < iMax; i++) addItem(i);
    for(i = len - 1; i >= iMax; i--) addItem(i);

    return {
        min: minArray,
        max: maxArray,
        opts: opts
    };
}

function collapseMinArray(array, newVal, newPad, opts) {
    collapseArray(array, newVal, newPad, opts, lessOrEqual);
}

function collapseMaxArray(array, newVal, newPad, opts) {
    collapseArray(array, newVal, newPad, opts, greaterOrEqual);
}

/**
 * collapseArray
 *
 * Takes items from 'array' and compares them to 'newVal', 'newPad'.
 *
 * @param {array} array:
 *  current set of min or max extremes
 * @param {number} newVal:
 *  new value to compare against
 * @param {number} newPad:
 *  pad value associated with 'newVal'
 * @param {object} opts:
 *  - tozero {boolean}
 *  - extrapad {number}
 * @param {function} atLeastAsExtreme:
 *  comparison function, use
 *  - lessOrEqual for min 'array' and
 *  - greaterOrEqual for max 'array'
 *
 * In practice, 'array' is either
 *  - 'extremes[ax._id].min' or
 *  - 'extremes[ax._id].max
 *  found in traces and layout items that affect autorange.
 *
 * Since we don't yet know the relationship between pixels and values
 * (that's what we're trying to figure out!) AND we don't yet know how
 * many pixels `extrapad` represents (it's going to be 5% of the length,
 * but we don't want to have to redo calc just because length changed)
 * two point must satisfy three criteria simultaneously for one to supersede the other:
 *  - at least as extreme a `val`
 *  - at least as big a `pad`
 *  - an unpadded point cannot supersede a padded point, but any other combination can
 *
 * Then:
 * - If the item supersedes the new point, set includeThis false
 * - If the new pt supersedes the item, delete it from 'array'
 */
function collapseArray(array, newVal, newPad, opts, atLeastAsExtreme) {
    var tozero = opts.tozero;
    var extrapad = opts.extrapad;
    var includeThis = true;

    for(var j = 0; j < array.length && includeThis; j++) {
        var v = array[j];
        if(atLeastAsExtreme(v.val, newVal) && v.pad >= newPad && (v.extrapad || !extrapad)) {
            includeThis = false;
            break;
        } else if(atLeastAsExtreme(newVal, v.val) && v.pad <= newPad && (extrapad || !v.extrapad)) {
            array.splice(j, 1);
            j--;
        }
    }
    if(includeThis) {
        var clipAtZero = (tozero && newVal === 0);
        array.push({
            val: newVal,
            pad: clipAtZero ? 0 : newPad,
            extrapad: clipAtZero ? false : extrapad
        });
    }
}

// In order to stop overflow errors, don't consider points
// too close to the limits of js floating point
function goodNumber(v) {
    return isNumeric(v) && Math.abs(v) < FP_SAFE;
}

function lessOrEqual(v0, v1) { return v0 <= v1; }
function greaterOrEqual(v0, v1) { return v0 >= v1; }

function applyAutorangeMinOptions(v, ax) {
    var autorangeoptions = ax.autorangeoptions;
    if(
        autorangeoptions &&
        autorangeoptions.minallowed !== undefined &&
        hasValidMinAndMax(ax, autorangeoptions.minallowed, autorangeoptions.maxallowed)
    ) {
        return autorangeoptions.minallowed;
    }

    if(
        autorangeoptions &&
        autorangeoptions.clipmin !== undefined &&
        hasValidMinAndMax(ax, autorangeoptions.clipmin, autorangeoptions.clipmax)
    ) {
        return Math.max(v, ax.d2l(autorangeoptions.clipmin));
    }
    return v;
}

function applyAutorangeMaxOptions(v, ax) {
    var autorangeoptions = ax.autorangeoptions;

    if(
        autorangeoptions &&
        autorangeoptions.maxallowed !== undefined &&
        hasValidMinAndMax(ax, autorangeoptions.minallowed, autorangeoptions.maxallowed)
    ) {
        return autorangeoptions.maxallowed;
    }

    if(
        autorangeoptions &&
        autorangeoptions.clipmax !== undefined &&
        hasValidMinAndMax(ax, autorangeoptions.clipmin, autorangeoptions.clipmax)
    ) {
        return Math.min(v, ax.d2l(autorangeoptions.clipmax));
    }

    return v;
}

function hasValidMinAndMax(ax, min, max) {
    // in case both min and max are defined, ensure min < max
    if(
        min !== undefined &&
        max !== undefined
    ) {
        min = ax.d2l(min);
        max = ax.d2l(max);
        return min < max;
    }
    return true;
}

// this function should be (and is) called before reversing the range
// so range[0] is the minimum and range[1] is the maximum
function applyAutorangeOptions(range, ax) {
    if(!ax || !ax.autorangeoptions) return range;

    var min = range[0];
    var max = range[1];

    var include = ax.autorangeoptions.include;
    if(include !== undefined) {
        var lMin = ax.d2l(min);
        var lMax = ax.d2l(max);

        if(!Lib.isArrayOrTypedArray(include)) include = [include];
        for(var i = 0; i < include.length; i++) {
            var v = ax.d2l(include[i]);
            if(lMin >= v) {
                lMin = v;
                min = v;
            }
            if(lMax <= v) {
                lMax = v;
                max = v;
            }
        }
    }

    min = applyAutorangeMinOptions(min, ax);
    max = applyAutorangeMaxOptions(max, ax);

    return [min, max];
}
