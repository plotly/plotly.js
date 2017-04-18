/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Registry = require('../../registry');
var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');
var Titles = require('../../components/titles');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');

var constants = require('../../constants/numerical');
var FP_SAFE = constants.FP_SAFE;
var ONEAVGYEAR = constants.ONEAVGYEAR;
var ONEAVGMONTH = constants.ONEAVGMONTH;
var ONEDAY = constants.ONEDAY;
var ONEHOUR = constants.ONEHOUR;
var ONEMIN = constants.ONEMIN;
var ONESEC = constants.ONESEC;
var BADNUM = constants.BADNUM;


var axes = module.exports = {};

axes.layoutAttributes = require('./layout_attributes');
axes.supplyLayoutDefaults = require('./layout_defaults');

axes.setConvert = require('./set_convert');

var axisIds = require('./axis_ids');
axes.id2name = axisIds.id2name;
axes.cleanId = axisIds.cleanId;
axes.list = axisIds.list;
axes.listIds = axisIds.listIds;
axes.getFromId = axisIds.getFromId;
axes.getFromTrace = axisIds.getFromTrace;


/*
 * find the list of possible axes to reference with an xref or yref attribute
 * and coerce it to that list
 *
 * attr: the attribute we're generating a reference for. Should end in 'x' or 'y'
 *     but can be prefixed, like 'ax' for annotation's arrow x
 * dflt: the default to coerce to, or blank to use the first axis (falling back on
 *     extraOption if there is no axis)
 * extraOption: aside from existing axes with this letter, what non-axis value is allowed?
 *     Only required if it's different from `dflt`
 */
axes.coerceRef = function(containerIn, containerOut, gd, attr, dflt, extraOption) {
    var axLetter = attr.charAt(attr.length - 1),
        axlist = axes.listIds(gd, axLetter),
        refAttr = attr + 'ref',
        attrDef = {};

    if(!dflt) dflt = axlist[0] || extraOption;
    if(!extraOption) extraOption = dflt;

    // data-ref annotations are not supported in gl2d yet

    attrDef[refAttr] = {
        valType: 'enumerated',
        values: axlist.concat(extraOption ? [extraOption] : []),
        dflt: dflt
    };

    // xref, yref
    return Lib.coerce(containerIn, containerOut, attrDef, refAttr);
};

/*
 * coerce position attributes (range-type) that can be either on axes or absolute
 * (paper or pixel) referenced. The biggest complication here is that we don't know
 * before looking at the axis whether the value must be a number or not (it may be
 * a date string), so we can't use the regular valType='number' machinery
 *
 * axRef (string): the axis this position is referenced to, or:
 *     paper: fraction of the plot area
 *     pixel: pixels relative to some starting position
 * attr (string): the attribute in containerOut we are coercing
 * dflt (number): the default position, as a fraction or pixels. If the attribute
 *     is to be axis-referenced, this will be converted to an axis data value
 *
 * Also cleans the values, since the attribute definition itself has to say
 * valType: 'any' to handle date axes. This allows us to accept:
 * - for category axes: category names, and convert them here into serial numbers.
 *   Note that this will NOT work for axis range endpoints, because we don't know
 *   the category list yet (it's set by ax.makeCalcdata during calc)
 *   but it works for component (note, shape, images) positions.
 * - for date axes: JS Dates or milliseconds, and convert to date strings
 * - for other types: coerce them to numbers
 */
axes.coercePosition = function(containerOut, gd, coerce, axRef, attr, dflt) {
    var pos,
        newPos;

    if(axRef === 'paper' || axRef === 'pixel') {
        pos = coerce(attr, dflt);
    }
    else {
        var ax = axes.getFromId(gd, axRef);

        dflt = ax.fraction2r(dflt);
        pos = coerce(attr, dflt);

        if(ax.type === 'category') {
            // if position is given as a category name, convert it to a number
            if(typeof pos === 'string' && (ax._categories || []).length) {
                newPos = ax._categories.indexOf(pos);
                containerOut[attr] = (newPos === -1) ? dflt : newPos;
                return;
            }
        }
        else if(ax.type === 'date') {
            containerOut[attr] = Lib.cleanDate(pos, BADNUM, ax.calendar);
            return;
        }
    }
    // finally make sure we have a number (unless date type already returned a string)
    containerOut[attr] = isNumeric(pos) ? Number(pos) : dflt;
};

// empty out types for all axes containing these traces
// so we auto-set them again
axes.clearTypes = function(gd, traces) {
    if(!Array.isArray(traces) || !traces.length) {
        traces = (gd._fullData).map(function(d, i) { return i; });
    }
    traces.forEach(function(tracenum) {
        var trace = gd.data[tracenum];
        delete (axes.getFromId(gd, trace.xaxis) || {}).type;
        delete (axes.getFromId(gd, trace.yaxis) || {}).type;
    });
};

// get counteraxis letter for this axis (name or id)
// this can also be used as the id for default counter axis
axes.counterLetter = function(id) {
    var axLetter = id.charAt(0);
    if(axLetter === 'x') return 'y';
    if(axLetter === 'y') return 'x';
};

// incorporate a new minimum difference and first tick into
// forced
// note that _forceTick0 is linearized, so needs to be turned into
// a range value for setting tick0
axes.minDtick = function(ax, newDiff, newFirst, allow) {
    // doesn't make sense to do forced min dTick on log or category axes,
    // and the plot itself may decide to cancel (ie non-grouped bars)
    if(['log', 'category'].indexOf(ax.type) !== -1 || !allow) {
        ax._minDtick = 0;
    }
    // undefined means there's nothing there yet
    else if(ax._minDtick === undefined) {
        ax._minDtick = newDiff;
        ax._forceTick0 = newFirst;
    }
    else if(ax._minDtick) {
        // existing minDtick is an integer multiple of newDiff
        // (within rounding err)
        // and forceTick0 can be shifted to newFirst
        if((ax._minDtick / newDiff + 1e-6) % 1 < 2e-6 &&
                (((newFirst - ax._forceTick0) / newDiff % 1) +
                    1.000001) % 1 < 2e-6) {
            ax._minDtick = newDiff;
            ax._forceTick0 = newFirst;
        }
        // if the converse is true (newDiff is a multiple of minDtick and
        // newFirst can be shifted to forceTick0) then do nothing - same
        // forcing stands. Otherwise, cancel forced minimum
        else if((newDiff / ax._minDtick + 1e-6) % 1 > 2e-6 ||
                (((newFirst - ax._forceTick0) / ax._minDtick % 1) +
                    1.000001) % 1 > 2e-6) {
            ax._minDtick = 0;
        }
    }
};

// Find the autorange for this axis
//
// assumes ax._min and ax._max have already been set by calling axes.expand
// using calcdata from all traces. These are arrays of:
// {val: calcdata value, pad: extra pixels beyond this value}
//
// Returns an array of [min, max]. These are calcdata for log and category axes
// and data for linear and date axes.
//
// TODO: we want to change log to data as well, but it's hard to do this
// maintaining backward compatibility. category will always have to use calcdata
// though, because otherwise values between categories (or outside all categories)
// would be impossible.
axes.getAutoRange = function(ax) {
    var newRange = [];

    var minmin = ax._min[0].val,
        maxmax = ax._max[0].val,
        i;

    for(i = 1; i < ax._min.length; i++) {
        if(minmin !== maxmax) break;
        minmin = Math.min(minmin, ax._min[i].val);
    }
    for(i = 1; i < ax._max.length; i++) {
        if(minmin !== maxmax) break;
        maxmax = Math.max(maxmax, ax._max[i].val);
    }

    var j, minpt, maxpt, minbest, maxbest, dp, dv,
        mbest = 0,
        axReverse = false;

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
            dp = ax._length - minpt.pad - maxpt.pad;
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
                if(minbest.val - mbest * minbest.pad < 0) {
                    minbest = {val: 0, pad: 0};
                }
                if(maxbest.val < 0) {
                    maxbest = {val: 1, pad: 0};
                }
            }

            // in case it changed again...
            mbest = (maxbest.val - minbest.val) /
                (ax._length - minbest.pad - maxbest.pad);

        }

        newRange = [
            minbest.val - mbest * minbest.pad,
            maxbest.val + mbest * maxbest.pad
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
};

axes.doAutoRange = function(ax) {
    if(!ax._length) ax.setScale();

    // TODO do we really need this?
    var hasDeps = (ax._min && ax._max && ax._min.length && ax._max.length);

    if(ax.autorange && hasDeps) {
        ax.range = axes.getAutoRange(ax);

        // doAutoRange will get called on fullLayout,
        // but we want to report its results back to layout

        var axIn = ax._input;
        axIn.range = ax.range.slice();
        axIn.autorange = ax.autorange;
    }
};

// save a copy of the initial axis ranges in fullLayout
// use them in mode bar and dblclick events
axes.saveRangeInitial = function(gd, overwrite) {
    var axList = axes.list(gd, '', true),
        hasOneAxisChanged = false;

    for(var i = 0; i < axList.length; i++) {
        var ax = axList[i];

        var isNew = (ax._rangeInitial === undefined);
        var hasChanged = (
            isNew || !(
                ax.range[0] === ax._rangeInitial[0] &&
                ax.range[1] === ax._rangeInitial[1]
            )
        );

        if((isNew && ax.autorange === false) || (overwrite && hasChanged)) {
            ax._rangeInitial = ax.range.slice();
            hasOneAxisChanged = true;
        }
    }

    return hasOneAxisChanged;
};

// save a copy of the initial spike visibility
axes.saveShowSpikeInitial = function(gd, overwrite) {
    var axList = axes.list(gd, '', true),
        hasOneAxisChanged = false,
        allEnabled = 'on';

    for(var i = 0; i < axList.length; i++) {
        var ax = axList[i];

        var isNew = (ax._showSpikeInitial === undefined);
        var hasChanged = (
            isNew || !(
                ax.showspikes === ax._showspikes
            )
        );

        if((isNew) || (overwrite && hasChanged)) {
            ax._showSpikeInitial = ax.showspikes;
            hasOneAxisChanged = true;
        }

        if(allEnabled === 'on' && !ax.showspikes) {
            allEnabled = 'off';
        }
    }
    gd._fullLayout._cartesianSpikesEnabled = allEnabled;
    return hasOneAxisChanged;
};

// axes.expand: if autoranging, include new data in the outer limits
// for this axis
// data is an array of numbers (ie already run through ax.d2c)
// available options:
//      vpad: (number or number array) pad values (data value +-vpad)
//      ppad: (number or number array) pad pixels (pixel location +-ppad)
//      ppadplus, ppadminus, vpadplus, vpadminus:
//          separate padding for each side, overrides symmetric
//      padded: (boolean) add 5% padding to both ends
//          (unless one end is overridden by tozero)
//      tozero: (boolean) make sure to include zero if axis is linear,
//          and make it a tight bound if possible
axes.expand = function(ax, data, options) {
    var needsAutorange = (
        ax.autorange ||
        !!Lib.nestedProperty(ax, 'rangeslider.autorange').get()
    );

    if(!needsAutorange || !data) return;

    if(!ax._min) ax._min = [];
    if(!ax._max) ax._max = [];
    if(!options) options = {};
    if(!ax._m) ax.setScale();

    var len = data.length,
        extrappad = options.padded ? ax._length * 0.05 : 0,
        tozero = options.tozero && (ax.type === 'linear' || ax.type === '-'),
        i, j, v, di, dmin, dmax,
        ppadiplus, ppadiminus, includeThis, vmin, vmax;

    function getPad(item) {
        if(Array.isArray(item)) {
            return function(i) { return Math.max(Number(item[i]||0), 0); };
        }
        else {
            var v = Math.max(Number(item||0), 0);
            return function() { return v; };
        }
    }
    var ppadplus = getPad((ax._m > 0 ?
            options.ppadplus : options.ppadminus) || options.ppad || 0),
        ppadminus = getPad((ax._m > 0 ?
            options.ppadminus : options.ppadplus) || options.ppad || 0),
        vpadplus = getPad(options.vpadplus || options.vpad),
        vpadminus = getPad(options.vpadminus || options.vpad);

    function addItem(i) {
        di = data[i];
        if(!isNumeric(di)) return;
        ppadiplus = ppadplus(i) + extrappad;
        ppadiminus = ppadminus(i) + extrappad;
        vmin = di - vpadminus(i);
        vmax = di + vpadplus(i);
        // special case for log axes: if vpad makes this object span
        // more than an order of mag, clip it to one order. This is so
        // we don't have non-positive errors or absurdly large lower
        // range due to rounding errors
        if(ax.type === 'log' && vmin < vmax / 10) { vmin = vmax / 10; }

        dmin = ax.c2l(vmin);
        dmax = ax.c2l(vmax);

        if(tozero) {
            dmin = Math.min(0, dmin);
            dmax = Math.max(0, dmax);
        }

        // In order to stop overflow errors, don't consider points
        // too close to the limits of js floating point
        function goodNumber(v) {
            return isNumeric(v) && Math.abs(v) < FP_SAFE;
        }

        if(goodNumber(dmin)) {
            includeThis = true;
            // take items v from ax._min and compare them to the
            // presently active point:
            // - if the item supercedes the new point, set includethis false
            // - if the new pt supercedes the item, delete it from ax._min
            for(j = 0; j < ax._min.length && includeThis; j++) {
                v = ax._min[j];
                if(v.val <= dmin && v.pad >= ppadiminus) {
                    includeThis = false;
                }
                else if(v.val >= dmin && v.pad <= ppadiminus) {
                    ax._min.splice(j, 1);
                    j--;
                }
            }
            if(includeThis) {
                ax._min.push({
                    val: dmin,
                    pad: (tozero && dmin === 0) ? 0 : ppadiminus
                });
            }
        }

        if(goodNumber(dmax)) {
            includeThis = true;
            for(j = 0; j < ax._max.length && includeThis; j++) {
                v = ax._max[j];
                if(v.val >= dmax && v.pad >= ppadiplus) {
                    includeThis = false;
                }
                else if(v.val <= dmax && v.pad <= ppadiplus) {
                    ax._max.splice(j, 1);
                    j--;
                }
            }
            if(includeThis) {
                ax._max.push({
                    val: dmax,
                    pad: (tozero && dmax === 0) ? 0 : ppadiplus
                });
            }
        }
    }

    // For efficiency covering monotonic or near-monotonic data,
    // check a few points at both ends first and then sweep
    // through the middle
    for(i = 0; i < 6; i++) addItem(i);
    for(i = len - 1; i > 5; i--) addItem(i);

};

axes.autoBin = function(data, ax, nbins, is2d, calendar) {
    var dataMin = Lib.aggNums(Math.min, null, data),
        dataMax = Lib.aggNums(Math.max, null, data);

    if(!calendar) calendar = ax.calendar;

    if(ax.type === 'category') {
        return {
            start: dataMin - 0.5,
            end: dataMax + 0.5,
            size: 1
        };
    }

    var size0;
    if(nbins) size0 = ((dataMax - dataMin) / nbins);
    else {
        // totally auto: scale off std deviation so the highest bin is
        // somewhat taller than the total number of bins, but don't let
        // the size get smaller than the 'nice' rounded down minimum
        // difference between values
        var distinctData = Lib.distinctVals(data),
            msexp = Math.pow(10, Math.floor(
                Math.log(distinctData.minDiff) / Math.LN10)),
            minSize = msexp * Lib.roundUp(
                distinctData.minDiff / msexp, [0.9, 1.9, 4.9, 9.9], true);
        size0 = Math.max(minSize, 2 * Lib.stdev(data) /
            Math.pow(data.length, is2d ? 0.25 : 0.4));

        // fallback if ax.d2c output BADNUMs
        // e.g. when user try to plot categorical bins
        // on a layout.xaxis.type: 'linear'
        if(!isNumeric(size0)) size0 = 1;
    }

    // piggyback off autotick code to make "nice" bin sizes
    var dummyAx;
    if(ax.type === 'log') {
        dummyAx = {
            type: 'linear',
            range: [dataMin, dataMax]
        };
    }
    else {
        dummyAx = {
            type: ax.type,
            range: Lib.simpleMap([dataMin, dataMax], ax.c2r, 0, calendar),
            calendar: calendar
        };
    }
    axes.setConvert(dummyAx);

    axes.autoTicks(dummyAx, size0);
    var binStart = axes.tickIncrement(
            axes.tickFirst(dummyAx), dummyAx.dtick, 'reverse', calendar),
        binEnd;

    // check for too many data points right at the edges of bins
    // (>50% within 1% of bin edges) or all data points integral
    // and offset the bins accordingly
    if(typeof dummyAx.dtick === 'number') {
        binStart = autoShiftNumericBins(binStart, data, dummyAx, dataMin, dataMax);

        var bincount = 1 + Math.floor((dataMax - binStart) / dummyAx.dtick);
        binEnd = binStart + bincount * dummyAx.dtick;
    }
    else {
        // month ticks - should be the only nonlinear kind we have at this point.
        // dtick (as supplied by axes.autoTick) only has nonlinear values on
        // date and log axes, but even if you display a histogram on a log axis
        // we bin it on a linear axis (which one could argue against, but that's
        // a separate issue)
        if(dummyAx.dtick.charAt(0) === 'M') {
            binStart = autoShiftMonthBins(binStart, data, dummyAx.dtick, dataMin, calendar);
        }

        // calculate the endpoint for nonlinear ticks - you have to
        // just increment until you're done
        binEnd = binStart;
        while(binEnd <= dataMax) {
            binEnd = axes.tickIncrement(binEnd, dummyAx.dtick, false, calendar);
        }
    }

    return {
        start: ax.c2r(binStart, 0, calendar),
        end: ax.c2r(binEnd, 0, calendar),
        size: dummyAx.dtick
    };
};


function autoShiftNumericBins(binStart, data, ax, dataMin, dataMax) {
    var edgecount = 0,
        midcount = 0,
        intcount = 0,
        blankCount = 0;

    function nearEdge(v) {
        // is a value within 1% of a bin edge?
        return (1 + (v - binStart) * 100 / ax.dtick) % 100 < 2;
    }

    for(var i = 0; i < data.length; i++) {
        if(data[i] % 1 === 0) intcount++;
        else if(!isNumeric(data[i])) blankCount++;

        if(nearEdge(data[i])) edgecount++;
        if(nearEdge(data[i] + ax.dtick / 2)) midcount++;
    }
    var dataCount = data.length - blankCount;

    if(intcount === dataCount && ax.type !== 'date') {
        // all integers: if bin size is <1, it's because
        // that was specifically requested (large nbins)
        // so respect that... but center the bins containing
        // integers on those integers
        if(ax.dtick < 1) {
            binStart = dataMin - 0.5 * ax.dtick;
        }
        // otherwise start half an integer down regardless of
        // the bin size, just enough to clear up endpoint
        // ambiguity about which integers are in which bins.
        else {
            binStart -= 0.5;
            if(binStart + ax.dtick < dataMin) binStart += ax.dtick;
        }
    }
    else if(midcount < dataCount * 0.1) {
        if(edgecount > dataCount * 0.3 ||
                nearEdge(dataMin) || nearEdge(dataMax)) {
            // lots of points at the edge, not many in the middle
            // shift half a bin
            var binshift = ax.dtick / 2;
            binStart += (binStart + binshift < dataMin) ? binshift : -binshift;
        }
    }
    return binStart;
}


function autoShiftMonthBins(binStart, data, dtick, dataMin, calendar) {
    var stats = Lib.findExactDates(data, calendar);
    // number of data points that needs to be an exact value
    // to shift that increment to (near) the bin center
    var threshold = 0.8;

    if(stats.exactDays > threshold) {
        var numMonths = Number(dtick.substr(1));

        if((stats.exactYears > threshold) && (numMonths % 12 === 0)) {
            // The exact middle of a non-leap-year is 1.5 days into July
            // so if we start the bins here, all but leap years will
            // get hover-labeled as exact years.
            binStart = axes.tickIncrement(binStart, 'M6', 'reverse') + ONEDAY * 1.5;
        }
        else if(stats.exactMonths > threshold) {
            // Months are not as clean, but if we shift half the *longest*
            // month (31/2 days) then 31-day months will get labeled exactly
            // and shorter months will get labeled with the correct month
            // but shifted 12-36 hours into it.
            binStart = axes.tickIncrement(binStart, 'M1', 'reverse') + ONEDAY * 15.5;
        }
        else {
            // Shifting half a day is exact, but since these are month bins it
            // will always give a somewhat odd-looking label, until we do something
            // smarter like showing the bin boundaries (or the bounds of the actual
            // data in each bin)
            binStart -= ONEDAY / 2;
        }
        var nextBinStart = axes.tickIncrement(binStart, dtick);

        if(nextBinStart <= dataMin) return nextBinStart;
    }
    return binStart;
}

// ----------------------------------------------------
// Ticks and grids
// ----------------------------------------------------

// calculate the ticks: text, values, positioning
// if ticks are set to automatic, determine the right values (tick0,dtick)
// in any case, set tickround to # of digits to round tick labels to,
// or codes to this effect for log and date scales
axes.calcTicks = function calcTicks(ax) {
    var rng = Lib.simpleMap(ax.range, ax.r2l);

    // calculate max number of (auto) ticks to display based on plot size
    if(ax.tickmode === 'auto' || !ax.dtick) {
        var nt = ax.nticks,
            minPx;
        if(!nt) {
            if(ax.type === 'category') {
                minPx = ax.tickfont ? (ax.tickfont.size || 12) * 1.2 : 15;
                nt = ax._length / minPx;
            }
            else {
                minPx = ax._id.charAt(0) === 'y' ? 40 : 80;
                nt = Lib.constrain(ax._length / minPx, 4, 9) + 1;
            }
        }

        // add a couple of extra digits for filling in ticks when we
        // have explicit tickvals without tick text
        if(ax.tickmode === 'array') nt *= 100;

        axes.autoTicks(ax, Math.abs(rng[1] - rng[0]) / nt);
        // check for a forced minimum dtick
        if(ax._minDtick > 0 && ax.dtick < ax._minDtick * 2) {
            ax.dtick = ax._minDtick;
            ax.tick0 = ax.l2r(ax._forceTick0);
        }
    }

    // check for missing tick0
    if(!ax.tick0) {
        ax.tick0 = (ax.type === 'date') ? '2000-01-01' : 0;
    }

    // now figure out rounding of tick values
    autoTickRound(ax);

    // now that we've figured out the auto values for formatting
    // in case we're missing some ticktext, we can break out for array ticks
    if(ax.tickmode === 'array') return arrayTicks(ax);

    // find the first tick
    ax._tmin = axes.tickFirst(ax);

    // check for reversed axis
    var axrev = (rng[1] < rng[0]);

    // return the full set of tick vals
    var vals = [],
        // add a tiny bit so we get ticks which may have rounded out
        endtick = rng[1] * 1.0001 - rng[0] * 0.0001;
    if(ax.type === 'category') {
        endtick = (axrev) ? Math.max(-0.5, endtick) :
            Math.min(ax._categories.length - 0.5, endtick);
    }
    for(var x = ax._tmin;
            (axrev) ? (x >= endtick) : (x <= endtick);
            x = axes.tickIncrement(x, ax.dtick, axrev, ax.calendar)) {
        vals.push(x);

        // prevent infinite loops
        if(vals.length > 1000) break;
    }

    // save the last tick as well as first, so we can
    // show the exponent only on the last one
    ax._tmax = vals[vals.length - 1];

    // for showing the rest of a date when the main tick label is only the
    // latter part: ax._prevDateHead holds what we showed most recently.
    // Start with it cleared and mark that we're in calcTicks (ie calculating a
    // whole string of these so we should care what the previous date head was!)
    ax._prevDateHead = '';
    ax._inCalcTicks = true;

    var ticksOut = new Array(vals.length);
    for(var i = 0; i < vals.length; i++) ticksOut[i] = axes.tickText(ax, vals[i]);

    ax._inCalcTicks = false;

    return ticksOut;
};

function arrayTicks(ax) {
    var vals = ax.tickvals,
        text = ax.ticktext,
        ticksOut = new Array(vals.length),
        rng = Lib.simpleMap(ax.range, ax.r2l),
        r0expanded = rng[0] * 1.0001 - rng[1] * 0.0001,
        r1expanded = rng[1] * 1.0001 - rng[0] * 0.0001,
        tickMin = Math.min(r0expanded, r1expanded),
        tickMax = Math.max(r0expanded, r1expanded),
        vali,
        i,
        j = 0;

    // without a text array, just format the given values as any other ticks
    // except with more precision to the numbers
    if(!Array.isArray(text)) text = [];

    // make sure showing ticks doesn't accidentally add new categories
    var tickVal2l = ax.type === 'category' ? ax.d2l_noadd : ax.d2l;

    // array ticks on log axes always show the full number
    // (if no explicit ticktext overrides it)
    if(ax.type === 'log' && String(ax.dtick).charAt(0) !== 'L') {
        ax.dtick = 'L' + Math.pow(10, Math.floor(Math.min(ax.range[0], ax.range[1])) - 1);
    }

    for(i = 0; i < vals.length; i++) {
        vali = tickVal2l(vals[i]);
        if(vali > tickMin && vali < tickMax) {
            if(text[i] === undefined) ticksOut[j] = axes.tickText(ax, vali);
            else ticksOut[j] = tickTextObj(ax, vali, String(text[i]));
            j++;
        }
    }

    if(j < vals.length) ticksOut.splice(j, vals.length - j);

    return ticksOut;
}

var roundBase10 = [2, 5, 10],
    roundBase24 = [1, 2, 3, 6, 12],
    roundBase60 = [1, 2, 5, 10, 15, 30],
    // 2&3 day ticks are weird, but need something btwn 1&7
    roundDays = [1, 2, 3, 7, 14],
    // approx. tick positions for log axes, showing all (1) and just 1, 2, 5 (2)
    // these don't have to be exact, just close enough to round to the right value
    roundLog1 = [-0.046, 0, 0.301, 0.477, 0.602, 0.699, 0.778, 0.845, 0.903, 0.954, 1],
    roundLog2 = [-0.301, 0, 0.301, 0.699, 1];

function roundDTick(roughDTick, base, roundingSet) {
    return base * Lib.roundUp(roughDTick / base, roundingSet);
}

// autoTicks: calculate best guess at pleasant ticks for this axis
// inputs:
//      ax - an axis object
//      roughDTick - rough tick spacing (to be turned into a nice round number)
// outputs (into ax):
//   tick0: starting point for ticks (not necessarily on the graph)
//      usually 0 for numeric (=10^0=1 for log) or jan 1, 2000 for dates
//   dtick: the actual, nice round tick spacing, usually a little larger than roughDTick
//      if the ticks are spaced linearly (linear scale, categories,
//          log with only full powers, date ticks < month),
//          this will just be a number
//      months: M#
//      years: M# where # is 12*number of years
//      log with linear ticks: L# where # is the linear tick spacing
//      log showing powers plus some intermediates:
//          D1 shows all digits, D2 shows 2 and 5
axes.autoTicks = function(ax, roughDTick) {
    var base;

    if(ax.type === 'date') {
        ax.tick0 = Lib.dateTick0(ax.calendar);
        // the criteria below are all based on the rough spacing we calculate
        // being > half of the final unit - so precalculate twice the rough val
        var roughX2 = 2 * roughDTick;

        if(roughX2 > ONEAVGYEAR) {
            roughDTick /= ONEAVGYEAR;
            base = Math.pow(10, Math.floor(Math.log(roughDTick) / Math.LN10));
            ax.dtick = 'M' + (12 * roundDTick(roughDTick, base, roundBase10));
        }
        else if(roughX2 > ONEAVGMONTH) {
            roughDTick /= ONEAVGMONTH;
            ax.dtick = 'M' + roundDTick(roughDTick, 1, roundBase24);
        }
        else if(roughX2 > ONEDAY) {
            ax.dtick = roundDTick(roughDTick, ONEDAY, roundDays);
            // get week ticks on sunday
            // this will also move the base tick off 2000-01-01 if dtick is
            // 2 or 3 days... but that's a weird enough case that we'll ignore it.
            ax.tick0 = Lib.dateTick0(ax.calendar, true);
        }
        else if(roughX2 > ONEHOUR) {
            ax.dtick = roundDTick(roughDTick, ONEHOUR, roundBase24);
        }
        else if(roughX2 > ONEMIN) {
            ax.dtick = roundDTick(roughDTick, ONEMIN, roundBase60);
        }
        else if(roughX2 > ONESEC) {
            ax.dtick = roundDTick(roughDTick, ONESEC, roundBase60);
        }
        else {
            // milliseconds
            base = Math.pow(10, Math.floor(Math.log(roughDTick) / Math.LN10));
            ax.dtick = roundDTick(roughDTick, base, roundBase10);
        }
    }
    else if(ax.type === 'log') {
        ax.tick0 = 0;
        var rng = Lib.simpleMap(ax.range, ax.r2l);

        if(roughDTick > 0.7) {
            // only show powers of 10
            ax.dtick = Math.ceil(roughDTick);
        }
        else if(Math.abs(rng[1] - rng[0]) < 1) {
            // span is less than one power of 10
            var nt = 1.5 * Math.abs((rng[1] - rng[0]) / roughDTick);

            // ticks on a linear scale, labeled fully
            roughDTick = Math.abs(Math.pow(10, rng[1]) -
                Math.pow(10, rng[0])) / nt;
            base = Math.pow(10, Math.floor(Math.log(roughDTick) / Math.LN10));
            ax.dtick = 'L' + roundDTick(roughDTick, base, roundBase10);
        }
        else {
            // include intermediates between powers of 10,
            // labeled with small digits
            // ax.dtick = "D2" (show 2 and 5) or "D1" (show all digits)
            ax.dtick = (roughDTick > 0.3) ? 'D2' : 'D1';
        }
    }
    else if(ax.type === 'category') {
        ax.tick0 = 0;
        ax.dtick = Math.ceil(Math.max(roughDTick, 1));
    }
    else {
        // auto ticks always start at 0
        ax.tick0 = 0;
        base = Math.pow(10, Math.floor(Math.log(roughDTick) / Math.LN10));
        ax.dtick = roundDTick(roughDTick, base, roundBase10);
    }

    // prevent infinite loops
    if(ax.dtick === 0) ax.dtick = 1;

    // TODO: this is from log axis histograms with autorange off
    if(!isNumeric(ax.dtick) && typeof ax.dtick !== 'string') {
        var olddtick = ax.dtick;
        ax.dtick = 1;
        throw 'ax.dtick error: ' + String(olddtick);
    }
};

// after dtick is already known, find tickround = precision
// to display in tick labels
//   for numeric ticks, integer # digits after . to round to
//   for date ticks, the last date part to show (y,m,d,H,M,S)
//      or an integer # digits past seconds
function autoTickRound(ax) {
    var dtick = ax.dtick;

    ax._tickexponent = 0;
    if(!isNumeric(dtick) && typeof dtick !== 'string') {
        dtick = 1;
    }

    if(ax.type === 'category') {
        ax._tickround = null;
    }
    if(ax.type === 'date') {
        // If tick0 is unusual, give tickround a bit more information
        // not necessarily *all* the information in tick0 though, if it's really odd
        // minimal string length for tick0: 'd' is 10, 'M' is 16, 'S' is 19
        // take off a leading minus (year < 0) and i (intercalary month) so length is consistent
        var tick0ms = ax.r2l(ax.tick0),
            tick0str = ax.l2r(tick0ms).replace(/(^-|i)/g, ''),
            tick0len = tick0str.length;

        if(String(dtick).charAt(0) === 'M') {
            // any tick0 more specific than a year: alway show the full date
            if(tick0len > 10 || tick0str.substr(5) !== '01-01') ax._tickround = 'd';
            // show the month unless ticks are full multiples of a year
            else ax._tickround = (+(dtick.substr(1)) % 12 === 0) ? 'y' : 'm';
        }
        else if((dtick >= ONEDAY && tick0len <= 10) || (dtick >= ONEDAY * 15)) ax._tickround = 'd';
        else if((dtick >= ONEMIN && tick0len <= 16) || (dtick >= ONEHOUR)) ax._tickround = 'M';
        else if((dtick >= ONESEC && tick0len <= 19) || (dtick >= ONEMIN)) ax._tickround = 'S';
        else {
            // tickround is a number of digits of fractional seconds
            // of any two adjacent ticks, at least one will have the maximum fractional digits
            // of all possible ticks - so take the max. length of tick0 and the next one
            var tick1len = ax.l2r(tick0ms + dtick).replace(/^-/, '').length;
            ax._tickround = Math.max(tick0len, tick1len) - 20;
        }
    }
    else if(isNumeric(dtick) || dtick.charAt(0) === 'L') {
        // linear or log (except D1, D2)
        var rng = ax.range.map(ax.r2d || Number);
        if(!isNumeric(dtick)) dtick = Number(dtick.substr(1));
        // 2 digits past largest digit of dtick
        ax._tickround = 2 - Math.floor(Math.log(dtick) / Math.LN10 + 0.01);

        var maxend = Math.max(Math.abs(rng[0]), Math.abs(rng[1]));

        var rangeexp = Math.floor(Math.log(maxend) / Math.LN10 + 0.01);
        if(Math.abs(rangeexp) > 3) {
            if(ax.exponentformat === 'SI' || ax.exponentformat === 'B') {
                ax._tickexponent = 3 * Math.round((rangeexp - 1) / 3);
            }
            else ax._tickexponent = rangeexp;
        }
    }
    // D1 or D2 (log)
    else ax._tickround = null;
}

// months and years don't have constant millisecond values
// (but a year is always 12 months so we only need months)
// log-scale ticks are also not consistently spaced, except
// for pure powers of 10
// numeric ticks always have constant differences, other datetime ticks
// can all be calculated as constant number of milliseconds
axes.tickIncrement = function(x, dtick, axrev, calendar) {
    var axSign = axrev ? -1 : 1;

    // includes linear, all dates smaller than month, and pure 10^n in log
    if(isNumeric(dtick)) return x + axSign * dtick;

    // everything else is a string, one character plus a number
    var tType = dtick.charAt(0),
        dtSigned = axSign * Number(dtick.substr(1));

    // Dates: months (or years - see Lib.incrementMonth)
    if(tType === 'M') return Lib.incrementMonth(x, dtSigned, calendar);

    // Log scales: Linear, Digits
    else if(tType === 'L') return Math.log(Math.pow(10, x) + dtSigned) / Math.LN10;

    // log10 of 2,5,10, or all digits (logs just have to be
    // close enough to round)
    else if(tType === 'D') {
        var tickset = (dtick === 'D2') ? roundLog2 : roundLog1,
            x2 = x + axSign * 0.01,
            frac = Lib.roundUp(Lib.mod(x2, 1), tickset, axrev);

        return Math.floor(x2) +
            Math.log(d3.round(Math.pow(10, frac), 1)) / Math.LN10;
    }
    else throw 'unrecognized dtick ' + String(dtick);
};

// calculate the first tick on an axis
axes.tickFirst = function(ax) {
    var r2l = ax.r2l || Number,
        rng = Lib.simpleMap(ax.range, r2l),
        axrev = rng[1] < rng[0],
        sRound = axrev ? Math.floor : Math.ceil,
        // add a tiny extra bit to make sure we get ticks
        // that may have been rounded out
        r0 = rng[0] * 1.0001 - rng[1] * 0.0001,
        dtick = ax.dtick,
        tick0 = r2l(ax.tick0);

    if(isNumeric(dtick)) {
        var tmin = sRound((r0 - tick0) / dtick) * dtick + tick0;

        // make sure no ticks outside the category list
        if(ax.type === 'category') {
            tmin = Lib.constrain(tmin, 0, ax._categories.length - 1);
        }
        return tmin;
    }

    var tType = dtick.charAt(0),
        dtNum = Number(dtick.substr(1));

    // Dates: months (or years)
    if(tType === 'M') {
        var cnt = 0,
            t0 = tick0,
            t1,
            mult,
            newDTick;

        // This algorithm should work for *any* nonlinear (but close to linear!)
        // tick spacing. Limit to 10 iterations, for gregorian months it's normally <=3.
        while(cnt < 10) {
            t1 = axes.tickIncrement(t0, dtick, axrev, ax.calendar);
            if((t1 - r0) * (t0 - r0) <= 0) {
                // t1 and t0 are on opposite sides of r0! we've succeeded!
                if(axrev) return Math.min(t0, t1);
                return Math.max(t0, t1);
            }
            mult = (r0 - ((t0 + t1) / 2)) / (t1 - t0);
            newDTick = tType + ((Math.abs(Math.round(mult)) || 1) * dtNum);
            t0 = axes.tickIncrement(t0, newDTick, mult < 0 ? !axrev : axrev, ax.calendar);
            cnt++;
        }
        Lib.error('tickFirst did not converge', ax);
        return t0;
    }

    // Log scales: Linear, Digits
    else if(tType === 'L') {
        return Math.log(sRound(
            (Math.pow(10, r0) - tick0) / dtNum) * dtNum + tick0) / Math.LN10;
    }
    else if(tType === 'D') {
        var tickset = (dtick === 'D2') ? roundLog2 : roundLog1,
            frac = Lib.roundUp(Lib.mod(r0, 1), tickset, axrev);

        return Math.floor(r0) +
            Math.log(d3.round(Math.pow(10, frac), 1)) / Math.LN10;
    }
    else throw 'unrecognized dtick ' + String(dtick);
};

// draw the text for one tick.
// px,py are the location on gd.paper
// prefix is there so the x axis ticks can be dropped a line
// ax is the axis layout, x is the tick value
// hover is a (truthy) flag for whether to show numbers with a bit
// more precision for hovertext
axes.tickText = function(ax, x, hover) {
    var out = tickTextObj(ax, x),
        hideexp,
        arrayMode = ax.tickmode === 'array',
        extraPrecision = hover || arrayMode,
        i,
        tickVal2l = ax.type === 'category' ? ax.d2l_noadd : ax.d2l;

    if(arrayMode && Array.isArray(ax.ticktext)) {
        var rng = Lib.simpleMap(ax.range, ax.r2l),
            minDiff = Math.abs(rng[1] - rng[0]) / 10000;
        for(i = 0; i < ax.ticktext.length; i++) {
            if(Math.abs(x - tickVal2l(ax.tickvals[i])) < minDiff) break;
        }
        if(i < ax.ticktext.length) {
            out.text = String(ax.ticktext[i]);
            return out;
        }
    }

    function isHidden(showAttr) {
        var first_or_last;

        if(showAttr === undefined) return true;
        if(hover) return showAttr === 'none';

        first_or_last = {
            first: ax._tmin,
            last: ax._tmax
        }[showAttr];

        return showAttr !== 'all' && x !== first_or_last;
    }

    hideexp = ax.exponentformat !== 'none' && isHidden(ax.showexponent) ? 'hide' : '';

    if(ax.type === 'date') formatDate(ax, out, hover, extraPrecision);
    else if(ax.type === 'log') formatLog(ax, out, hover, extraPrecision, hideexp);
    else if(ax.type === 'category') formatCategory(ax, out);
    else formatLinear(ax, out, hover, extraPrecision, hideexp);

    // add prefix and suffix
    if(ax.tickprefix && !isHidden(ax.showtickprefix)) out.text = ax.tickprefix + out.text;
    if(ax.ticksuffix && !isHidden(ax.showticksuffix)) out.text += ax.ticksuffix;

    return out;
};

function tickTextObj(ax, x, text) {
    var tf = ax.tickfont || {};

    return {
        x: x,
        dx: 0,
        dy: 0,
        text: text || '',
        fontSize: tf.size,
        font: tf.family,
        fontColor: tf.color
    };
}

function formatDate(ax, out, hover, extraPrecision) {
    var tr = ax._tickround,
        fmt = (hover && ax.hoverformat) || ax.tickformat;

    if(extraPrecision) {
        // second or sub-second precision: extra always shows max digits.
        // for other fields, extra precision just adds one field.
        if(isNumeric(tr)) tr = 4;
        else tr = {y: 'm', m: 'd', d: 'M', M: 'S', S: 4}[tr];
    }

    var dateStr = Lib.formatDate(out.x, fmt, tr, ax.calendar),
        headStr;

    var splitIndex = dateStr.indexOf('\n');
    if(splitIndex !== -1) {
        headStr = dateStr.substr(splitIndex + 1);
        dateStr = dateStr.substr(0, splitIndex);
    }

    if(extraPrecision) {
        // if extraPrecision led to trailing zeros, strip them off
        // actually, this can lead to removing even more zeros than
        // in the original rounding, but that's fine because in these
        // contexts uniformity is not so important (if there's even
        // anything to be uniform with!)

        // can we remove the whole time part?
        if(dateStr === '00:00:00' || dateStr === '00:00') {
            dateStr = headStr;
            headStr = '';
        }
        else if(dateStr.length === 8) {
            // strip off seconds if they're zero (zero fractional seconds
            // are already omitted)
            // but we never remove minutes and leave just hours
            dateStr = dateStr.replace(/:00$/, '');
        }
    }

    if(headStr) {
        if(hover) {
            // hover puts it all on one line, so headPart works best up front
            // except for year headPart: turn this into "Jan 1, 2000" etc.
            if(tr === 'd') dateStr += ', ' + headStr;
            else dateStr = headStr + (dateStr ? ', ' + dateStr : '');
        }
        else if(!ax._inCalcTicks || (headStr !== ax._prevDateHead)) {
            dateStr += '<br>' + headStr;
            ax._prevDateHead = headStr;
        }
    }

    out.text = dateStr;
}

function formatLog(ax, out, hover, extraPrecision, hideexp) {
    var dtick = ax.dtick,
        x = out.x;
    if(extraPrecision && ((typeof dtick !== 'string') || dtick.charAt(0) !== 'L')) dtick = 'L3';

    if(ax.tickformat || (typeof dtick === 'string' && dtick.charAt(0) === 'L')) {
        out.text = numFormat(Math.pow(10, x), ax, hideexp, extraPrecision);
    }
    else if(isNumeric(dtick) || ((dtick.charAt(0) === 'D') && (Lib.mod(x + 0.01, 1) < 0.1))) {
        if(['e', 'E', 'power'].indexOf(ax.exponentformat) !== -1) {
            var p = Math.round(x);
            if(p === 0) out.text = 1;
            else if(p === 1) out.text = '10';
            else if(p > 1) out.text = '10<sup>' + p + '</sup>';
            else out.text = '10<sup>\u2212' + -p + '</sup>';

            out.fontSize *= 1.25;
        }
        else {
            out.text = numFormat(Math.pow(10, x), ax, '', 'fakehover');
            if(dtick === 'D1' && ax._id.charAt(0) === 'y') {
                out.dy -= out.fontSize / 6;
            }
        }
    }
    else if(dtick.charAt(0) === 'D') {
        out.text = String(Math.round(Math.pow(10, Lib.mod(x, 1))));
        out.fontSize *= 0.75;
    }
    else throw 'unrecognized dtick ' + String(dtick);

    // if 9's are printed on log scale, move the 10's away a bit
    if(ax.dtick === 'D1') {
        var firstChar = String(out.text).charAt(0);
        if(firstChar === '0' || firstChar === '1') {
            if(ax._id.charAt(0) === 'y') {
                out.dx -= out.fontSize / 4;
            }
            else {
                out.dy += out.fontSize / 2;
                out.dx += (ax.range[1] > ax.range[0] ? 1 : -1) *
                    out.fontSize * (x < 0 ? 0.5 : 0.25);
            }
        }
    }
}

function formatCategory(ax, out) {
    var tt = ax._categories[Math.round(out.x)];
    if(tt === undefined) tt = '';
    out.text = String(tt);
}

function formatLinear(ax, out, hover, extraPrecision, hideexp) {
    // don't add an exponent to zero if we're showing all exponents
    // so the only reason you'd show an exponent on zero is if it's the
    // ONLY tick to get an exponent (first or last)
    if(ax.showexponent === 'all' && Math.abs(out.x / ax.dtick) < 1e-6) {
        hideexp = 'hide';
    }
    out.text = numFormat(out.x, ax, hideexp, extraPrecision);
}

// format a number (tick value) according to the axis settings
// new, more reliable procedure than d3.round or similar:
// add half the rounding increment, then stringify and truncate
// also automatically switch to sci. notation
var SIPREFIXES = ['f', 'p', 'n', 'μ', 'm', '', 'k', 'M', 'G', 'T'];

function numFormat(v, ax, fmtoverride, hover) {
        // negative?
    var isNeg = v < 0,
        // max number of digits past decimal point to show
        tickRound = ax._tickround,
        exponentFormat = fmtoverride || ax.exponentformat || 'B',
        exponent = ax._tickexponent,
        tickformat = ax.tickformat,
        separatethousands = ax.separatethousands;

    // special case for hover: set exponent just for this value, and
    // add a couple more digits of precision over tick labels
    if(hover) {
        // make a dummy axis obj to get the auto rounding and exponent
        var ah = {
            exponentformat: ax.exponentformat,
            dtick: ax.showexponent === 'none' ? ax.dtick :
                (isNumeric(v) ? Math.abs(v) || 1 : 1),
            // if not showing any exponents, don't change the exponent
            // from what we calculate
            range: ax.showexponent === 'none' ? ax.range.map(ax.r2d) : [0, v || 1]
        };
        autoTickRound(ah);
        tickRound = (Number(ah._tickround) || 0) + 4;
        exponent = ah._tickexponent;
        if(ax.hoverformat) tickformat = ax.hoverformat;
    }

    if(tickformat) return d3.format(tickformat)(v).replace(/-/g, '\u2212');

    // 'epsilon' - rounding increment
    var e = Math.pow(10, -tickRound) / 2;

    // exponentFormat codes:
    // 'e' (1.2e+6, default)
    // 'E' (1.2E+6)
    // 'SI' (1.2M)
    // 'B' (same as SI except 10^9=B not G)
    // 'none' (1200000)
    // 'power' (1.2x10^6)
    // 'hide' (1.2, use 3rd argument=='hide' to eg
    //      only show exponent on last tick)
    if(exponentFormat === 'none') exponent = 0;

    // take the sign out, put it back manually at the end
    // - makes cases easier
    v = Math.abs(v);
    if(v < e) {
        // 0 is just 0, but may get exponent if it's the last tick
        v = '0';
        isNeg = false;
    }
    else {
        v += e;
        // take out a common exponent, if any
        if(exponent) {
            v *= Math.pow(10, -exponent);
            tickRound += exponent;
        }
        // round the mantissa
        if(tickRound === 0) v = String(Math.floor(v));
        else if(tickRound < 0) {
            v = String(Math.round(v));
            v = v.substr(0, v.length + tickRound);
            for(var i = tickRound; i < 0; i++) v += '0';
        }
        else {
            v = String(v);
            var dp = v.indexOf('.') + 1;
            if(dp) v = v.substr(0, dp + tickRound).replace(/\.?0+$/, '');
        }
        // insert appropriate decimal point and thousands separator
        v = Lib.numSeparate(v, ax._separators, separatethousands);
    }

    // add exponent
    if(exponent && exponentFormat !== 'hide') {
        var signedExponent;
        if(exponent < 0) signedExponent = '\u2212' + -exponent;
        else if(exponentFormat !== 'power') signedExponent = '+' + exponent;
        else signedExponent = String(exponent);

        if(exponentFormat === 'e' ||
                ((exponentFormat === 'SI' || exponentFormat === 'B') &&
                 (exponent > 12 || exponent < -15))) {
            v += 'e' + signedExponent;
        }
        else if(exponentFormat === 'E') {
            v += 'E' + signedExponent;
        }
        else if(exponentFormat === 'power') {
            v += '×10<sup>' + signedExponent + '</sup>';
        }
        else if(exponentFormat === 'B' && exponent === 9) {
            v += 'B';
        }
        else if(exponentFormat === 'SI' || exponentFormat === 'B') {
            v += SIPREFIXES[exponent / 3 + 5];
        }
    }

    // put sign back in and return
    // replace standard minus character (which is technically a hyphen)
    // with a true minus sign
    if(isNeg) return '\u2212' + v;
    return v;
}


axes.subplotMatch = /^x([0-9]*)y([0-9]*)$/;

// getSubplots - extract all combinations of axes we need to make plots for
// as an array of items like 'xy', 'x2y', 'x2y2'...
// sorted by x (x,x2,x3...) then y
// optionally restrict to only subplots containing axis object ax
// looks both for combinations of x and y found in the data
// and at axes and their anchors
axes.getSubplots = function(gd, ax) {
    var subplots = [];
    var i, j, sp;

    // look for subplots in the data
    var data = gd._fullData || gd.data || [];

    for(i = 0; i < data.length; i++) {
        var trace = data[i];

        if(trace.visible === false || trace.visible === 'legendonly' ||
            !(Registry.traceIs(trace, 'cartesian') || Registry.traceIs(trace, 'gl2d'))
        ) continue;

        var xId = trace.xaxis || 'x',
            yId = trace.yaxis || 'y';
        sp = xId + yId;

        if(subplots.indexOf(sp) === -1) subplots.push(sp);
    }

    // look for subplots in the axes/anchors, so that we at least draw all axes
    var axesList = axes.list(gd, '', true);

    function hasAx2(sp, ax2) {
        return sp.indexOf(ax2._id) !== -1;
    }

    for(i = 0; i < axesList.length; i++) {
        var ax2 = axesList[i],
            ax2Letter = ax2._id.charAt(0),
            ax3Id = (ax2.anchor === 'free') ?
                ((ax2Letter === 'x') ? 'y' : 'x') :
                ax2.anchor,
            ax3 = axes.getFromId(gd, ax3Id);

        // look if ax2 is already represented in the data
        var foundAx2 = false;
        for(j = 0; j < subplots.length; j++) {
            if(hasAx2(subplots[j], ax2)) {
                foundAx2 = true;
                break;
            }
        }

        // ignore free axes that already represented in the data
        if(ax2.anchor === 'free' && foundAx2) continue;

        // ignore anchor-less axes
        if(!ax3) continue;

        sp = (ax2Letter === 'x') ?
            ax2._id + ax3._id :
            ax3._id + ax2._id;

        if(subplots.indexOf(sp) === -1) subplots.push(sp);
    }

    // filter invalid subplots
    var spMatch = axes.subplotMatch,
        allSubplots = [];

    for(i = 0; i < subplots.length; i++) {
        sp = subplots[i];
        if(spMatch.test(sp)) allSubplots.push(sp);
    }

    // sort the subplot ids
    allSubplots.sort(function(a, b) {
        var aMatch = a.match(spMatch),
            bMatch = b.match(spMatch);

        if(aMatch[1] === bMatch[1]) {
            return +(aMatch[2] || 1) - (bMatch[2] || 1);
        }

        return +(aMatch[1]||0) - (bMatch[1]||0);
    });

    if(ax) return axes.findSubplotsWithAxis(allSubplots, ax);
    return allSubplots;
};

// find all subplots with axis 'ax'
axes.findSubplotsWithAxis = function(subplots, ax) {
    var axMatch = new RegExp(
        (ax._id.charAt(0) === 'x') ? ('^' + ax._id + 'y') : (ax._id + '$')
    );
    var subplotsWithAxis = [];

    for(var i = 0; i < subplots.length; i++) {
        var sp = subplots[i];
        if(axMatch.test(sp)) subplotsWithAxis.push(sp);
    }

    return subplotsWithAxis;
};

// makeClipPaths: prepare clipPaths for all single axes and all possible xy pairings
axes.makeClipPaths = function(gd) {
    var fullLayout = gd._fullLayout,
        defs = fullLayout._defs,
        fullWidth = {_offset: 0, _length: fullLayout.width, _id: ''},
        fullHeight = {_offset: 0, _length: fullLayout.height, _id: ''},
        xaList = axes.list(gd, 'x', true),
        yaList = axes.list(gd, 'y', true),
        clipList = [],
        i,
        j;

    for(i = 0; i < xaList.length; i++) {
        clipList.push({x: xaList[i], y: fullHeight});
        for(j = 0; j < yaList.length; j++) {
            if(i === 0) clipList.push({x: fullWidth, y: yaList[j]});
            clipList.push({x: xaList[i], y: yaList[j]});
        }
    }

    var defGroup = defs.selectAll('g.clips')
        .data([0]);

    defGroup.enter().append('g')
        .classed('clips', true);

    // selectors don't work right with camelCase tags,
    // have to use class instead
    // https://groups.google.com/forum/#!topic/d3-js/6EpAzQ2gU9I
    var axClips = defGroup.selectAll('.axesclip')
        .data(clipList, function(d) { return d.x._id + d.y._id; });

    axClips.enter().append('clipPath')
        .classed('axesclip', true)
        .attr('id', function(d) { return 'clip' + fullLayout._uid + d.x._id + d.y._id; })
      .append('rect');

    axClips.exit().remove();

    axClips.each(function(d) {
        d3.select(this).select('rect').attr({
            x: d.x._offset || 0,
            y: d.y._offset || 0,
            width: d.x._length || 1,
            height: d.y._length || 1
        });
    });
};


// doTicks: draw ticks, grids, and tick labels
// axid: 'x', 'y', 'x2' etc,
//     blank to do all,
//     'redraw' to force full redraw, and reset:
//          ax._r (stored range for use by zoom/pan)
//          ax._rl (stored linearized range for use by zoom/pan)
//     or can pass in an axis object directly
axes.doTicks = function(gd, axid, skipTitle) {
    var fullLayout = gd._fullLayout,
        ax,
        independent = false;

    // allow passing an independent axis object instead of id
    if(typeof axid === 'object') {
        ax = axid;
        axid = ax._id;
        independent = true;
    }
    else {
        ax = axes.getFromId(gd, axid);

        if(axid === 'redraw') {
            fullLayout._paper.selectAll('g.subplot').each(function(subplot) {
                var plotinfo = fullLayout._plots[subplot],
                    xa = plotinfo.xaxis,
                    ya = plotinfo.yaxis;

                plotinfo.xaxislayer
                    .selectAll('.' + xa._id + 'tick').remove();
                plotinfo.yaxislayer
                    .selectAll('.' + ya._id + 'tick').remove();
                plotinfo.gridlayer
                    .selectAll('path').remove();
                plotinfo.zerolinelayer
                    .selectAll('path').remove();
            });
        }

        if(!axid || axid === 'redraw') {
            return Lib.syncOrAsync(axes.list(gd, '', true).map(function(ax) {
                return function() {
                    if(!ax._id) return;
                    var axDone = axes.doTicks(gd, ax._id);
                    if(axid === 'redraw') {
                        ax._r = ax.range.slice();
                        ax._rl = Lib.simpleMap(ax._r, ax.r2l);
                    }
                    return axDone;
                };
            }));
        }
    }

    // make sure we only have allowed options for exponents
    // (others can make confusing errors)
    if(!ax.tickformat) {
        if(['none', 'e', 'E', 'power', 'SI', 'B'].indexOf(ax.exponentformat) === -1) {
            ax.exponentformat = 'e';
        }
        if(['all', 'first', 'last', 'none'].indexOf(ax.showexponent) === -1) {
            ax.showexponent = 'all';
        }
    }

    // set scaling to pixels
    ax.setScale();

    var axLetter = axid.charAt(0),
        counterLetter = axes.counterLetter(axid),
        vals = axes.calcTicks(ax),
        datafn = function(d) { return [d.text, d.x, ax.mirror].join('_'); },
        tcls = axid + 'tick',
        gcls = axid + 'grid',
        zcls = axid + 'zl',
        pad = (ax.linewidth || 1) / 2,
        labelStandoff =
            (ax.ticks === 'outside' ? ax.ticklen : 1) + (ax.linewidth || 0),
        labelShift = 0,
        gridWidth = Drawing.crispRound(gd, ax.gridwidth, 1),
        zeroLineWidth = Drawing.crispRound(gd, ax.zerolinewidth, gridWidth),
        tickWidth = Drawing.crispRound(gd, ax.tickwidth, 1),
        sides, transfn, tickpathfn, subplots,
        i;

    if(ax._counterangle && ax.ticks === 'outside') {
        var caRad = ax._counterangle * Math.PI / 180;
        labelStandoff = ax.ticklen * Math.cos(caRad) + (ax.linewidth || 0);
        labelShift = ax.ticklen * Math.sin(caRad);
    }

    // positioning arguments for x vs y axes
    if(axLetter === 'x') {
        sides = ['bottom', 'top'];
        transfn = function(d) {
            return 'translate(' + ax.l2p(d.x) + ',0)';
        };
        tickpathfn = function(shift, len) {
            if(ax._counterangle) {
                var caRad = ax._counterangle * Math.PI / 180;
                return 'M0,' + shift + 'l' + (Math.sin(caRad) * len) + ',' + (Math.cos(caRad) * len);
            }
            else return 'M0,' + shift + 'v' + len;
        };
    }
    else if(axLetter === 'y') {
        sides = ['left', 'right'];
        transfn = function(d) {
            return 'translate(0,' + ax.l2p(d.x) + ')';
        };
        tickpathfn = function(shift, len) {
            if(ax._counterangle) {
                var caRad = ax._counterangle * Math.PI / 180;
                return 'M' + shift + ',0l' + (Math.cos(caRad) * len) + ',' + (-Math.sin(caRad) * len);
            }
            else return 'M' + shift + ',0h' + len;
        };
    }
    else {
        Lib.warn('Unrecognized doTicks axis:', axid);
        return;
    }
    var axside = ax.side || sides[0],
    // which direction do the side[0], side[1], and free ticks go?
    // then we flip if outside XOR y axis
        ticksign = [-1, 1, axside === sides[1] ? 1 : -1];
    if((ax.ticks !== 'inside') === (axLetter === 'x')) {
        ticksign = ticksign.map(function(v) { return -v; });
    }

    if(!ax.visible) return;

    // remove zero lines, grid lines, and inside ticks if they're within
    // 1 pixel of the end
    // The key case here is removing zero lines when the axis bound is zero.
    function clipEnds(d) {
        var p = ax.l2p(d.x);
        return (p > 1 && p < ax._length - 1);
    }
    var valsClipped = vals.filter(clipEnds);

    function drawTicks(container, tickpath) {
        var ticks = container.selectAll('path.' + tcls)
            .data(ax.ticks === 'inside' ? valsClipped : vals, datafn);
        if(tickpath && ax.ticks) {
            ticks.enter().append('path').classed(tcls, 1).classed('ticks', 1)
                .classed('crisp', 1)
                .call(Color.stroke, ax.tickcolor)
                .style('stroke-width', tickWidth + 'px')
                .attr('d', tickpath);
            ticks.attr('transform', transfn);
            ticks.exit().remove();
        }
        else ticks.remove();
    }

    function drawLabels(container, position) {
        // tick labels - for now just the main labels.
        // TODO: mirror labels, esp for subplots
        var tickLabels = container.selectAll('g.' + tcls).data(vals, datafn);
        if(!ax.showticklabels || !isNumeric(position)) {
            tickLabels.remove();
            drawAxTitle();
            return;
        }

        var labelx, labely, labelanchor, labelpos0, flipit;
        if(axLetter === 'x') {
            flipit = (axside === 'bottom') ? 1 : -1;
            labelx = function(d) { return d.dx + labelShift * flipit; };
            labelpos0 = position + (labelStandoff + pad) * flipit;
            labely = function(d) {
                return d.dy + labelpos0 + d.fontSize *
                    ((axside === 'bottom') ? 1 : -0.5);
            };
            labelanchor = function(angle) {
                if(!isNumeric(angle) || angle === 0 || angle === 180) {
                    return 'middle';
                }
                return (angle * flipit < 0) ? 'end' : 'start';
            };
        }
        else {
            flipit = (axside === 'right') ? 1 : -1;
            labely = function(d) { return d.dy + d.fontSize / 2 - labelShift * flipit; };
            labelx = function(d) {
                return d.dx + position + (labelStandoff + pad +
                    ((Math.abs(ax.tickangle) === 90) ? d.fontSize / 2 : 0)) * flipit;
            };
            labelanchor = function(angle) {
                if(isNumeric(angle) && Math.abs(angle) === 90) {
                    return 'middle';
                }
                return axside === 'right' ? 'start' : 'end';
            };
        }
        var maxFontSize = 0,
            autoangle = 0,
            labelsReady = [];
        tickLabels.enter().append('g').classed(tcls, 1)
            .append('text')
                // only so tex has predictable alignment that we can
                // alter later
                .attr('text-anchor', 'middle')
                .each(function(d) {
                    var thisLabel = d3.select(this),
                        newPromise = gd._promises.length;
                    thisLabel
                        .call(Drawing.setPosition, labelx(d), labely(d))
                        .call(Drawing.font, d.font, d.fontSize, d.fontColor)
                        .text(d.text)
                        .call(svgTextUtils.convertToTspans);
                    newPromise = gd._promises[newPromise];
                    if(newPromise) {
                        // if we have an async label, we'll deal with that
                        // all here so take it out of gd._promises and
                        // instead position the label and promise this in
                        // labelsReady
                        labelsReady.push(gd._promises.pop().then(function() {
                            positionLabels(thisLabel, ax.tickangle);
                        }));
                    }
                    else {
                        // sync label: just position it now.
                        positionLabels(thisLabel, ax.tickangle);
                    }
                });
        tickLabels.exit().remove();

        tickLabels.each(function(d) {
            maxFontSize = Math.max(maxFontSize, d.fontSize);
        });

        function positionLabels(s, angle) {
            s.each(function(d) {
                var anchor = labelanchor(angle);
                var thisLabel = d3.select(this),
                    mathjaxGroup = thisLabel.select('.text-math-group'),
                    transform = transfn(d) +
                        ((isNumeric(angle) && +angle !== 0) ?
                        (' rotate(' + angle + ',' + labelx(d) + ',' +
                            (labely(d) - d.fontSize / 2) + ')') :
                        '');
                if(mathjaxGroup.empty()) {
                    var txt = thisLabel.select('text').attr({
                        transform: transform,
                        'text-anchor': anchor
                    });

                    if(!txt.empty()) {
                        txt.selectAll('tspan.line').attr({
                            x: txt.attr('x'),
                            y: txt.attr('y')
                        });
                    }
                }
                else {
                    var mjShift =
                        Drawing.bBox(mathjaxGroup.node()).width *
                            {end: -0.5, start: 0.5}[anchor];
                    mathjaxGroup.attr('transform', transform +
                        (mjShift ? 'translate(' + mjShift + ',0)' : ''));
                }
            });
        }

        // make sure all labels are correctly positioned at their base angle
        // the positionLabels call above is only for newly drawn labels.
        // do this without waiting, using the last calculated angle to
        // minimize flicker, then do it again when we know all labels are
        // there, putting back the prescribed angle to check for overlaps.
        positionLabels(tickLabels, ax._lastangle || ax.tickangle);

        function allLabelsReady() {
            return labelsReady.length && Promise.all(labelsReady);
        }

        function fixLabelOverlaps() {
            positionLabels(tickLabels, ax.tickangle);

            // check for auto-angling if x labels overlap
            // don't auto-angle at all for log axes with
            // base and digit format
            if(axLetter === 'x' && !isNumeric(ax.tickangle) &&
                    (ax.type !== 'log' || String(ax.dtick).charAt(0) !== 'D')) {
                var lbbArray = [];
                tickLabels.each(function(d) {
                    var s = d3.select(this),
                        thisLabel = s.select('.text-math-group'),
                        x = ax.l2p(d.x);
                    if(thisLabel.empty()) thisLabel = s.select('text');

                    var bb = Drawing.bBox(thisLabel.node());

                    lbbArray.push({
                        // ignore about y, just deal with x overlaps
                        top: 0,
                        bottom: 10,
                        height: 10,
                        left: x - bb.width / 2,
                        // impose a 2px gap
                        right: x + bb.width / 2 + 2,
                        width: bb.width + 2
                    });
                });
                for(i = 0; i < lbbArray.length - 1; i++) {
                    if(Lib.bBoxIntersect(lbbArray[i], lbbArray[i + 1])) {
                        // any overlap at all - set 30 degrees
                        autoangle = 30;
                        break;
                    }
                }
                if(autoangle) {
                    var tickspacing = Math.abs(
                            (vals[vals.length - 1].x - vals[0].x) * ax._m
                        ) / (vals.length - 1);
                    if(tickspacing < maxFontSize * 2.5) {
                        autoangle = 90;
                    }
                    positionLabels(tickLabels, autoangle);
                }
                ax._lastangle = autoangle;
            }

            // update the axis title
            // (so it can move out of the way if needed)
            // TODO: separate out scoot so we don't need to do
            // a full redraw of the title (mostly relevant for MathJax)
            drawAxTitle();
            return axid + ' done';
        }

        function calcBoundingBox() {
            var bBox = container.node().getBoundingClientRect();
            var gdBB = gd.getBoundingClientRect();

            /*
             * the way we're going to use this, the positioning that matters
             * is relative to the origin of gd. This is important particularly
             * if gd is scrollable, and may have been scrolled between the time
             * we calculate this and the time we use it
             */
            ax._boundingBox = {
                width: bBox.width,
                height: bBox.height,
                left: bBox.left - gdBB.left,
                right: bBox.right - gdBB.left,
                top: bBox.top - gdBB.top,
                bottom: bBox.bottom - gdBB.top
            };

            /*
             * for spikelines: what's the full domain of positions in the
             * opposite direction that are associated with this axis?
             * This means any axes that we make a subplot with, plus the
             * position of the axis itself if it's free.
             */
            if(subplots) {
                var fullRange = ax._counterSpan = [Infinity, -Infinity];

                for(i = 0; i < subplots.length; i++) {
                    var subplot = fullLayout._plots[subplots[i]];
                    var counterAxis = subplot[(axLetter === 'x') ? 'yaxis' : 'xaxis'];

                    extendRange(fullRange, [
                        counterAxis._offset,
                        counterAxis._offset + counterAxis._length
                    ]);
                }

                if(ax.anchor === 'free') {
                    extendRange(fullRange, (axLetter === 'x') ?
                        [ax._boundingBox.bottom, ax._boundingBox.top] :
                        [ax._boundingBox.right, ax._boundingBox.left]);
                }
            }

            function extendRange(range, newRange) {
                range[0] = Math.min(range[0], newRange[0]);
                range[1] = Math.max(range[1], newRange[1]);
            }
        }

        var done = Lib.syncOrAsync([
            allLabelsReady,
            fixLabelOverlaps,
            calcBoundingBox
        ]);
        if(done && done.then) gd._promises.push(done);
        return done;
    }

    function drawAxTitle() {
        if(skipTitle) return;

        // now this only applies to regular cartesian axes; colorbars and
        // others ALWAYS call doTicks with skipTitle=true so they can
        // configure their own titles.
        var ax = axisIds.getFromId(gd, axid),
            avoidSelection = d3.select(gd).selectAll('g.' + axid + 'tick'),
            avoid = {
                selection: avoidSelection,
                side: ax.side
            },
            axLetter = axid.charAt(0),
            gs = gd._fullLayout._size,
            offsetBase = 1.5,
            fontSize = ax.titlefont.size,
            transform,
            counterAxis,
            x,
            y;
        if(avoidSelection.size()) {
            var translation = Drawing.getTranslate(avoidSelection.node().parentNode);
            avoid.offsetLeft = translation.x;
            avoid.offsetTop = translation.y;
        }

        if(axLetter === 'x') {
            counterAxis = (ax.anchor === 'free') ?
                {_offset: gs.t + (1 - (ax.position || 0)) * gs.h, _length: 0} :
                axisIds.getFromId(gd, ax.anchor);

            x = ax._offset + ax._length / 2;
            y = counterAxis._offset + ((ax.side === 'top') ?
                -10 - fontSize * (offsetBase + (ax.showticklabels ? 1 : 0)) :
                counterAxis._length + 10 +
                    fontSize * (offsetBase + (ax.showticklabels ? 1.5 : 0.5)));

            if(ax.rangeslider && ax.rangeslider.visible && ax._boundingBox) {
                y += (fullLayout.height - fullLayout.margin.b - fullLayout.margin.t) *
                    ax.rangeslider.thickness + ax._boundingBox.height;
            }

            if(!avoid.side) avoid.side = 'bottom';
        }
        else {
            counterAxis = (ax.anchor === 'free') ?
                {_offset: gs.l + (ax.position || 0) * gs.w, _length: 0} :
                axisIds.getFromId(gd, ax.anchor);

            y = ax._offset + ax._length / 2;
            x = counterAxis._offset + ((ax.side === 'right') ?
                counterAxis._length + 10 +
                    fontSize * (offsetBase + (ax.showticklabels ? 1 : 0.5)) :
                -10 - fontSize * (offsetBase + (ax.showticklabels ? 0.5 : 0)));

            transform = {rotate: '-90', offset: 0};
            if(!avoid.side) avoid.side = 'left';
        }

        Titles.draw(gd, axid + 'title', {
            propContainer: ax,
            propName: ax._name + '.title',
            dfltName: axLetter.toUpperCase() + ' axis',
            avoid: avoid,
            transform: transform,
            attributes: {x: x, y: y, 'text-anchor': 'middle'}
        });
    }

    function traceHasBarsOrFill(trace, subplot) {
        if(trace.visible !== true || trace.xaxis + trace.yaxis !== subplot) return false;
        if(Registry.traceIs(trace, 'bar') && trace.orientation === {x: 'h', y: 'v'}[axLetter]) return true;
        return trace.fill && trace.fill.charAt(trace.fill.length - 1) === axLetter;
    }

    function drawGrid(plotinfo, counteraxis, subplot) {
        var gridcontainer = plotinfo.gridlayer,
            zlcontainer = plotinfo.zerolinelayer,
            gridvals = plotinfo['hidegrid' + axLetter] ? [] : valsClipped,
            gridpath = ax._gridpath ||
                'M0,0' + ((axLetter === 'x') ? 'v' : 'h') + counteraxis._length,
            grid = gridcontainer.selectAll('path.' + gcls)
                .data((ax.showgrid === false) ? [] : gridvals, datafn);
        grid.enter().append('path').classed(gcls, 1)
            .classed('crisp', 1)
            .attr('d', gridpath)
            .each(function(d) {
                if(ax.zeroline && (ax.type === 'linear' || ax.type === '-') &&
                        Math.abs(d.x) < ax.dtick / 100) {
                    d3.select(this).remove();
                }
            });
        grid.attr('transform', transfn)
            .call(Color.stroke, ax.gridcolor || '#ddd')
            .style('stroke-width', gridWidth + 'px');
        grid.exit().remove();

        // zero line
        if(zlcontainer) {
            var hasBarsOrFill = false;
            for(var i = 0; i < gd._fullData.length; i++) {
                if(traceHasBarsOrFill(gd._fullData[i], subplot)) {
                    hasBarsOrFill = true;
                    break;
                }
            }
            var rng = Lib.simpleMap(ax.range, ax.r2l),
                showZl = (rng[0] * rng[1] <= 0) && ax.zeroline &&
                (ax.type === 'linear' || ax.type === '-') && gridvals.length &&
                (hasBarsOrFill || clipEnds({x: 0}) || !ax.showline);
            var zl = zlcontainer.selectAll('path.' + zcls)
                .data(showZl ? [{x: 0}] : []);
            zl.enter().append('path').classed(zcls, 1).classed('zl', 1)
                .classed('crisp', 1)
                .attr('d', gridpath);
            zl.attr('transform', transfn)
                .call(Color.stroke, ax.zerolinecolor || Color.defaultLine)
                .style('stroke-width', zeroLineWidth + 'px');
            zl.exit().remove();
        }
    }

    if(independent) {
        drawTicks(ax._axislayer, tickpathfn(ax._pos + pad * ticksign[2], ticksign[2] * ax.ticklen));
        if(ax._counteraxis) {
            var fictionalPlotinfo = {
                gridlayer: ax._gridlayer,
                zerolinelayer: ax._zerolinelayer
            };
            drawGrid(fictionalPlotinfo, ax._counteraxis);
        }
        return drawLabels(ax._axislayer, ax._pos);
    }
    else {
        subplots = axes.getSubplots(gd, ax);
        var alldone = subplots.map(function(subplot) {
            var plotinfo = fullLayout._plots[subplot];

            if(!fullLayout._has('cartesian')) return;

            var container = plotinfo[axLetter + 'axislayer'],

                // [bottom or left, top or right, free, main]
                linepositions = ax._linepositions[subplot] || [],
                counteraxis = plotinfo[counterLetter + 'axis'],
                mainSubplot = counteraxis._id === ax.anchor,
                ticksides = [false, false, false],
                tickpath = '';

            // ticks
            if(ax.mirror === 'allticks') ticksides = [true, true, false];
            else if(mainSubplot) {
                if(ax.mirror === 'ticks') ticksides = [true, true, false];
                else ticksides[sides.indexOf(axside)] = true;
            }
            if(ax.mirrors) {
                for(i = 0; i < 2; i++) {
                    var thisMirror = ax.mirrors[counteraxis._id + sides[i]];
                    if(thisMirror === 'ticks' || thisMirror === 'labels') {
                        ticksides[i] = true;
                    }
                }
            }

            // free axis ticks
            if(linepositions[2] !== undefined) ticksides[2] = true;

            ticksides.forEach(function(showside, sidei) {
                var pos = linepositions[sidei],
                    tsign = ticksign[sidei];
                if(showside && isNumeric(pos)) {
                    tickpath += tickpathfn(pos + pad * tsign, tsign * ax.ticklen);
                }
            });

            drawTicks(container, tickpath);
            drawGrid(plotinfo, counteraxis, subplot);
            return drawLabels(container, linepositions[3]);
        }).filter(function(onedone) { return onedone && onedone.then; });

        return alldone.length ? Promise.all(alldone) : 0;
    }
};

// swap all the presentation attributes of the axes showing these traces
axes.swap = function(gd, traces) {
    var axGroups = makeAxisGroups(gd, traces);

    for(var i = 0; i < axGroups.length; i++) {
        swapAxisGroup(gd, axGroups[i].x, axGroups[i].y);
    }
};

function makeAxisGroups(gd, traces) {
    var groups = [],
        i,
        j;

    for(i = 0; i < traces.length; i++) {
        var groupsi = [],
            xi = gd._fullData[traces[i]].xaxis,
            yi = gd._fullData[traces[i]].yaxis;
        if(!xi || !yi) continue; // not a 2D cartesian trace?

        for(j = 0; j < groups.length; j++) {
            if(groups[j].x.indexOf(xi) !== -1 || groups[j].y.indexOf(yi) !== -1) {
                groupsi.push(j);
            }
        }

        if(!groupsi.length) {
            groups.push({x: [xi], y: [yi]});
            continue;
        }

        var group0 = groups[groupsi[0]],
            groupj;

        if(groupsi.length > 1) {
            for(j = 1; j < groupsi.length; j++) {
                groupj = groups[groupsi[j]];
                mergeAxisGroups(group0.x, groupj.x);
                mergeAxisGroups(group0.y, groupj.y);
            }
        }
        mergeAxisGroups(group0.x, [xi]);
        mergeAxisGroups(group0.y, [yi]);
    }

    return groups;
}

function mergeAxisGroups(intoSet, fromSet) {
    for(var i = 0; i < fromSet.length; i++) {
        if(intoSet.indexOf(fromSet[i]) === -1) intoSet.push(fromSet[i]);
    }
}

function swapAxisGroup(gd, xIds, yIds) {
    var i,
        j,
        xFullAxes = [],
        yFullAxes = [],
        layout = gd.layout;

    for(i = 0; i < xIds.length; i++) xFullAxes.push(axes.getFromId(gd, xIds[i]));
    for(i = 0; i < yIds.length; i++) yFullAxes.push(axes.getFromId(gd, yIds[i]));

    var allAxKeys = Object.keys(xFullAxes[0]),
        noSwapAttrs = [
            'anchor', 'domain', 'overlaying', 'position', 'side', 'tickangle'
        ],
        numericTypes = ['linear', 'log'];

    for(i = 0; i < allAxKeys.length; i++) {
        var keyi = allAxKeys[i],
            xVal = xFullAxes[0][keyi],
            yVal = yFullAxes[0][keyi],
            allEqual = true,
            coerceLinearX = false,
            coerceLinearY = false;
        if(keyi.charAt(0) === '_' || typeof xVal === 'function' ||
                noSwapAttrs.indexOf(keyi) !== -1) {
            continue;
        }
        for(j = 1; j < xFullAxes.length && allEqual; j++) {
            var xVali = xFullAxes[j][keyi];
            if(keyi === 'type' && numericTypes.indexOf(xVal) !== -1 &&
                    numericTypes.indexOf(xVali) !== -1 && xVal !== xVali) {
                // type is special - if we find a mixture of linear and log,
                // coerce them all to linear on flipping
                coerceLinearX = true;
            }
            else if(xVali !== xVal) allEqual = false;
        }
        for(j = 1; j < yFullAxes.length && allEqual; j++) {
            var yVali = yFullAxes[j][keyi];
            if(keyi === 'type' && numericTypes.indexOf(yVal) !== -1 &&
                    numericTypes.indexOf(yVali) !== -1 && yVal !== yVali) {
                // type is special - if we find a mixture of linear and log,
                // coerce them all to linear on flipping
                coerceLinearY = true;
            }
            else if(yFullAxes[j][keyi] !== yVal) allEqual = false;
        }
        if(allEqual) {
            if(coerceLinearX) layout[xFullAxes[0]._name].type = 'linear';
            if(coerceLinearY) layout[yFullAxes[0]._name].type = 'linear';
            swapAxisAttrs(layout, keyi, xFullAxes, yFullAxes);
        }
    }

    // now swap x&y for any annotations anchored to these x & y
    for(i = 0; i < gd._fullLayout.annotations.length; i++) {
        var ann = gd._fullLayout.annotations[i];
        if(xIds.indexOf(ann.xref) !== -1 &&
                yIds.indexOf(ann.yref) !== -1) {
            Lib.swapAttrs(layout.annotations[i], ['?']);
        }
    }
}

function swapAxisAttrs(layout, key, xFullAxes, yFullAxes) {
    // in case the value is the default for either axis,
    // look at the first axis in each list and see if
    // this key's value is undefined
    var np = Lib.nestedProperty,
        xVal = np(layout[xFullAxes[0]._name], key).get(),
        yVal = np(layout[yFullAxes[0]._name], key).get(),
        i;
    if(key === 'title') {
        // special handling of placeholder titles
        if(xVal === 'Click to enter X axis title') {
            xVal = 'Click to enter Y axis title';
        }
        if(yVal === 'Click to enter Y axis title') {
            yVal = 'Click to enter X axis title';
        }
    }

    for(i = 0; i < xFullAxes.length; i++) {
        np(layout, xFullAxes[i]._name + '.' + key).set(yVal);
    }
    for(i = 0; i < yFullAxes.length; i++) {
        np(layout, yFullAxes[i]._name + '.' + key).set(xVal);
    }
}
