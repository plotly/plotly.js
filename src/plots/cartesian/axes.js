'use strict';

var d3 = require('@plotly/d3');
var isNumeric = require('fast-isnumeric');
var Plots = require('../../plots/plots');

var Registry = require('../../registry');
var Lib = require('../../lib');
var strTranslate = Lib.strTranslate;
var svgTextUtils = require('../../lib/svg_text_utils');
var Titles = require('../../components/titles');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');

var axAttrs = require('./layout_attributes');
var cleanTicks = require('./clean_ticks');

var constants = require('../../constants/numerical');
var ONEMAXYEAR = constants.ONEMAXYEAR;
var ONEAVGYEAR = constants.ONEAVGYEAR;
var ONEMINYEAR = constants.ONEMINYEAR;
var ONEMAXQUARTER = constants.ONEMAXQUARTER;
var ONEAVGQUARTER = constants.ONEAVGQUARTER;
var ONEMINQUARTER = constants.ONEMINQUARTER;
var ONEMAXMONTH = constants.ONEMAXMONTH;
var ONEAVGMONTH = constants.ONEAVGMONTH;
var ONEMINMONTH = constants.ONEMINMONTH;
var ONEWEEK = constants.ONEWEEK;
var ONEDAY = constants.ONEDAY;
var HALFDAY = ONEDAY / 2;
var ONEHOUR = constants.ONEHOUR;
var ONEMIN = constants.ONEMIN;
var ONESEC = constants.ONESEC;
var ONEMILLI = constants.ONEMILLI;
var ONEMICROSEC = constants.ONEMICROSEC;
var MINUS_SIGN = constants.MINUS_SIGN;
var BADNUM = constants.BADNUM;

var ZERO_PATH = { K: 'zeroline' };
var GRID_PATH = { K: 'gridline', L: 'path' };
var MINORGRID_PATH = { K: 'minor-gridline', L: 'path' };
var TICK_PATH = { K: 'tick', L: 'path' };
var TICK_TEXT = { K: 'tick', L: 'text' };
var MARGIN_MAPPING = {
    width: ['x', 'r', 'l', 'xl', 'xr'],
    height: ['y', 't', 'b', 'yt', 'yb'],
    right: ['r', 'xr'],
    left: ['l', 'xl'],
    top: ['t', 'yt'],
    bottom: ['b', 'yb']
};

var alignmentConstants = require('../../constants/alignment');
var MID_SHIFT = alignmentConstants.MID_SHIFT;
var CAP_SHIFT = alignmentConstants.CAP_SHIFT;
var LINE_SPACING = alignmentConstants.LINE_SPACING;
var OPPOSITE_SIDE = alignmentConstants.OPPOSITE_SIDE;

var TEXTPAD = 3;

var axes = module.exports = {};

axes.setConvert = require('./set_convert');
var autoType = require('./axis_autotype');

var axisIds = require('./axis_ids');
var idSort = axisIds.idSort;
var isLinked = axisIds.isLinked;

// tight coupling to chart studio
axes.id2name = axisIds.id2name;
axes.name2id = axisIds.name2id;
axes.cleanId = axisIds.cleanId;
axes.list = axisIds.list;
axes.listIds = axisIds.listIds;
axes.getFromId = axisIds.getFromId;
axes.getFromTrace = axisIds.getFromTrace;

var autorange = require('./autorange');
axes.getAutoRange = autorange.getAutoRange;
axes.findExtremes = autorange.findExtremes;

var epsilon = 0.0001;
function expandRange(range) {
    var delta = (range[1] - range[0]) * epsilon;
    return [
        range[0] - delta,
        range[1] + delta
    ];
}

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
    var axLetter = attr.charAt(attr.length - 1);
    var axlist = gd._fullLayout._subplots[axLetter + 'axis'];
    var refAttr = attr + 'ref';
    var attrDef = {};

    if(!dflt) dflt = axlist[0] || (typeof extraOption === 'string' ? extraOption : extraOption[0]);
    if(!extraOption) extraOption = dflt;
    axlist = axlist.concat(axlist.map(function(x) { return x + ' domain'; }));

    // data-ref annotations are not supported in gl2d yet

    attrDef[refAttr] = {
        valType: 'enumerated',
        values: axlist.concat(extraOption ?
            (typeof extraOption === 'string' ? [extraOption] : extraOption) :
            []),
        dflt: dflt
    };

    // xref, yref
    return Lib.coerce(containerIn, containerOut, attrDef, refAttr);
};

/*
 * Get the type of an axis reference. This can be 'range', 'domain', or 'paper'.
 * This assumes ar is a valid axis reference and returns 'range' if it doesn't
 * match the patterns for 'paper' or 'domain'.
 *
 * ar: the axis reference string
 *
 */
axes.getRefType = function(ar) {
    if(ar === undefined) { return ar; }
    if(ar === 'paper') { return 'paper'; }
    if(ar === 'pixel') { return 'pixel'; }
    if(/( domain)$/.test(ar)) { return 'domain'; } else { return 'range'; }
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
    var cleanPos, pos;
    var axRefType = axes.getRefType(axRef);
    if(axRefType !== 'range') {
        cleanPos = Lib.ensureNumber;
        pos = coerce(attr, dflt);
    } else {
        var ax = axes.getFromId(gd, axRef);
        dflt = ax.fraction2r(dflt);
        pos = coerce(attr, dflt);
        cleanPos = ax.cleanPos;
    }
    containerOut[attr] = cleanPos(pos);
};

axes.cleanPosition = function(pos, gd, axRef) {
    var cleanPos = (axRef === 'paper' || axRef === 'pixel') ?
        Lib.ensureNumber :
        axes.getFromId(gd, axRef).cleanPos;

    return cleanPos(pos);
};

axes.redrawComponents = function(gd, axIds) {
    axIds = axIds ? axIds : axes.listIds(gd);

    var fullLayout = gd._fullLayout;

    function _redrawOneComp(moduleName, methodName, stashName, shortCircuit) {
        var method = Registry.getComponentMethod(moduleName, methodName);
        var stash = {};

        for(var i = 0; i < axIds.length; i++) {
            var ax = fullLayout[axes.id2name(axIds[i])];
            var indices = ax[stashName];

            for(var j = 0; j < indices.length; j++) {
                var ind = indices[j];

                if(!stash[ind]) {
                    method(gd, ind);
                    stash[ind] = 1;
                    // once is enough for images (which doesn't use the `i` arg anyway)
                    if(shortCircuit) return;
                }
            }
        }
    }

    // annotations and shapes 'draw' method is slow,
    // use the finer-grained 'drawOne' method instead
    _redrawOneComp('annotations', 'drawOne', '_annIndices');
    _redrawOneComp('shapes', 'drawOne', '_shapeIndices');
    _redrawOneComp('images', 'draw', '_imgIndices', true);
    _redrawOneComp('selections', 'drawOne', '_selectionIndices');
};

var getDataConversions = axes.getDataConversions = function(gd, trace, target, targetArray) {
    var ax;

    // If target points to an axis, use the type we already have for that
    // axis to find the data type. Otherwise use the values to autotype.
    var d2cTarget = (target === 'x' || target === 'y' || target === 'z') ?
        target :
        targetArray;

    // In the case of an array target, make a mock data array
    // and call supplyDefaults to the data type and
    // setup the data-to-calc method.
    if(Lib.isArrayOrTypedArray(d2cTarget)) {
        ax = {
            type: autoType(targetArray, undefined, {
                autotypenumbers: gd._fullLayout.autotypenumbers
            }),
            _categories: []
        };
        axes.setConvert(ax);

        // build up ax._categories (usually done during ax.makeCalcdata()
        if(ax.type === 'category') {
            for(var i = 0; i < targetArray.length; i++) {
                ax.d2c(targetArray[i]);
            }
        }
    } else {
        ax = axes.getFromTrace(gd, trace, d2cTarget);
    }

    // if 'target' has corresponding axis
    // -> use setConvert method
    if(ax) return {d2c: ax.d2c, c2d: ax.c2d};

    // special case for 'ids'
    // -> cast to String
    if(d2cTarget === 'ids') return {d2c: toString, c2d: toString};

    // otherwise (e.g. numeric-array of 'marker.color' or 'marker.size')
    // -> cast to Number

    return {d2c: toNum, c2d: toNum};
};

function toNum(v) { return +v; }
function toString(v) { return String(v); }

axes.getDataToCoordFunc = function(gd, trace, target, targetArray) {
    return getDataConversions(gd, trace, target, targetArray).d2c;
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
    if(['log', 'category', 'multicategory'].indexOf(ax.type) !== -1 || !allow) {
        ax._minDtick = 0;
    } else if(ax._minDtick === undefined) {
        // undefined means there's nothing there yet

        ax._minDtick = newDiff;
        ax._forceTick0 = newFirst;
    } else if(ax._minDtick) {
        if((ax._minDtick / newDiff + 1e-6) % 1 < 2e-6 &&
            // existing minDtick is an integer multiple of newDiff
            // (within rounding err)
            // and forceTick0 can be shifted to newFirst

                (((newFirst - ax._forceTick0) / newDiff % 1) +
                    1.000001) % 1 < 2e-6) {
            ax._minDtick = newDiff;
            ax._forceTick0 = newFirst;
        } else if((newDiff / ax._minDtick + 1e-6) % 1 > 2e-6 ||
            // if the converse is true (newDiff is a multiple of minDtick and
            // newFirst can be shifted to forceTick0) then do nothing - same
            // forcing stands. Otherwise, cancel forced minimum

                (((newFirst - ax._forceTick0) / ax._minDtick % 1) +
                    1.000001) % 1 > 2e-6) {
            ax._minDtick = 0;
        }
    }
};

// save a copy of the initial axis ranges in fullLayout
// use them in mode bar and dblclick events
axes.saveRangeInitial = function(gd, overwrite) {
    var axList = axes.list(gd, '', true);
    var hasOneAxisChanged = false;

    for(var i = 0; i < axList.length; i++) {
        var ax = axList[i];
        var isNew =
            ax._rangeInitial0 === undefined &&
            ax._rangeInitial1 === undefined;

        var hasChanged = isNew || (
            ax.range[0] !== ax._rangeInitial0 ||
            ax.range[1] !== ax._rangeInitial1
        );

        var autorange = ax.autorange;
        if((isNew && autorange !== true) || (overwrite && hasChanged)) {
            ax._rangeInitial0 = (autorange === 'min' || autorange === 'max reversed') ? undefined : ax.range[0];
            ax._rangeInitial1 = (autorange === 'max' || autorange === 'min reversed') ? undefined : ax.range[1];
            ax._autorangeInitial = autorange;
            hasOneAxisChanged = true;
        }
    }

    return hasOneAxisChanged;
};

// save a copy of the initial spike visibility
axes.saveShowSpikeInitial = function(gd, overwrite) {
    var axList = axes.list(gd, '', true);
    var hasOneAxisChanged = false;
    var allSpikesEnabled = 'on';

    for(var i = 0; i < axList.length; i++) {
        var ax = axList[i];
        var isNew = (ax._showSpikeInitial === undefined);
        var hasChanged = isNew || !(ax.showspikes === ax._showspikes);

        if(isNew || (overwrite && hasChanged)) {
            ax._showSpikeInitial = ax.showspikes;
            hasOneAxisChanged = true;
        }

        if(allSpikesEnabled === 'on' && !ax.showspikes) {
            allSpikesEnabled = 'off';
        }
    }
    gd._fullLayout._cartesianSpikesEnabled = allSpikesEnabled;
    return hasOneAxisChanged;
};

axes.autoBin = function(data, ax, nbins, is2d, calendar, size) {
    var dataMin = Lib.aggNums(Math.min, null, data);
    var dataMax = Lib.aggNums(Math.max, null, data);

    if(ax.type === 'category' || ax.type === 'multicategory') {
        return {
            start: dataMin - 0.5,
            end: dataMax + 0.5,
            size: Math.max(1, Math.round(size) || 1),
            _dataSpan: dataMax - dataMin,
        };
    }

    if(!calendar) calendar = ax.calendar;

    // piggyback off tick code to make "nice" bin sizes and edges
    var dummyAx;
    if(ax.type === 'log') {
        dummyAx = {
            type: 'linear',
            range: [dataMin, dataMax]
        };
    } else {
        dummyAx = {
            type: ax.type,
            range: Lib.simpleMap([dataMin, dataMax], ax.c2r, 0, calendar),
            calendar: calendar
        };
    }
    axes.setConvert(dummyAx);

    size = size && cleanTicks.dtick(size, dummyAx.type);

    if(size) {
        dummyAx.dtick = size;
        dummyAx.tick0 = cleanTicks.tick0(undefined, dummyAx.type, calendar);
    } else {
        var size0;
        if(nbins) size0 = ((dataMax - dataMin) / nbins);
        else {
            // totally auto: scale off std deviation so the highest bin is
            // somewhat taller than the total number of bins, but don't let
            // the size get smaller than the 'nice' rounded down minimum
            // difference between values
            var distinctData = Lib.distinctVals(data);
            var msexp = Math.pow(10, Math.floor(
                Math.log(distinctData.minDiff) / Math.LN10));
            var minSize = msexp * Lib.roundUp(
                distinctData.minDiff / msexp, [0.9, 1.9, 4.9, 9.9], true);
            size0 = Math.max(minSize, 2 * Lib.stdev(data) /
                Math.pow(data.length, is2d ? 0.25 : 0.4));

            // fallback if ax.d2c output BADNUMs
            // e.g. when user try to plot categorical bins
            // on a layout.xaxis.type: 'linear'
            if(!isNumeric(size0)) size0 = 1;
        }

        axes.autoTicks(dummyAx, size0);
    }

    var finalSize = dummyAx.dtick;
    var binStart = axes.tickIncrement(
            axes.tickFirst(dummyAx), finalSize, 'reverse', calendar);
    var binEnd, bincount;

    // check for too many data points right at the edges of bins
    // (>50% within 1% of bin edges) or all data points integral
    // and offset the bins accordingly
    if(typeof finalSize === 'number') {
        binStart = autoShiftNumericBins(binStart, data, dummyAx, dataMin, dataMax);

        bincount = 1 + Math.floor((dataMax - binStart) / finalSize);
        binEnd = binStart + bincount * finalSize;
    } else {
        // month ticks - should be the only nonlinear kind we have at this point.
        // dtick (as supplied by axes.autoTick) only has nonlinear values on
        // date and log axes, but even if you display a histogram on a log axis
        // we bin it on a linear axis (which one could argue against, but that's
        // a separate issue)
        if(dummyAx.dtick.charAt(0) === 'M') {
            binStart = autoShiftMonthBins(binStart, data, finalSize, dataMin, calendar);
        }

        // calculate the endpoint for nonlinear ticks - you have to
        // just increment until you're done
        binEnd = binStart;
        bincount = 0;
        while(binEnd <= dataMax) {
            binEnd = axes.tickIncrement(binEnd, finalSize, false, calendar);
            bincount++;
        }
    }

    return {
        start: ax.c2r(binStart, 0, calendar),
        end: ax.c2r(binEnd, 0, calendar),
        size: finalSize,
        _dataSpan: dataMax - dataMin
    };
};


function autoShiftNumericBins(binStart, data, ax, dataMin, dataMax) {
    var edgecount = 0;
    var midcount = 0;
    var intcount = 0;
    var blankCount = 0;

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
        if(ax.dtick < 1) {
            // all integers: if bin size is <1, it's because
            // that was specifically requested (large nbins)
            // so respect that... but center the bins containing
            // integers on those integers

            binStart = dataMin - 0.5 * ax.dtick;
        } else {
            // otherwise start half an integer down regardless of
            // the bin size, just enough to clear up endpoint
            // ambiguity about which integers are in which bins.

            binStart -= 0.5;
            if(binStart + ax.dtick < dataMin) binStart += ax.dtick;
        }
    } else if(midcount < dataCount * 0.1) {
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
        var numMonths = Number(dtick.slice(1));

        if((stats.exactYears > threshold) && (numMonths % 12 === 0)) {
            // The exact middle of a non-leap-year is 1.5 days into July
            // so if we start the bins here, all but leap years will
            // get hover-labeled as exact years.
            binStart = axes.tickIncrement(binStart, 'M6', 'reverse') + ONEDAY * 1.5;
        } else if(stats.exactMonths > threshold) {
            // Months are not as clean, but if we shift half the *longest*
            // month (31/2 days) then 31-day months will get labeled exactly
            // and shorter months will get labeled with the correct month
            // but shifted 12-36 hours into it.
            binStart = axes.tickIncrement(binStart, 'M1', 'reverse') + ONEDAY * 15.5;
        } else {
            // Shifting half a day is exact, but since these are month bins it
            // will always give a somewhat odd-looking label, until we do something
            // smarter like showing the bin boundaries (or the bounds of the actual
            // data in each bin)
            binStart -= HALFDAY;
        }
        var nextBinStart = axes.tickIncrement(binStart, dtick);

        if(nextBinStart <= dataMin) return nextBinStart;
    }
    return binStart;
}

// ----------------------------------------------------
// Ticks and grids
// ----------------------------------------------------

// ensure we have minor tick0 and dtick calculated
axes.prepMinorTicks = function(mockAx, ax, opts) {
    if(!ax.minor.dtick) {
        delete mockAx.dtick;
        var hasMajor = ax.dtick && isNumeric(ax._tmin);
        var mockMinorRange;
        if(hasMajor) {
            var tick2 = axes.tickIncrement(ax._tmin, ax.dtick, true);
            // mock range a tiny bit smaller than one major tick interval
            mockMinorRange = [ax._tmin, tick2 * 0.99 + ax._tmin * 0.01];
        } else {
            var rl = Lib.simpleMap(ax.range, ax.r2l);
            // If we don't have a major dtick, the concept of minor ticks is a little
            // ambiguous - just take a stab and say minor.nticks should span 1/5 the axis
            mockMinorRange = [rl[0], 0.8 * rl[0] + 0.2 * rl[1]];
        }
        mockAx.range = Lib.simpleMap(mockMinorRange, ax.l2r);
        mockAx._isMinor = true;

        axes.prepTicks(mockAx, opts);

        if(hasMajor) {
            var numericMajor = isNumeric(ax.dtick);
            var numericMinor = isNumeric(mockAx.dtick);
            var majorNum = numericMajor ? ax.dtick : +ax.dtick.substring(1);
            var minorNum = numericMinor ? mockAx.dtick : +mockAx.dtick.substring(1);
            if(numericMajor && numericMinor) {
                if(!isMultiple(majorNum, minorNum)) {
                    // give up on minor ticks - outside the below exceptions,
                    // this can only happen if minor.nticks is smaller than two jumps
                    // in the auto-tick scale and the first jump is not an even multiple
                    // (5 -> 2 or for dates 3 ->2, 15 -> 10 etc)  or if you provided
                    // an explicit dtick, in which case it's fine to give up,
                    // you can provide an explicit minor.dtick.
                    if((majorNum === 2 * ONEWEEK) && (minorNum === 3 * ONEDAY)) {
                        mockAx.dtick = ONEWEEK;
                    } else if(majorNum === ONEWEEK && !(ax._input.minor || {}).nticks) {
                        // minor.nticks defaults to 5, but in this one case we want 7,
                        // so the minor ticks show on all days of the week
                        mockAx.dtick = ONEDAY;
                    } else if(isClose(majorNum / minorNum, 2.5)) {
                        // 5*10^n -> 2*10^n and you've set nticks < 5
                        // quarters are pretty common, we don't do this by default as it
                        // would add an extra digit to display, but minor has no labels
                        mockAx.dtick = majorNum / 2;
                    } else {
                        mockAx.dtick = majorNum;
                    }
                } else if(majorNum === 2 * ONEWEEK && minorNum === 2 * ONEDAY) {
                    // this is a weird one: we don't want to automatically choose
                    // 2-day minor ticks for 2-week major, even though it IS an even multiple,
                    // because people would expect to see the weeks clearly
                    mockAx.dtick = ONEWEEK;
                }
            } else if(String(ax.dtick).charAt(0) === 'M') {
                if(numericMinor) {
                    mockAx.dtick = 'M1';
                } else {
                    if(!isMultiple(majorNum, minorNum)) {
                        // unless you provided an explicit ax.dtick (in which case
                        // it's OK for us to give up, you can provide an explicit
                        // minor.dtick too), this can only happen with:
                        // minor.nticks < 3 and dtick === M3, or
                        // minor.nticks < 5 and dtick === 5 * 10^n years
                        // so in all cases we just give up.
                        mockAx.dtick = ax.dtick;
                    } else if((majorNum >= 12) && (minorNum === 2)) {
                        // another special carve-out: for year major ticks, don't show
                        // 2-month minor ticks, bump to quarters
                        mockAx.dtick = 'M3';
                    }
                }
            } else if(String(mockAx.dtick).charAt(0) === 'L') {
                if(String(ax.dtick).charAt(0) === 'L') {
                    if(!isMultiple(majorNum, minorNum)) {
                        mockAx.dtick = isClose(majorNum / minorNum, 2.5) ? (ax.dtick / 2) : ax.dtick;
                    }
                } else {
                    mockAx.dtick = 'D1';
                }
            } else if(mockAx.dtick === 'D2' && +ax.dtick > 1) {
                // the D2 log axis tick spacing is confusing for unlabeled minor ticks if
                // the major dtick is more than one order of magnitude.
                mockAx.dtick = 1;
            }
        }
        // put back the original range, to use to find the full set of minor ticks
        mockAx.range = ax.range;
    }
    if(ax.minor._tick0Init === undefined) {
        // ensure identical tick0
        mockAx.tick0 = ax.tick0;
    }
};

function isMultiple(bigger, smaller) {
    return Math.abs((bigger / smaller + 0.5) % 1 - 0.5) < 0.001;
}

function isClose(a, b) {
    return Math.abs((a / b) - 1) < 0.001;
}

// ensure we have tick0, dtick, and tick rounding calculated
axes.prepTicks = function(ax, opts) {
    var rng = Lib.simpleMap(ax.range, ax.r2l, undefined, undefined, opts);

    // calculate max number of (auto) ticks to display based on plot size
    if(ax.tickmode === 'auto' || !ax.dtick) {
        var nt = ax.nticks;
        var minPx;

        if(!nt) {
            if(ax.type === 'category' || ax.type === 'multicategory') {
                minPx = ax.tickfont ? Lib.bigFont(ax.tickfont.size || 12) : 15;
                nt = ax._length / minPx;
            } else {
                minPx = ax._id.charAt(0) === 'y' ? 40 : 80;
                nt = Lib.constrain(ax._length / minPx, 4, 9) + 1;
            }

            // radial axes span half their domain,
            // multiply nticks value by two to get correct number of auto ticks.
            if(ax._name === 'radialaxis') nt *= 2;
        }

        if(!(ax.minor && ax.minor.tickmode !== 'array')) {
            // add a couple of extra digits for filling in ticks when we
            // have explicit tickvals without tick text
            if(ax.tickmode === 'array') nt *= 100;
        }

        ax._roughDTick = Math.abs(rng[1] - rng[0]) / nt;
        axes.autoTicks(ax, ax._roughDTick);

        // check for a forced minimum dtick
        if(ax._minDtick > 0 && ax.dtick < ax._minDtick * 2) {
            ax.dtick = ax._minDtick;
            ax.tick0 = ax.l2r(ax._forceTick0);
        }
    }

    if(ax.ticklabelmode === 'period') {
        adjustPeriodDelta(ax);
    }

    // check for missing tick0
    if(!ax.tick0) {
        ax.tick0 = (ax.type === 'date') ? '2000-01-01' : 0;
    }

    // ensure we don't try to make ticks below our minimum precision
    // see https://github.com/plotly/plotly.js/issues/2892
    if(ax.type === 'date' && ax.dtick < 0.1) ax.dtick = 0.1;

    // now figure out rounding of tick values
    autoTickRound(ax);
};

function nMonths(dtick) {
    return +(dtick.substring(1));
}

function adjustPeriodDelta(ax) { // adjusts ax.dtick and sets ax._definedDelta
    var definedDelta;

    function mDate() {
        return !(
            isNumeric(ax.dtick) ||
            ax.dtick.charAt(0) !== 'M'
        );
    }
    var isMDate = mDate();
    var tickformat = axes.getTickFormat(ax);
    if(tickformat) {
        var noDtick = ax._dtickInit !== ax.dtick;
        if(
            !(/%[fLQsSMX]/.test(tickformat))
            // %f: microseconds as a decimal number [000000, 999999]
            // %L: milliseconds as a decimal number [000, 999]
            // %Q: milliseconds since UNIX epoch
            // %s: seconds since UNIX epoch
            // %S: second as a decimal number [00,61]
            // %M: minute as a decimal number [00,59]
            // %X: the locale’s time, such as %-I:%M:%S %p
        ) {
            if(
                /%[HI]/.test(tickformat)
                // %H: hour (24-hour clock) as a decimal number [00,23]
                // %I: hour (12-hour clock) as a decimal number [01,12]
            ) {
                definedDelta = ONEHOUR;
                if(noDtick && !isMDate && ax.dtick < ONEHOUR) ax.dtick = ONEHOUR;
            } else if(
                /%p/.test(tickformat) // %p: either AM or PM
            ) {
                definedDelta = HALFDAY;
                if(noDtick && !isMDate && ax.dtick < HALFDAY) ax.dtick = HALFDAY;
            } else if(
                /%[Aadejuwx]/.test(tickformat)
                // %A: full weekday name
                // %a: abbreviated weekday name
                // %d: zero-padded day of the month as a decimal number [01,31]
                // %e: space-padded day of the month as a decimal number [ 1,31]
                // %j: day of the year as a decimal number [001,366]
                // %u: Monday-based (ISO 8601) weekday as a decimal number [1,7]
                // %w: Sunday-based weekday as a decimal number [0,6]
                // %x: the locale’s date, such as %-m/%-d/%Y
            ) {
                definedDelta = ONEDAY;
                if(noDtick && !isMDate && ax.dtick < ONEDAY) ax.dtick = ONEDAY;
            } else if(
                /%[UVW]/.test(tickformat)
                // %U: Sunday-based week of the year as a decimal number [00,53]
                // %V: ISO 8601 week of the year as a decimal number [01, 53]
                // %W: Monday-based week of the year as a decimal number [00,53]
            ) {
                definedDelta = ONEWEEK;
                if(noDtick && !isMDate && ax.dtick < ONEWEEK) ax.dtick = ONEWEEK;
            } else if(
                /%[Bbm]/.test(tickformat)
                // %B: full month name
                // %b: abbreviated month name
                // %m: month as a decimal number [01,12]
            ) {
                definedDelta = ONEAVGMONTH;
                if(noDtick && (
                    isMDate ? nMonths(ax.dtick) < 1 : ax.dtick < ONEMINMONTH)
                ) ax.dtick = 'M1';
            } else if(
                /%[q]/.test(tickformat)
                // %q: quarter of the year as a decimal number [1,4]
            ) {
                definedDelta = ONEAVGQUARTER;
                if(noDtick && (
                    isMDate ? nMonths(ax.dtick) < 3 : ax.dtick < ONEMINQUARTER)
                ) ax.dtick = 'M3';
            } else if(
                /%[Yy]/.test(tickformat)
                // %Y: year with century as a decimal number, such as 1999
                // %y: year without century as a decimal number [00,99]
            ) {
                definedDelta = ONEAVGYEAR;
                if(noDtick && (
                    isMDate ? nMonths(ax.dtick) < 12 : ax.dtick < ONEMINYEAR)
                ) ax.dtick = 'M12';
            }
        }
    }

    isMDate = mDate();
    if(isMDate && ax.tick0 === ax._dowTick0) {
        // discard Sunday/Monday tweaks
        ax.tick0 = ax._rawTick0;
    }

    ax._definedDelta = definedDelta;
}

function positionPeriodTicks(tickVals, ax, definedDelta) {
    for(var i = 0; i < tickVals.length; i++) {
        var v = tickVals[i].value;

        var a = i;
        var b = i + 1;
        if(i < tickVals.length - 1) {
            a = i;
            b = i + 1;
        } else if(i > 0) {
            a = i - 1;
            b = i;
        } else {
            a = i;
            b = i;
        }

        var A = tickVals[a].value;
        var B = tickVals[b].value;
        var actualDelta = Math.abs(B - A);
        var delta = definedDelta || actualDelta;
        var periodLength = 0;

        if(delta >= ONEMINYEAR) {
            if(actualDelta >= ONEMINYEAR && actualDelta <= ONEMAXYEAR) {
                periodLength = actualDelta;
            } else {
                periodLength = ONEAVGYEAR;
            }
        } else if(definedDelta === ONEAVGQUARTER && delta >= ONEMINQUARTER) {
            if(actualDelta >= ONEMINQUARTER && actualDelta <= ONEMAXQUARTER) {
                periodLength = actualDelta;
            } else {
                periodLength = ONEAVGQUARTER;
            }
        } else if(delta >= ONEMINMONTH) {
            if(actualDelta >= ONEMINMONTH && actualDelta <= ONEMAXMONTH) {
                periodLength = actualDelta;
            } else {
                periodLength = ONEAVGMONTH;
            }
        } else if(definedDelta === ONEWEEK && delta >= ONEWEEK) {
            periodLength = ONEWEEK;
        } else if(delta >= ONEDAY) {
            periodLength = ONEDAY;
        } else if(definedDelta === HALFDAY && delta >= HALFDAY) {
            periodLength = HALFDAY;
        } else if(definedDelta === ONEHOUR && delta >= ONEHOUR) {
            periodLength = ONEHOUR;
        }

        var inBetween;
        if(periodLength >= actualDelta) {
            // ensure new label positions remain between ticks
            periodLength = actualDelta;
            inBetween = true;
        }

        var endPeriod = v + periodLength;
        if(ax.rangebreaks && periodLength > 0) {
            var nAll = 84; // highly divisible 7 * 12
            var n = 0;
            for(var c = 0; c < nAll; c++) {
                var r = (c + 0.5) / nAll;
                if(ax.maskBreaks(v * (1 - r) + r * endPeriod) !== BADNUM) n++;
            }
            periodLength *= n / nAll;

            if(!periodLength) {
                tickVals[i].drop = true;
            }

            if(inBetween && actualDelta > ONEWEEK) periodLength = actualDelta; // center monthly & longer periods
        }

        if(
            periodLength > 0 || // not instant
            i === 0 // taking care first tick added
        ) {
            tickVals[i].periodX = v + periodLength / 2;
        }
    }
}

// calculate the ticks: text, values, positioning
// if ticks are set to automatic, determine the right values (tick0,dtick)
// in any case, set tickround to # of digits to round tick labels to,
// or codes to this effect for log and date scales
axes.calcTicks = function calcTicks(ax, opts) {
    var type = ax.type;
    var calendar = ax.calendar;
    var ticklabelstep = ax.ticklabelstep;
    var isPeriod = ax.ticklabelmode === 'period';
    var isReversed = ax.range[0] > ax.range[1];
    var ticklabelIndex = (!ax.ticklabelindex || Lib.isArrayOrTypedArray(ax.ticklabelindex)) ?
        ax.ticklabelindex : [ax.ticklabelindex];
    var rng = Lib.simpleMap(ax.range, ax.r2l, undefined, undefined, opts);
    var axrev = (rng[1] < rng[0]);
    var minRange = Math.min(rng[0], rng[1]);
    var maxRange = Math.max(rng[0], rng[1]);

    var maxTicks = Math.max(1000, ax._length || 0);

    var ticksOut = [];
    var minorTicks = [];

    var tickVals = [];
    var minorTickVals = [];
    // all ticks for which labels are drawn which is not necessarily the major ticks when
    // `ticklabelindex` is set.
    var allTicklabelVals = [];

    var hasMinor = ax.minor && (ax.minor.ticks || ax.minor.showgrid);

    // calc major first
    for(var major = 1; major >= (hasMinor ? 0 : 1); major--) {
        var isMinor = !major;

        if(major) {
            ax._dtickInit = ax.dtick;
            ax._tick0Init = ax.tick0;
        } else {
            ax.minor._dtickInit = ax.minor.dtick;
            ax.minor._tick0Init = ax.minor.tick0;
        }

        var mockAx = major ? ax : Lib.extendFlat({}, ax, ax.minor);

        if(isMinor) {
            axes.prepMinorTicks(mockAx, ax, opts);
        } else {
            axes.prepTicks(mockAx, opts);
        }

        // now that we've figured out the auto values for formatting
        // in case we're missing some ticktext, we can break out for array ticks
        if(mockAx.tickmode === 'array') {
            if(major) {
                tickVals = [];
                ticksOut = arrayTicks(ax, !isMinor);
            } else {
                minorTickVals = [];
                minorTicks = arrayTicks(ax, !isMinor);
            }
            continue;
        }

        // fill tickVals based on overlaying axis
        if(mockAx.tickmode === 'sync') {
            tickVals = [];
            ticksOut = syncTicks(ax);
            continue;
        }

        // add a tiny bit so we get ticks which may have rounded out
        var exRng = expandRange(rng);
        var startTick = exRng[0];
        var endTick = exRng[1];

        var numDtick = isNumeric(mockAx.dtick);
        var isDLog = (type === 'log') && !(numDtick || mockAx.dtick.charAt(0) === 'L');

        // find the first tick
        var x0 = axes.tickFirst(mockAx, opts);

        if(major) {
            ax._tmin = x0;

            // No visible ticks? Quit.
            // I've only seen this on category axes with all categories off the edge.
            if((x0 < startTick) !== axrev) break;

            // return the full set of tick vals
            if(type === 'category' || type === 'multicategory') {
                endTick = (axrev) ? Math.max(-0.5, endTick) :
                    Math.min(ax._categories.length - 0.5, endTick);
            }
        }

        var prevX = null;
        var x = x0;
        var majorId;

        if(major) {
            // ids for ticklabelstep
            var _dTick;
            if(numDtick) {
                _dTick = ax.dtick;
            } else {
                if(type === 'date') {
                    if(typeof ax.dtick === 'string' && ax.dtick.charAt(0) === 'M') {
                        _dTick = ONEAVGMONTH * ax.dtick.substring(1);
                    }
                } else {
                    _dTick = ax._roughDTick;
                }
            }

            majorId = Math.round((
                ax.r2l(x) -
                ax.r2l(ax.tick0)
            ) / _dTick) - 1;
        }

        var dtick = mockAx.dtick;

        if(mockAx.rangebreaks && mockAx._tick0Init !== mockAx.tick0) {
            // adjust tick0
            x = moveOutsideBreak(x, ax);
            if(!axrev) {
                x = axes.tickIncrement(x, dtick, !axrev, calendar);
            }
        }

        if(major && isPeriod) {
            // add one item to label period before tick0
            x = axes.tickIncrement(x, dtick, !axrev, calendar);
            majorId--;
        }

        for(;
            axrev ?
                (x >= endTick) :
                (x <= endTick);
            x = axes.tickIncrement(
                x,
                dtick,
                axrev,
                calendar
            )
        ) {
            if(major) majorId++;

            if(mockAx.rangebreaks) {
                if(!axrev) {
                    if(x < startTick) continue;
                    if(mockAx.maskBreaks(x) === BADNUM && moveOutsideBreak(x, mockAx) >= maxRange) break;
                }
            }

            // prevent infinite loops - no more than one tick per pixel,
            // and make sure each value is different from the previous
            if(tickVals.length > maxTicks || x === prevX) break;
            prevX = x;

            var obj = { value: x };

            if(major) {
                if(isDLog && (x !== (x | 0))) {
                    obj.simpleLabel = true;
                }

                if(ticklabelstep > 1 && majorId % ticklabelstep) {
                    obj.skipLabel = true;
                }

                tickVals.push(obj);
            } else {
                obj.minor = true;

                minorTickVals.push(obj);
            }
        }
    }

    // check if ticklabelIndex makes sense, otherwise ignore it
    if(!minorTickVals || minorTickVals.length < 2) {
        ticklabelIndex = false;
    } else {
        var diff = (minorTickVals[1].value - minorTickVals[0].value) * (isReversed ? -1 : 1);
        if(!periodCompatibleWithTickformat(diff, ax.tickformat)) {
            ticklabelIndex = false;
        }
    }
    // Determine for which ticks to draw labels
    if(!ticklabelIndex) {
        allTicklabelVals = tickVals;
    } else {
        // Collect and sort all major and minor ticks, to find the minor ticks `ticklabelIndex`
        // steps away from each major tick. For those minor ticks we want to draw the label.

        var allTickVals = tickVals.concat(minorTickVals);
        if(isPeriod && tickVals.length) {
            // first major tick was just added for period handling
            allTickVals = allTickVals.slice(1);
        }

        allTickVals =
            allTickVals
            .sort(function(a, b) { return a.value - b.value; })
            .filter(function(tick, index, self) {
                return index === 0 || tick.value !== self[index - 1].value;
            });

        var majorTickIndices =
            allTickVals
            .map(function(item, index) {
                return item.minor === undefined && !item.skipLabel ? index : null;
            })
            .filter(function(index) { return index !== null; });

        majorTickIndices.forEach(function(majorIdx) {
            ticklabelIndex.map(function(nextLabelIdx) {
                var minorIdx = majorIdx + nextLabelIdx;
                if(minorIdx >= 0 && minorIdx < allTickVals.length) {
                    Lib.pushUnique(allTicklabelVals, allTickVals[minorIdx]);
                }
            });
        });
    }

    if(hasMinor) {
        var canOverlap =
            (ax.minor.ticks === 'inside' && ax.ticks === 'outside') ||
            (ax.minor.ticks === 'outside' && ax.ticks === 'inside');

        if(!canOverlap) {
            // remove duplicate minors

            var majorValues = tickVals.map(function(d) { return d.value; });

            var list = [];
            for(var k = 0; k < minorTickVals.length; k++) {
                var T = minorTickVals[k];
                var v = T.value;
                if(majorValues.indexOf(v) !== -1) {
                    continue;
                }
                var found = false;
                for(var q = 0; !found && (q < tickVals.length); q++) {
                    if(
                        // add 10e6 to eliminate problematic digits
                        10e6 + tickVals[q].value ===
                        10e6 + v
                    ) {
                        found = true;
                    }
                }
                if(!found) list.push(T);
            }
            minorTickVals = list;
        }
    }

    if(isPeriod) positionPeriodTicks(allTicklabelVals, ax, ax._definedDelta);

    var i;
    if(ax.rangebreaks) {
        var flip = ax._id.charAt(0) === 'y';

        var fontSize = 1; // one pixel minimum
        if(ax.tickmode === 'auto') {
            fontSize = ax.tickfont ? ax.tickfont.size : 12;
        }

        var prevL = NaN;
        for(i = tickVals.length - 1; i > -1; i--) {
            if(tickVals[i].drop) {
                tickVals.splice(i, 1);
                continue;
            }

            tickVals[i].value = moveOutsideBreak(tickVals[i].value, ax);

            // avoid overlaps
            var l = ax.c2p(tickVals[i].value);
            if(flip ?
                (prevL > l - fontSize) :
                (prevL < l + fontSize)
            ) { // ensure one pixel minimum
                tickVals.splice(axrev ? i + 1 : i, 1);
            } else {
                prevL = l;
            }
        }
    }

    // If same angle over a full circle, the last tick vals is a duplicate.
    // TODO must do something similar for angular date axes.
    if(isAngular(ax) && Math.abs(rng[1] - rng[0]) === 360) {
        tickVals.pop();
    }

    // save the last tick as well as first, so we can
    // show the exponent only on the last one
    ax._tmax = (tickVals[tickVals.length - 1] || {}).value;

    // for showing the rest of a date when the main tick label is only the
    // latter part: ax._prevDateHead holds what we showed most recently.
    // Start with it cleared and mark that we're in calcTicks (ie calculating a
    // whole string of these so we should care what the previous date head was!)
    ax._prevDateHead = '';
    ax._inCalcTicks = true;

    var lastVisibleHead;
    var hideLabel = function(tick) {
        tick.text = '';
        ax._prevDateHead = lastVisibleHead;
    };

    tickVals = tickVals.concat(minorTickVals);

    function setTickLabel(ax, tickVal) {
        var text = axes.tickText(
            ax,
            tickVal.value,
            false, // hover
            tickVal.simpleLabel // noSuffixPrefix
        );
        var p = tickVal.periodX;
        if(p !== undefined) {
            text.periodX = p;
            if(p > maxRange || p < minRange) { // hide label if outside the range
                if(p > maxRange) text.periodX = maxRange;
                if(p < minRange) text.periodX = minRange;

                hideLabel(text);
            }
        }
        return text;
    }

    var t;
    for(i = 0; i < tickVals.length; i++) {
        var _minor = tickVals[i].minor;
        var _value = tickVals[i].value;

        if(_minor) {
            if(ticklabelIndex && allTicklabelVals.indexOf(tickVals[i]) !== -1) {
                t = setTickLabel(ax, tickVals[i]);
            } else {
                t = { x: _value };
            }
            t.minor = true;
            minorTicks.push(t);
        } else {
            lastVisibleHead = ax._prevDateHead;
            t = setTickLabel(ax, tickVals[i]);
            if(tickVals[i].skipLabel ||
                ticklabelIndex && allTicklabelVals.indexOf(tickVals[i]) === -1) {
                hideLabel(t);
            }

            ticksOut.push(t);
        }
    }
    ticksOut = ticksOut.concat(minorTicks);

    ax._inCalcTicks = false;

    if(isPeriod && ticksOut.length) {
        // drop very first tick that we added to handle period
        ticksOut[0].noTick = true;
    }

    return ticksOut;
};

function filterRangeBreaks(ax, ticksOut) {
    if(ax.rangebreaks) {
        // remove ticks falling inside rangebreaks
        ticksOut = ticksOut.filter(function(d) {
            return ax.maskBreaks(d.x) !== BADNUM;
        });
    }

    return ticksOut;
}

function syncTicks(ax) {
    // get the overlaying axis
    var baseAxis = ax._mainAxis;

    var ticksOut = [];
    if(baseAxis._vals) {
        for(var i = 0; i < baseAxis._vals.length; i++) {
            // filter vals with noTick flag
            if(baseAxis._vals[i].noTick) {
                continue;
            }

            // get the position of the every tick
            var pos = baseAxis.l2p(baseAxis._vals[i].x);

            // get the tick for the current axis based on position
            var vali = ax.p2l(pos);
            var obj = axes.tickText(ax, vali);

            // assign minor ticks
            if(baseAxis._vals[i].minor) {
                obj.minor = true;
                obj.text = '';
            }

            ticksOut.push(obj);
        }
    }

    ticksOut = filterRangeBreaks(ax, ticksOut);

    return ticksOut;
}

function arrayTicks(ax, majorOnly) {
    var rng = Lib.simpleMap(ax.range, ax.r2l);
    var exRng = expandRange(rng);
    var tickMin = Math.min(exRng[0], exRng[1]);
    var tickMax = Math.max(exRng[0], exRng[1]);

    // make sure showing ticks doesn't accidentally add new categories
    // TODO multicategory, if we allow ticktext / tickvals
    var tickVal2l = ax.type === 'category' ? ax.d2l_noadd : ax.d2l;

    // array ticks on log axes always show the full number
    // (if no explicit ticktext overrides it)
    if(ax.type === 'log' && String(ax.dtick).charAt(0) !== 'L') {
        ax.dtick = 'L' + Math.pow(10, Math.floor(Math.min(ax.range[0], ax.range[1])) - 1);
    }

    var ticksOut = [];
    for(var isMinor = 0; isMinor <= 1; isMinor++) {
        if((majorOnly !== undefined) && ((majorOnly && isMinor) || (majorOnly === false && !isMinor))) continue;
        if(isMinor && !ax.minor) continue;
        var vals = !isMinor ? ax.tickvals : ax.minor.tickvals;
        var text = !isMinor ? ax.ticktext : [];
        if(!vals) continue;


        // without a text array, just format the given values as any other ticks
        // except with more precision to the numbers
        if(!Lib.isArrayOrTypedArray(text)) text = [];

        for(var i = 0; i < vals.length; i++) {
            var vali = tickVal2l(vals[i]);
            if(vali > tickMin && vali < tickMax) {
                var obj = axes.tickText(ax, vali, false, String(text[i]));
                if(isMinor) {
                    obj.minor = true;
                    obj.text = '';
                }

                ticksOut.push(obj);
            }
        }
    }

    ticksOut = filterRangeBreaks(ax, ticksOut);

    return ticksOut;
}

var roundBase10 = [2, 5, 10];
var roundBase24 = [1, 2, 3, 6, 12];
var roundBase60 = [1, 2, 5, 10, 15, 30];
// 2&3 day ticks are weird, but need something btwn 1&7
var roundDays = [1, 2, 3, 7, 14];
// approx. tick positions for log axes, showing all (1) and just 1, 2, 5 (2)
// these don't have to be exact, just close enough to round to the right value
var roundLog1 = [-0.046, 0, 0.301, 0.477, 0.602, 0.699, 0.778, 0.845, 0.903, 0.954, 1];
var roundLog2 = [-0.301, 0, 0.301, 0.699, 1];
// N.B. `thetaunit; 'radians' angular axes must be converted to degrees
var roundAngles = [15, 30, 45, 90, 180];

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
axes.autoTicks = function(ax, roughDTick, isMinor) {
    var base;

    function getBase(v) {
        return Math.pow(v, Math.floor(Math.log(roughDTick) / Math.LN10));
    }

    if(ax.type === 'date') {
        ax.tick0 = Lib.dateTick0(ax.calendar, 0);

        // the criteria below are all based on the rough spacing we calculate
        // being > half of the final unit - so precalculate twice the rough val
        var roughX2 = 2 * roughDTick;

        if(roughX2 > ONEAVGYEAR) {
            roughDTick /= ONEAVGYEAR;
            base = getBase(10);
            ax.dtick = 'M' + (12 * roundDTick(roughDTick, base, roundBase10));
        } else if(roughX2 > ONEAVGMONTH) {
            roughDTick /= ONEAVGMONTH;
            ax.dtick = 'M' + roundDTick(roughDTick, 1, roundBase24);
        } else if(roughX2 > ONEDAY) {
            ax.dtick = roundDTick(roughDTick, ONEDAY, ax._hasDayOfWeekBreaks ? [1, 2, 7, 14] : roundDays);
            if(!isMinor) {
                // get week ticks on sunday
                // this will also move the base tick off 2000-01-01 if dtick is
                // 2 or 3 days... but that's a weird enough case that we'll ignore it.
                var tickformat = axes.getTickFormat(ax);
                var isPeriod = ax.ticklabelmode === 'period';
                if(isPeriod) ax._rawTick0 = ax.tick0;

                if(/%[uVW]/.test(tickformat)) {
                    ax.tick0 = Lib.dateTick0(ax.calendar, 2); // Monday
                } else {
                    ax.tick0 = Lib.dateTick0(ax.calendar, 1); // Sunday
                }

                if(isPeriod) ax._dowTick0 = ax.tick0;
            }
        } else if(roughX2 > ONEHOUR) {
            ax.dtick = roundDTick(roughDTick, ONEHOUR, roundBase24);
        } else if(roughX2 > ONEMIN) {
            ax.dtick = roundDTick(roughDTick, ONEMIN, roundBase60);
        } else if(roughX2 > ONESEC) {
            ax.dtick = roundDTick(roughDTick, ONESEC, roundBase60);
        } else {
            // milliseconds
            base = getBase(10);
            ax.dtick = roundDTick(roughDTick, base, roundBase10);
        }
    } else if(ax.type === 'log') {
        ax.tick0 = 0;
        var rng = Lib.simpleMap(ax.range, ax.r2l);
        if(ax._isMinor) {
            // Log axes by default get MORE than nTicks based on the metrics below
            // But for minor ticks we don't want this increase, we already have
            // the major ticks.
            roughDTick *= 1.5;
        }
        if(roughDTick > 0.7) {
            // only show powers of 10
            ax.dtick = Math.ceil(roughDTick);
        } else if(Math.abs(rng[1] - rng[0]) < 1) {
            // span is less than one power of 10
            var nt = 1.5 * Math.abs((rng[1] - rng[0]) / roughDTick);

            // ticks on a linear scale, labeled fully
            roughDTick = Math.abs(Math.pow(10, rng[1]) -
                Math.pow(10, rng[0])) / nt;
            base = getBase(10);
            ax.dtick = 'L' + roundDTick(roughDTick, base, roundBase10);
        } else {
            // include intermediates between powers of 10,
            // labeled with small digits
            // ax.dtick = "D2" (show 2 and 5) or "D1" (show all digits)
            ax.dtick = (roughDTick > 0.3) ? 'D2' : 'D1';
        }
    } else if(ax.type === 'category' || ax.type === 'multicategory') {
        ax.tick0 = 0;
        ax.dtick = Math.ceil(Math.max(roughDTick, 1));
    } else if(isAngular(ax)) {
        ax.tick0 = 0;
        base = 1;
        ax.dtick = roundDTick(roughDTick, base, roundAngles);
    } else {
        // auto ticks always start at 0
        ax.tick0 = 0;
        base = getBase(10);
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

    if(ax.type === 'category' || ax.type === 'multicategory') {
        ax._tickround = null;
    }
    if(ax.type === 'date') {
        // If tick0 is unusual, give tickround a bit more information
        // not necessarily *all* the information in tick0 though, if it's really odd
        // minimal string length for tick0: 'd' is 10, 'M' is 16, 'S' is 19
        // take off a leading minus (year < 0) and i (intercalary month) so length is consistent
        var tick0ms = ax.r2l(ax.tick0);
        var tick0str = ax.l2r(tick0ms).replace(/(^-|i)/g, '');
        var tick0len = tick0str.length;

        if(String(dtick).charAt(0) === 'M') {
            // any tick0 more specific than a year: alway show the full date
            if(tick0len > 10 || tick0str.slice(5) !== '01-01') ax._tickround = 'd';
            // show the month unless ticks are full multiples of a year
            else ax._tickround = (+(dtick.slice(1)) % 12 === 0) ? 'y' : 'm';
        } else if((dtick >= ONEDAY && tick0len <= 10) || (dtick >= ONEDAY * 15)) ax._tickround = 'd';
        else if((dtick >= ONEMIN && tick0len <= 16) || (dtick >= ONEHOUR)) ax._tickround = 'M';
        else if((dtick >= ONESEC && tick0len <= 19) || (dtick >= ONEMIN)) ax._tickround = 'S';
        else {
            // tickround is a number of digits of fractional seconds
            // of any two adjacent ticks, at least one will have the maximum fractional digits
            // of all possible ticks - so take the max. length of tick0 and the next one
            var tick1len = ax.l2r(tick0ms + dtick).replace(/^-/, '').length;
            ax._tickround = Math.max(tick0len, tick1len) - 20;

            // We shouldn't get here... but in case there's a situation I'm
            // not thinking of where tick0str and tick1str are identical or
            // something, fall back on maximum precision
            if(ax._tickround < 0) ax._tickround = 4;
        }
    } else if(isNumeric(dtick) || dtick.charAt(0) === 'L') {
        // linear or log (except D1, D2)
        var rng = ax.range.map(ax.r2d || Number);
        if(!isNumeric(dtick)) dtick = Number(dtick.slice(1));
        // 2 digits past largest digit of dtick
        ax._tickround = 2 - Math.floor(Math.log(dtick) / Math.LN10 + 0.01);

        var maxend = Math.max(Math.abs(rng[0]), Math.abs(rng[1]));
        var rangeexp = Math.floor(Math.log(maxend) / Math.LN10 + 0.01);
        var minexponent = ax.minexponent === undefined ? 3 : ax.minexponent;
        if(Math.abs(rangeexp) > minexponent) {
            if((isSIFormat(ax.exponentformat) && ax.exponentformat !== 'SI extended' && !beyondSI(rangeexp)) || 
            (isSIFormat(ax.exponentformat) && ax.exponentformat === 'SI extended' && !beyondSIExtended(rangeexp))) {
                ax._tickexponent = 3 * Math.round((rangeexp - 1) / 3);
            } else ax._tickexponent = rangeexp;
        }
    } else {
        // D1 or D2 (log)
        ax._tickround = null;
    }
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
    if(isNumeric(dtick)) return Lib.increment(x, axSign * dtick);

    // everything else is a string, one character plus a number
    var tType = dtick.charAt(0);
    var dtSigned = axSign * Number(dtick.slice(1));

    // Dates: months (or years - see Lib.incrementMonth)
    if(tType === 'M') return Lib.incrementMonth(x, dtSigned, calendar);

    // Log scales: Linear, Digits
    if(tType === 'L') return Math.log(Math.pow(10, x) + dtSigned) / Math.LN10;

    // log10 of 2,5,10, or all digits (logs just have to be
    // close enough to round)
    if(tType === 'D') {
        var tickset = (dtick === 'D2') ? roundLog2 : roundLog1;
        var x2 = x + axSign * 0.01;
        var frac = Lib.roundUp(Lib.mod(x2, 1), tickset, axrev);

        return Math.floor(x2) +
            Math.log(d3.round(Math.pow(10, frac), 1)) / Math.LN10;
    }

    throw 'unrecognized dtick ' + String(dtick);
};

// calculate the first tick on an axis
axes.tickFirst = function(ax, opts) {
    var r2l = ax.r2l || Number;
    var rng = Lib.simpleMap(ax.range, r2l, undefined, undefined, opts);
    var axrev = rng[1] < rng[0];
    var sRound = axrev ? Math.floor : Math.ceil;
    // add a tiny extra bit to make sure we get ticks
    // that may have been rounded out
    var r0 = expandRange(rng)[0];
    var dtick = ax.dtick;
    var tick0 = r2l(ax.tick0);

    if(isNumeric(dtick)) {
        var tmin = sRound((r0 - tick0) / dtick) * dtick + tick0;

        // make sure no ticks outside the category list
        if(ax.type === 'category' || ax.type === 'multicategory') {
            tmin = Lib.constrain(tmin, 0, ax._categories.length - 1);
        }
        return tmin;
    }

    var tType = dtick.charAt(0);
    var dtNum = Number(dtick.slice(1));

    // Dates: months (or years)
    if(tType === 'M') {
        var cnt = 0;
        var t0 = tick0;
        var t1, mult, newDTick;

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
    } else if(tType === 'L') {
        // Log scales: Linear, Digits

        return Math.log(sRound(
            (Math.pow(10, r0) - tick0) / dtNum) * dtNum + tick0) / Math.LN10;
    } else if(tType === 'D') {
        var tickset = (dtick === 'D2') ? roundLog2 : roundLog1;
        var frac = Lib.roundUp(Lib.mod(r0, 1), tickset, axrev);

        return Math.floor(r0) +
            Math.log(d3.round(Math.pow(10, frac), 1)) / Math.LN10;
    } else throw 'unrecognized dtick ' + String(dtick);
};

// draw the text for one tick.
// px,py are the location on gd.paper
// prefix is there so the x axis ticks can be dropped a line
// ax is the axis layout, x is the tick value
// hover is a (truthy) flag for whether to show numbers with a bit
// more precision for hovertext
axes.tickText = function(ax, x, hover, noSuffixPrefix) {
    var out = tickTextObj(ax, x);
    var arrayMode = ax.tickmode === 'array';
    var extraPrecision = hover || arrayMode;
    var axType = ax.type;
    // TODO multicategory, if we allow ticktext / tickvals
    var tickVal2l = axType === 'category' ? ax.d2l_noadd : ax.d2l;
    var i;

    var inbounds = function(v) {
        var p = ax.l2p(v);
        return p >= 0 && p <= ax._length ? v : null;
    };
    if(arrayMode && Lib.isArrayOrTypedArray(ax.ticktext)) {
        var rng = Lib.simpleMap(ax.range, ax.r2l);
        var minDiff = (Math.abs(rng[1] - rng[0]) - (ax._lBreaks || 0)) / 10000;

        for(i = 0; i < ax.ticktext.length; i++) {
            if(Math.abs(x - tickVal2l(ax.tickvals[i])) < minDiff) break;
        }
        if(i < ax.ticktext.length) {
            out.text = String(ax.ticktext[i]);

            out.xbnd = [
                inbounds(out.x - 0.5),
                inbounds(out.x + ax.dtick - 0.5)
            ];
            return out;
        }
    }

    function isHidden(showAttr) {
        if(showAttr === undefined) return true;
        if(hover) return showAttr === 'none';

        var firstOrLast = {
            first: ax._tmin,
            last: ax._tmax
        }[showAttr];

        return showAttr !== 'all' && x !== firstOrLast;
    }

    var hideexp = hover ?
        'never' :
        ax.exponentformat !== 'none' && isHidden(ax.showexponent) ? 'hide' : '';

    if(axType === 'date') formatDate(ax, out, hover, extraPrecision);
    else if(axType === 'log') formatLog(ax, out, hover, extraPrecision, hideexp);
    else if(axType === 'category') formatCategory(ax, out);
    else if(axType === 'multicategory') formatMultiCategory(ax, out, hover);
    else if(isAngular(ax)) formatAngle(ax, out, hover, extraPrecision, hideexp);
    else formatLinear(ax, out, hover, extraPrecision, hideexp);

    // add prefix and suffix
    if(!noSuffixPrefix) {
        if(ax.tickprefix && !isHidden(ax.showtickprefix)) out.text = ax.tickprefix + out.text;
        if(ax.ticksuffix && !isHidden(ax.showticksuffix)) out.text += ax.ticksuffix;
    }

    if(ax.labelalias && ax.labelalias.hasOwnProperty(out.text)) {
        var t = ax.labelalias[out.text];
        if(typeof t === 'string') out.text = t;
    }

    // Setup ticks and grid lines boundaries
    // at 1/2 a 'category' to the left/bottom
    if(ax.tickson === 'boundaries' || ax.showdividers) {
        out.xbnd = [
            inbounds(out.x - 0.5),
            inbounds(out.x + ax.dtick - 0.5)
        ];
    }

    return out;
};

/**
 * create text for a hover label on this axis, with special handling of
 * log axes (where negative values can't be displayed but can appear in hover text)
 *
 * @param {object} ax: the axis to format text for
 * @param {number or array of numbers} values: calcdata value(s) to format
 * @param {Optional(string)} hoverformat: trace (x|y)hoverformat to override axis.hoverformat
 *
 * @returns {string} `val` formatted as a string appropriate to this axis, or
 *     first value and second value as a range (ie '<val1> - <val2>') if the second value is provided and
 *     it's different from the first value.
 */
axes.hoverLabelText = function(ax, values, hoverformat) {
    if(hoverformat) ax = Lib.extendFlat({}, ax, {hoverformat: hoverformat});

    var val = Lib.isArrayOrTypedArray(values) ? values[0] : values;
    var val2 = Lib.isArrayOrTypedArray(values) ? values[1] : undefined;
    if(val2 !== undefined && val2 !== val) {
        return (
            axes.hoverLabelText(ax, val, hoverformat) + ' - ' +
            axes.hoverLabelText(ax, val2, hoverformat)
        );
    }

    var logOffScale = (ax.type === 'log' && val <= 0);
    var tx = axes.tickText(ax, ax.c2l(logOffScale ? -val : val), 'hover').text;

    if(logOffScale) {
        return val === 0 ? '0' : MINUS_SIGN + tx;
    }

    // TODO: should we do something special if the axis calendar and
    // the data calendar are different? Somehow display both dates with
    // their system names? Right now it will just display in the axis calendar
    // but users could add the other one as text.
    return tx;
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
        fontWeight: tf.weight,
        fontStyle: tf.style,
        fontVariant: tf.variant,
        fontTextcase: tf.textcase,
        fontLineposition: tf.lineposition,
        fontShadow: tf.shadow,
        fontColor: tf.color
    };
}

function formatDate(ax, out, hover, extraPrecision) {
    var tr = ax._tickround;
    var fmt = (hover && ax.hoverformat) || axes.getTickFormat(ax);

    // Only apply extra precision if no explicit format was provided.
    extraPrecision = !fmt && extraPrecision;

    if(extraPrecision) {
        // second or sub-second precision: extra always shows max digits.
        // for other fields, extra precision just adds one field.
        if(isNumeric(tr)) tr = 4;
        else tr = {y: 'm', m: 'd', d: 'M', M: 'S', S: 4}[tr];
    }

    var dateStr = Lib.formatDate(out.x, fmt, tr, ax._dateFormat, ax.calendar, ax._extraFormat);
    var headStr;

    var splitIndex = dateStr.indexOf('\n');
    if(splitIndex !== -1) {
        headStr = dateStr.slice(splitIndex + 1);
        dateStr = dateStr.slice(0, splitIndex);
    }

    if(extraPrecision) {
        // if extraPrecision led to trailing zeros, strip them off
        // actually, this can lead to removing even more zeros than
        // in the original rounding, but that's fine because in these
        // contexts uniformity is not so important (if there's even
        // anything to be uniform with!)

        // can we remove the whole time part?
        if(headStr !== undefined && (dateStr === '00:00:00' || dateStr === '00:00')) {
            dateStr = headStr;
            headStr = '';
        } else if(dateStr.length === 8) {
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
        } else {
            if(
                !ax._inCalcTicks ||
                ax._prevDateHead !== headStr
            ) {
                ax._prevDateHead = headStr;
                dateStr += '<br>' + headStr;
            } else {
                var isInside = insideTicklabelposition(ax);
                var side = ax._trueSide || ax.side; // polar mocks the side of the radial axis
                if(
                    (!isInside && side === 'top') ||
                    (isInside && side === 'bottom')
                ) {
                    dateStr += '<br> ';
                }
            }
        }
    }

    out.text = dateStr;
}

function formatLog(ax, out, hover, extraPrecision, hideexp) {
    var dtick = ax.dtick;
    var x = out.x;
    var tickformat = ax.tickformat;
    var dtChar0 = typeof dtick === 'string' && dtick.charAt(0);

    if(hideexp === 'never') {
        // If this is a hover label, then we must *never* hide the exponent
        // for the sake of display, which could give the wrong value by
        // potentially many orders of magnitude. If hideexp was 'never', then
        // it's now succeeded by preventing the other condition from automating
        // this choice. Thus we can unset it so that the axis formatting takes
        // precedence.
        hideexp = '';
    }

    if(extraPrecision && (dtChar0 !== 'L')) {
        dtick = 'L3';
        dtChar0 = 'L';
    }

    if(tickformat || (dtChar0 === 'L')) {
        out.text = numFormat(Math.pow(10, x), ax, hideexp, extraPrecision);
    } else if(isNumeric(dtick) || ((dtChar0 === 'D') &&
        (ax.minorloglabels === 'complete' || Lib.mod(x + 0.01, 1) < 0.1))) {

        var isMinor;
        if(ax.minorloglabels === 'complete' && !(Lib.mod(x + 0.01, 1) < 0.1)) {
            isMinor = true;
            out.fontSize *= 0.75;
        }

        var exponentialString = Math.pow(10, x).toExponential(0);
        var parts = exponentialString.split('e');

        var p = +parts[1];
        var absP = Math.abs(p);
        var exponentFormat = ax.exponentformat;
        if(exponentFormat === 'power' || (isSIFormat(exponentFormat) && exponentFormat !== 'SI extended' && beyondSI(p)) ||
        (isSIFormat(exponentFormat) && exponentFormat === 'SI extended' && beyondSIExtended(p))) {
            out.text = parts[0];
            if(absP > 0) out.text += 'x10';
            if(out.text === '1x10') out.text = '10';
            if(p !== 0 && p !== 1) out.text += '<sup>' + (p > 0 ? '' : MINUS_SIGN) + absP + '</sup>';

            out.fontSize *= 1.25;
        } else if((exponentFormat === 'e' || exponentFormat === 'E') && absP > 2) {
            out.text = parts[0] + exponentFormat + (p > 0 ? '+' : MINUS_SIGN) + absP;
        } else {
            out.text = numFormat(Math.pow(10, x), ax, '', 'fakehover');
            if(dtick === 'D1' && ax._id.charAt(0) === 'y') {
                out.dy -= out.fontSize / 6;
            }
        }
    } else if(dtChar0 === 'D') {
        out.text =
            ax.minorloglabels === 'none' ? '' :
            /* ax.minorloglabels === 'small digits' */ String(Math.round(Math.pow(10, Lib.mod(x, 1))));

        out.fontSize *= 0.75;
    } else throw 'unrecognized dtick ' + String(dtick);

    // if 9's are printed on log scale, move the 10's away a bit
    if(ax.dtick === 'D1') {
        var firstChar = String(out.text).charAt(0);
        if(firstChar === '0' || firstChar === '1') {
            if(ax._id.charAt(0) === 'y') {
                out.dx -= out.fontSize / 4;
            } else {
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

function formatMultiCategory(ax, out, hover) {
    var v = Math.round(out.x);
    var cats = ax._categories[v] || [];
    var tt = cats[1] === undefined ? '' : String(cats[1]);
    var tt2 = cats[0] === undefined ? '' : String(cats[0]);

    if(hover) {
        // TODO is this what we want?
        out.text = tt2 + ' - ' + tt;
    } else {
        // setup for secondary labels
        out.text = tt;
        out.text2 = tt2;
    }
}

function formatLinear(ax, out, hover, extraPrecision, hideexp) {
    if(hideexp === 'never') {
        // If this is a hover label, then we must *never* hide the exponent
        // for the sake of display, which could give the wrong value by
        // potentially many orders of magnitude. If hideexp was 'never', then
        // it's now succeeded by preventing the other condition from automating
        // this choice. Thus we can unset it so that the axis formatting takes
        // precedence.
        hideexp = '';
    } else if(ax.showexponent === 'all' && Math.abs(out.x / ax.dtick) < 1e-6) {
        // don't add an exponent to zero if we're showing all exponents
        // so the only reason you'd show an exponent on zero is if it's the
        // ONLY tick to get an exponent (first or last)
        hideexp = 'hide';
    }
    out.text = numFormat(out.x, ax, hideexp, extraPrecision);
}

function formatAngle(ax, out, hover, extraPrecision, hideexp) {
    if(ax.thetaunit === 'radians' && !hover) {
        var num = out.x / 180;

        if(num === 0) {
            out.text = '0';
        } else {
            var frac = num2frac(num);

            if(frac[1] >= 100) {
                out.text = numFormat(Lib.deg2rad(out.x), ax, hideexp, extraPrecision);
            } else {
                var isNeg = out.x < 0;

                if(frac[1] === 1) {
                    if(frac[0] === 1) out.text = 'π';
                    else out.text = frac[0] + 'π';
                } else {
                    out.text = [
                        '<sup>', frac[0], '</sup>',
                        '⁄',
                        '<sub>', frac[1], '</sub>',
                        'π'
                    ].join('');
                }

                if(isNeg) out.text = MINUS_SIGN + out.text;
            }
        }
    } else {
        out.text = numFormat(out.x, ax, hideexp, extraPrecision);
    }
}

// inspired by
// https://github.com/yisibl/num2fraction/blob/master/index.js
function num2frac(num) {
    function almostEq(a, b) {
        return Math.abs(a - b) <= 1e-6;
    }

    function findGCD(a, b) {
        return almostEq(b, 0) ? a : findGCD(b, a % b);
    }

    function findPrecision(n) {
        var e = 1;
        while(!almostEq(Math.round(n * e) / e, n)) {
            e *= 10;
        }
        return e;
    }

    var precision = findPrecision(num);
    var number = num * precision;
    var gcd = Math.abs(findGCD(number, precision));

    return [
        // numerator
        Math.round(number / gcd),
        // denominator
        Math.round(precision / gcd)
    ];
}

// format a number (tick value) according to the axis settings
// new, more reliable procedure than d3.round or similar:
// add half the rounding increment, then stringify and truncate
// also automatically switch to sci. notation
var SIPREFIXES = ['f', 'p', 'n', 'μ', 'm', '', 'k', 'M', 'G', 'T'];

// extending SI prefixes
var SIPREFIXES_EXTENDED = ['q', 'r', 'y', 'z', 'a', ...SIPREFIXES, 'P', 'E', 'Z', 'Y', 'R', 'Q'];

const isSIFormat = (exponentFormat) => ['SI', 'SI extended','B'].includes(exponentFormat);

// are we beyond the range of common SI prefixes?
// 10^-16 -> 1x10^-16
// 10^-15 -> 1f
// ...
// 10^14 -> 100T
// 10^15 -> 1x10^15
// 10^16 -> 1x10^16
function beyondSI(exponent) {
    return exponent > 14 || exponent < -15;
}


// are we beyond the range of all SI prefixes?
// 10^-31 -> 1x10^-31
// 10^-30 -> 1q
// 10^-29 -> 10q
// ...
// 10^31 -> 10Q
// 10^32 -> 100Q
// 10^33 -> 1x10^33
function beyondSIExtended(exponent) {
    return exponent > 32 || exponent < -30;
}

function shouldSwitchSIToPowerFormat(exponent, exponentFormat) {
    if (!isSIFormat(exponentFormat)) return false;
    if (exponentFormat === 'SI extended' && beyondSIExtended(exponent)) return true;
    if (exponentFormat !== 'SI extended' && beyondSI(exponent)) return true;
    return false;
}

function numFormat(v, ax, fmtoverride, hover) {
    var isNeg = v < 0;
    // max number of digits past decimal point to show
    var tickRound = ax._tickround;
    var exponentFormat = fmtoverride || ax.exponentformat || 'B';
    var exponent = ax._tickexponent;
    var tickformat = axes.getTickFormat(ax);
    var separatethousands = ax.separatethousands;

    // special case for hover: set exponent just for this value, and
    // add a couple more digits of precision over tick labels
    if(hover) {
        // make a dummy axis obj to get the auto rounding and exponent
        var ah = {
            exponentformat: exponentFormat,
            minexponent: ax.minexponent,
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

    if(tickformat) return ax._numFormat(tickformat)(v).replace(/-/g, MINUS_SIGN);

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
    } else {
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
            v = v.slice(0, Math.max(0, v.length + tickRound));
            for(var i = tickRound; i < 0; i++) v += '0';
        } else {
            v = String(v);
            var dp = v.indexOf('.') + 1;
            if(dp) v = v.slice(0, dp + tickRound).replace(/\.?0+$/, '');
        }
        // insert appropriate decimal point and thousands separator
        v = Lib.numSeparate(v, ax._separators, separatethousands);
    }

    // add exponent
    if(exponent && exponentFormat !== 'hide') {
        if (shouldSwitchSIToPowerFormat(exponent, exponentFormat)) exponentFormat = 'power';

        var signedExponent;
        if(exponent < 0) signedExponent = MINUS_SIGN + -exponent;
        else if(exponentFormat !== 'power') signedExponent = '+' + exponent;
        else signedExponent = String(exponent);

        if(exponentFormat === 'e' || exponentFormat === 'E') {
            v += exponentFormat + signedExponent;
        } else if(exponentFormat === 'power') {
            v += '×10<sup>' + signedExponent + '</sup>';
        } else if(exponentFormat === 'B' && exponent === 9) {
            v += 'B';
        } else if(isSIFormat(exponentFormat)) {
            v += exponentFormat === 'SI extended' 
                ? SIPREFIXES_EXTENDED[exponent / 3 + 10] 
                : SIPREFIXES[exponent / 3 + 5];
        }
    }

    // put sign back in and return
    // replace standard minus character (which is technically a hyphen)
    // with a true minus sign
    if(isNeg) return MINUS_SIGN + v;
    return v;
}

axes.getTickFormat = function(ax) {
    var i;

    function convertToMs(dtick) {
        return typeof dtick !== 'string' ? dtick : Number(dtick.replace('M', '')) * ONEAVGMONTH;
    }

    function compareLogTicks(left, right) {
        var priority = ['L', 'D'];
        if(typeof left === typeof right) {
            if(typeof left === 'number') {
                return left - right;
            } else {
                var leftPriority = priority.indexOf(left.charAt(0));
                var rightPriority = priority.indexOf(right.charAt(0));
                if(leftPriority === rightPriority) {
                    return Number(left.replace(/(L|D)/g, '')) - Number(right.replace(/(L|D)/g, ''));
                } else {
                    return leftPriority - rightPriority;
                }
            }
        } else {
            return typeof left === 'number' ? 1 : -1;
        }
    }

    function isProperStop(dtick, range, convert) {
        var convertFn = convert || function(x) { return x;};
        var leftDtick = range[0];
        var rightDtick = range[1];
        return ((!leftDtick && typeof leftDtick !== 'number') || convertFn(leftDtick) <= convertFn(dtick)) &&
               ((!rightDtick && typeof rightDtick !== 'number') || convertFn(rightDtick) >= convertFn(dtick));
    }

    function isProperLogStop(dtick, range) {
        var isLeftDtickNull = range[0] === null;
        var isRightDtickNull = range[1] === null;
        var isDtickInRangeLeft = compareLogTicks(dtick, range[0]) >= 0;
        var isDtickInRangeRight = compareLogTicks(dtick, range[1]) <= 0;
        return (isLeftDtickNull || isDtickInRangeLeft) && (isRightDtickNull || isDtickInRangeRight);
    }

    var tickstop, stopi;
    if(ax.tickformatstops && ax.tickformatstops.length > 0) {
        switch(ax.type) {
            case 'date':
            case 'linear': {
                for(i = 0; i < ax.tickformatstops.length; i++) {
                    stopi = ax.tickformatstops[i];
                    if(stopi.enabled && isProperStop(ax.dtick, stopi.dtickrange, convertToMs)) {
                        tickstop = stopi;
                        break;
                    }
                }
                break;
            }
            case 'log': {
                for(i = 0; i < ax.tickformatstops.length; i++) {
                    stopi = ax.tickformatstops[i];
                    if(stopi.enabled && isProperLogStop(ax.dtick, stopi.dtickrange)) {
                        tickstop = stopi;
                        break;
                    }
                }
                break;
            }
            default:
        }
    }
    return tickstop ? tickstop.value : ax.tickformat;
};

// getSubplots - extract all subplot IDs we need
// as an array of items like 'xy', 'x2y', 'x2y2'...
// sorted by x (x,x2,x3...) then y
// optionally restrict to only subplots containing axis object ax
//
// NOTE: this is currently only used OUTSIDE plotly.js (toolpanel, webapp)
// ideally we get rid of it there (or just copy this there) and remove it here
axes.getSubplots = function(gd, ax) {
    var subplotObj = gd._fullLayout._subplots;
    var allSubplots = subplotObj.cartesian.concat(subplotObj.gl2d || []);

    var out = ax ? axes.findSubplotsWithAxis(allSubplots, ax) : allSubplots;

    out.sort(function(a, b) {
        var aParts = a.slice(1).split('y');
        var bParts = b.slice(1).split('y');

        if(aParts[0] === bParts[0]) return +aParts[1] - +bParts[1];
        return +aParts[0] - +bParts[0];
    });

    return out;
};

// find all subplots with axis 'ax'
// NOTE: this is only used in axes.getSubplots (only used outside plotly.js) and
// gl2d/convert (where it restricts axis subplots to only those with gl2d)
axes.findSubplotsWithAxis = function(subplots, ax) {
    var axMatch = new RegExp(
        (ax._id.charAt(0) === 'x') ? ('^' + ax._id + 'y') : (ax._id + '$')
    );
    var subplotsWithAx = [];

    for(var i = 0; i < subplots.length; i++) {
        var sp = subplots[i];
        if(axMatch.test(sp)) subplotsWithAx.push(sp);
    }

    return subplotsWithAx;
};

// makeClipPaths: prepare clipPaths for all single axes and all possible xy pairings
axes.makeClipPaths = function(gd) {
    var fullLayout = gd._fullLayout;

    // for more info: https://github.com/plotly/plotly.js/issues/2595
    if(fullLayout._hasOnlyLargeSploms) return;

    var fullWidth = {_offset: 0, _length: fullLayout.width, _id: ''};
    var fullHeight = {_offset: 0, _length: fullLayout.height, _id: ''};
    var xaList = axes.list(gd, 'x', true);
    var yaList = axes.list(gd, 'y', true);
    var clipList = [];
    var i, j;

    for(i = 0; i < xaList.length; i++) {
        clipList.push({x: xaList[i], y: fullHeight});
        for(j = 0; j < yaList.length; j++) {
            if(i === 0) clipList.push({x: fullWidth, y: yaList[j]});
            clipList.push({x: xaList[i], y: yaList[j]});
        }
    }

    // selectors don't work right with camelCase tags,
    // have to use class instead
    // https://groups.google.com/forum/#!topic/d3-js/6EpAzQ2gU9I
    var axClips = fullLayout._clips.selectAll('.axesclip')
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

/**
 * Main multi-axis drawing routine!
 *
 * @param {DOM element} gd : graph div
 * @param {string or array of strings} arg : polymorphic argument
 * @param {object} opts:
 * - @param {boolean} skipTitle : optional flag to skip axis title draw/update
 *
 * Signature 1: Axes.draw(gd, 'redraw')
 *   use this to clear and redraw all axes on graph
 *
 * Signature 2: Axes.draw(gd, '')
 *   use this to draw all axes on graph w/o the selectAll().remove()
 *   of the 'redraw' signature
 *
 * Signature 3: Axes.draw(gd, [axId, axId2, ...])
 *   where the items are axis id string,
 *   use this to update multiple axes in one call
 *
 * N.B draw updates:
 * - ax._r (stored range for use by zoom/pan)
 * - ax._rl (stored linearized range for use by zoom/pan)
 */
axes.draw = function(gd, arg, opts) {
    var fullLayout = gd._fullLayout;

    if(arg === 'redraw') {
        fullLayout._paper.selectAll('g.subplot').each(function(d) {
            var id = d[0];
            var plotinfo = fullLayout._plots[id];
            if(plotinfo) {
                var xa = plotinfo.xaxis;
                var ya = plotinfo.yaxis;

                plotinfo.xaxislayer.selectAll('.' + xa._id + 'tick').remove();
                plotinfo.yaxislayer.selectAll('.' + ya._id + 'tick').remove();
                plotinfo.xaxislayer.selectAll('.' + xa._id + 'tick2').remove();
                plotinfo.yaxislayer.selectAll('.' + ya._id + 'tick2').remove();
                plotinfo.xaxislayer.selectAll('.' + xa._id + 'divider').remove();
                plotinfo.yaxislayer.selectAll('.' + ya._id + 'divider').remove();

                if(plotinfo.minorGridlayer) plotinfo.minorGridlayer.selectAll('path').remove();
                if(plotinfo.gridlayer) plotinfo.gridlayer.selectAll('path').remove();
                if(plotinfo.zerolinelayer) plotinfo.zerolinelayer.selectAll('path').remove();
                if(plotinfo.zerolinelayerAbove) plotinfo.zerolinelayerAbove.selectAll('path').remove();

                fullLayout._infolayer.select('.g-' + xa._id + 'title').remove();
                fullLayout._infolayer.select('.g-' + ya._id + 'title').remove();
            }
        });
    }

    var axList = (!arg || arg === 'redraw') ? axes.listIds(gd) : arg;

    var fullAxList = axes.list(gd);
    // Get the list of the overlaying axis for all 'shift' axes
    var overlayingShiftedAx = fullAxList.filter(function(ax) {
        return ax.autoshift;
    }).map(function(ax) {
        return ax.overlaying;
    });

    // order axes that have dependency to other axes
    axList.map(function(axId) {
        var ax = axes.getFromId(gd, axId);

        if(ax.tickmode === 'sync' && ax.overlaying) {
            var overlayingIndex = axList.findIndex(function(axis) {return axis === ax.overlaying;});

            if(overlayingIndex >= 0) {
                axList.unshift(axList.splice(overlayingIndex, 1).shift());
            }
        }
    });

    var axShifts = {false: {left: 0, right: 0}};

    return Lib.syncOrAsync(axList.map(function(axId) {
        return function() {
            if(!axId) return;

            var ax = axes.getFromId(gd, axId);

            if(!opts) opts = {};
            opts.axShifts = axShifts;
            opts.overlayingShiftedAx = overlayingShiftedAx;

            var axDone = axes.drawOne(gd, ax, opts);

            if(ax._shiftPusher) {
                incrementShift(ax, ax._fullDepth || 0, axShifts, true);
            }
            ax._r = ax.range.slice();
            ax._rl = Lib.simpleMap(ax._r, ax.r2l);

            return axDone;
        };
    }));
};

/**
 * Draw one cartesian axis
 *
 * @param {DOM element} gd
 * @param {object} ax (full) axis object
 * @param {object} opts
 * - @param {boolean} skipTitle (set to true to skip axis title draw call)
 *
 * Depends on:
 * - ax._mainSubplot (from linkSubplots)
 * - ax._mainAxis
 * - ax._anchorAxis
 * - ax._subplotsWith
 * - ax._counterDomainMin, ax._counterDomainMax (optionally, from linkSubplots)
 * - ax._tickAngles (on redraw only, old value relinked during supplyDefaults)
 * - ax._mainLinePosition (from lsInner)
 * - ax._mainMirrorPosition
 * - ax._linepositions
 *
 * Fills in:
 * - ax._vals:
 * - ax._gridVals:
 * - ax._selections:
 * - ax._tickAngles:
 * - ax._depth (when required only):
 * - and calls ax.setScale
 */
axes.drawOne = function(gd, ax, opts) {
    opts = opts || {};

    var axShifts = opts.axShifts || {};
    var overlayingShiftedAx = opts.overlayingShiftedAx || [];

    var i, sp, plotinfo;

    ax.setScale();

    var fullLayout = gd._fullLayout;
    var axId = ax._id;
    var axLetter = axId.charAt(0);
    var counterLetter = axes.counterLetter(axId);
    var mainPlotinfo = fullLayout._plots[ax._mainSubplot];
    var zerolineIsAbove = ax.zerolinelayer === 'above traces';

    // this happens when updating matched group with 'missing' axes
    if(!mainPlotinfo) return;

    ax._shiftPusher = ax.autoshift ||
        overlayingShiftedAx.indexOf(ax._id) !== -1 ||
        overlayingShiftedAx.indexOf(ax.overlaying) !== -1;
    // An axis is also shifted by 1/2 of its own linewidth and inside tick length if applicable
    // as well as its manually specified `shift` val if we're in the context of `autoshift`
    if(ax._shiftPusher & ax.anchor === 'free') {
        var selfPush = (ax.linewidth / 2 || 0);
        if(ax.ticks === 'inside') {
            selfPush += ax.ticklen;
        }
        incrementShift(ax, selfPush, axShifts, true);
        incrementShift(ax, (ax.shift || 0), axShifts, false);
    }

    // Somewhat inelegant way of making sure that the shift value is only updated when the
    // Axes.DrawOne() function is called from the right context. An issue when redrawing the
    // axis as result of using the dragbox, for example.
    if(opts.skipTitle !== true || ax._shift === undefined) ax._shift = setShiftVal(ax, axShifts);

    var mainAxLayer = mainPlotinfo[axLetter + 'axislayer'];
    var mainLinePosition = ax._mainLinePosition;
    var mainLinePositionShift = mainLinePosition += ax._shift;
    var mainMirrorPosition = ax._mainMirrorPosition;

    var vals = ax._vals = axes.calcTicks(ax);

    // Add a couple of axis properties that should cause us to recreate
    // elements. Used in d3 data function.
    var axInfo = [ax.mirror, mainLinePositionShift, mainMirrorPosition].join('_');
    for(i = 0; i < vals.length; i++) {
        vals[i].axInfo = axInfo;
    }

    // stash selections to avoid DOM queries e.g.
    // - stash tickLabels selection, so that drawTitle can use it to scoot title
    ax._selections = {};
    // stash tick angle (including the computed 'auto' values) per tick-label class
    // linkup 'previous' tick angles on redraws
    if(ax._tickAngles) ax._prevTickAngles = ax._tickAngles;
    ax._tickAngles = {};
    // measure [in px] between axis position and outward-most part of bounding box
    // (touching either the tick label or ticks)
    // depth can be expansive to compute, so we only do so when required
    ax._depth = null;

    // calcLabelLevelBbox can be expensive,
    // so make sure to not call it twice during the same Axes.drawOne call
    // by stashing label-level bounding boxes per tick-label class
    var llbboxes = {};
    function getLabelLevelBbox(suffix) {
        var cls = axId + (suffix || 'tick');
        if(!llbboxes[cls]) llbboxes[cls] = calcLabelLevelBbox(ax, cls, mainLinePositionShift);
        return llbboxes[cls];
    }

    if(!ax.visible) return;

    var transTickFn = axes.makeTransTickFn(ax);
    var transTickLabelFn = axes.makeTransTickLabelFn(ax);

    var tickVals;
    // We remove zero lines, grid lines, and inside ticks if they're within 1px of the end
    // The key case here is removing zero lines when the axis bound is zero
    var valsClipped;

    var insideTicks = ax.ticks === 'inside';
    var outsideTicks = ax.ticks === 'outside';

    if(ax.tickson === 'boundaries') {
        var boundaryVals = getBoundaryVals(ax, vals);
        valsClipped = axes.clipEnds(ax, boundaryVals);
        tickVals = insideTicks ? valsClipped : boundaryVals;
    } else {
        valsClipped = axes.clipEnds(ax, vals);
        tickVals = (insideTicks && ax.ticklabelmode !== 'period') ? valsClipped : vals;
    }

    var gridVals = ax._gridVals = valsClipped;
    var dividerVals = getDividerVals(ax, vals);

    if(!fullLayout._hasOnlyLargeSploms) {
        var subplotsWithAx = ax._subplotsWith;

        // keep track of which subplots (by main counter axis) we've already
        // drawn grids for, so we don't overdraw overlaying subplots
        var finishedGrids = {};

        for(i = 0; i < subplotsWithAx.length; i++) {
            sp = subplotsWithAx[i];
            plotinfo = fullLayout._plots[sp];

            var counterAxis = plotinfo[counterLetter + 'axis'];
            var mainCounterID = counterAxis._mainAxis._id;
            if(finishedGrids[mainCounterID]) continue;
            finishedGrids[mainCounterID] = 1;

            var gridPath = axLetter === 'x' ?
                'M0,' + counterAxis._offset + 'v' + counterAxis._length :
                'M' + counterAxis._offset + ',0h' + counterAxis._length;

            axes.drawGrid(gd, ax, {
                vals: gridVals,
                counterAxis: counterAxis,
                layer: plotinfo.gridlayer.select('.' + axId),
                minorLayer: plotinfo.minorGridlayer.select('.' + axId),
                path: gridPath,
                transFn: transTickFn
            });
            axes.drawZeroLine(gd, ax, {
                counterAxis: counterAxis,
                layer: zerolineIsAbove ? plotinfo.zerolinelayerAbove : plotinfo.zerolinelayer,
                path: gridPath,
                transFn: transTickFn
            });
        }
    }

    var tickPath;

    var majorTickSigns = axes.getTickSigns(ax);
    var minorTickSigns = axes.getTickSigns(ax, 'minor');

    if(ax.ticks || (ax.minor && ax.minor.ticks)) {
        var majorTickPath = axes.makeTickPath(ax, mainLinePositionShift, majorTickSigns[2]);
        var minorTickPath = axes.makeTickPath(ax, mainLinePositionShift, minorTickSigns[2], { minor: true });

        var mirrorMajorTickPath;
        var mirrorMinorTickPath;

        var fullMajorTickPath;
        var fullMinorTickPath;

        if(ax._anchorAxis && ax.mirror && ax.mirror !== true) {
            mirrorMajorTickPath = axes.makeTickPath(ax, mainMirrorPosition, majorTickSigns[3]);
            mirrorMinorTickPath = axes.makeTickPath(ax, mainMirrorPosition, minorTickSigns[3], { minor: true });

            fullMajorTickPath = majorTickPath + mirrorMajorTickPath;
            fullMinorTickPath = minorTickPath + mirrorMinorTickPath;
        } else {
            mirrorMajorTickPath = '';
            mirrorMinorTickPath = '';
            fullMajorTickPath = majorTickPath;
            fullMinorTickPath = minorTickPath;
        }

        if(ax.showdividers && outsideTicks && ax.tickson === 'boundaries') {
            var dividerLookup = {};
            for(i = 0; i < dividerVals.length; i++) {
                dividerLookup[dividerVals[i].x] = 1;
            }
            tickPath = function(d) {
                return dividerLookup[d.x] ? mirrorMajorTickPath : fullMajorTickPath;
            };
        } else {
            tickPath = function(d) {
                return d.minor ? fullMinorTickPath : fullMajorTickPath;
            };
        }
    }

    axes.drawTicks(gd, ax, {
        vals: tickVals,
        layer: mainAxLayer,
        path: tickPath,
        transFn: transTickFn
    });

    if(ax.mirror === 'allticks') {
        var tickSubplots = Object.keys(ax._linepositions || {});

        for(i = 0; i < tickSubplots.length; i++) {
            sp = tickSubplots[i];
            plotinfo = fullLayout._plots[sp];
            // [bottom or left, top or right], free and main are handled above
            var linepositions = ax._linepositions[sp] || [];

            var p0 = linepositions[0];
            var p1 = linepositions[1];
            var isMinor = linepositions[2];

            var spTickPath =
                axes.makeTickPath(ax, p0,
                    isMinor ? majorTickSigns[0] : minorTickSigns[0],
                    { minor: isMinor }
                ) +
                axes.makeTickPath(ax, p1,
                    isMinor ? majorTickSigns[1] : minorTickSigns[1],
                    { minor: isMinor }
                );

            axes.drawTicks(gd, ax, {
                vals: tickVals,
                layer: plotinfo[axLetter + 'axislayer'],
                path: spTickPath,
                transFn: transTickFn
            });
        }
    }

    var seq = [];

    // tick labels - for now just the main labels.
    // TODO: mirror labels, esp for subplots

    seq.push(function() {
        return axes.drawLabels(gd, ax, {
            vals: vals,
            layer: mainAxLayer,
            plotinfo: plotinfo,
            transFn: transTickLabelFn,
            labelFns: axes.makeLabelFns(ax, mainLinePositionShift)
        });
    });

    if(ax.type === 'multicategory') {
        var pad = {x: 2, y: 10}[axLetter];

        seq.push(function() {
            var bboxKey = {x: 'height', y: 'width'}[axLetter];
            var standoff = getLabelLevelBbox()[bboxKey] + pad +
                (ax._tickAngles[axId + 'tick'] ? ax.tickfont.size * LINE_SPACING : 0);

            return axes.drawLabels(gd, ax, {
                vals: getSecondaryLabelVals(ax, vals),
                layer: mainAxLayer,
                cls: axId + 'tick2',
                repositionOnUpdate: true,
                secondary: true,
                transFn: transTickFn,
                labelFns: axes.makeLabelFns(ax, mainLinePositionShift + standoff * majorTickSigns[4])
            });
        });

        seq.push(function() {
            ax._depth = majorTickSigns[4] * (getLabelLevelBbox('tick2')[ax.side] - mainLinePositionShift);

            return drawDividers(gd, ax, {
                vals: dividerVals,
                layer: mainAxLayer,
                path: axes.makeTickPath(ax, mainLinePositionShift, majorTickSigns[4], { len: ax._depth }),
                transFn: transTickFn
            });
        });
    } else if(ax.title.hasOwnProperty('standoff')) {
        seq.push(function() {
            ax._depth = majorTickSigns[4] * (getLabelLevelBbox()[ax.side] - mainLinePositionShift);
        });
    }

    var hasRangeSlider = Registry.getComponentMethod('rangeslider', 'isVisible')(ax);

    if(!opts.skipTitle &&
        !(hasRangeSlider && ax.side === 'bottom')
    ) {
        seq.push(function() { return drawTitle(gd, ax); });
    }

    seq.push(function() {
        var s = ax.side.charAt(0);
        var sMirror = OPPOSITE_SIDE[ax.side].charAt(0);
        var pos = axes.getPxPosition(gd, ax);
        var outsideTickLen = outsideTicks ? ax.ticklen : 0;
        var llbbox;

        var push;
        var mirrorPush;
        var rangeSliderPush;

        if(ax.automargin || hasRangeSlider || ax._shiftPusher) {
            if(ax.type === 'multicategory') {
                llbbox = getLabelLevelBbox('tick2');
            } else {
                llbbox = getLabelLevelBbox();
                if(axLetter === 'x' && s === 'b') {
                    ax._depth = Math.max(llbbox.width > 0 ? llbbox.bottom - pos : 0, outsideTickLen);
                }
            }
        }

        var axDepth = 0;
        var titleDepth = 0;
        if(ax._shiftPusher) {
            axDepth = Math.max(
                outsideTickLen,
                llbbox.height > 0 ? (s === 'l' ? pos - llbbox.left : llbbox.right - pos) : 0
            );
            if(ax.title.text !== fullLayout._dfltTitle[axLetter]) {
                titleDepth = (ax._titleStandoff || 0) + (ax._titleScoot || 0);
                if(s === 'l') {
                    titleDepth += approxTitleDepth(ax);
                }
            }

            ax._fullDepth = Math.max(axDepth, titleDepth);
        }

        if(ax.automargin) {
            push = {x: 0, y: 0, r: 0, l: 0, t: 0, b: 0};
            var domainIndices = [0, 1];
            var shift = typeof ax._shift === 'number' ? ax._shift : 0;
            if(axLetter === 'x') {
                if(s === 'b') {
                    push[s] = ax._depth;
                } else {
                    push[s] = ax._depth = Math.max(llbbox.width > 0 ? pos - llbbox.top : 0, outsideTickLen);
                    domainIndices.reverse();
                }

                if(llbbox.width > 0) {
                    var rExtra = llbbox.right - (ax._offset + ax._length);
                    if(rExtra > 0) {
                        push.xr = 1;
                        push.r = rExtra;
                    }
                    var lExtra = ax._offset - llbbox.left;
                    if(lExtra > 0) {
                        push.xl = 0;
                        push.l = lExtra;
                    }
                }
            } else {
                if(s === 'l') {
                    ax._depth = Math.max(llbbox.height > 0 ? pos - llbbox.left : 0, outsideTickLen);
                    push[s] = ax._depth - shift;
                } else {
                    ax._depth = Math.max(llbbox.height > 0 ? llbbox.right - pos : 0, outsideTickLen);
                    push[s] = ax._depth + shift;
                    domainIndices.reverse();
                }

                if(llbbox.height > 0) {
                    var bExtra = llbbox.bottom - (ax._offset + ax._length);
                    if(bExtra > 0) {
                        push.yb = 0;
                        push.b = bExtra;
                    }
                    var tExtra = ax._offset - llbbox.top;
                    if(tExtra > 0) {
                        push.yt = 1;
                        push.t = tExtra;
                    }
                }
            }

            push[counterLetter] = ax.anchor === 'free' ?
                ax.position :
                ax._anchorAxis.domain[domainIndices[0]];

            if(ax.title.text !== fullLayout._dfltTitle[axLetter]) {
                push[s] += approxTitleDepth(ax) + (ax.title.standoff || 0);
            }

            if(ax.mirror && ax.anchor !== 'free') {
                mirrorPush = {x: 0, y: 0, r: 0, l: 0, t: 0, b: 0};

                mirrorPush[sMirror] = ax.linewidth;
                if(ax.mirror && ax.mirror !== true) mirrorPush[sMirror] += outsideTickLen;

                if(ax.mirror === true || ax.mirror === 'ticks') {
                    mirrorPush[counterLetter] = ax._anchorAxis.domain[domainIndices[1]];
                } else if(ax.mirror === 'all' || ax.mirror === 'allticks') {
                    mirrorPush[counterLetter] = [ax._counterDomainMin, ax._counterDomainMax][domainIndices[1]];
                }
            }
        }
        if(hasRangeSlider) {
            rangeSliderPush = Registry.getComponentMethod('rangeslider', 'autoMarginOpts')(gd, ax);
        }

        if(typeof ax.automargin === 'string') {
            filterPush(push, ax.automargin);
            filterPush(mirrorPush, ax.automargin);
        }

        Plots.autoMargin(gd, axAutoMarginID(ax), push);
        Plots.autoMargin(gd, axMirrorAutoMarginID(ax), mirrorPush);
        Plots.autoMargin(gd, rangeSliderAutoMarginID(ax), rangeSliderPush);
    });

    return Lib.syncOrAsync(seq);
};

function filterPush(push, automargin) {
    if(!push) return;

    var keepMargin = Object.keys(MARGIN_MAPPING).reduce(function(data, nextKey) {
        if(automargin.indexOf(nextKey) !== -1) {
            MARGIN_MAPPING[nextKey].forEach(function(key) { data[key] = 1;});
        }
        return data;
    }, {});
    Object.keys(push).forEach(function(key) {
        if(!keepMargin[key]) {
            if(key.length === 1) push[key] = 0;
            else delete push[key];
        }
    });
}

function getBoundaryVals(ax, vals) {
    var out = [];
    var i;

    // boundaryVals are never used for labels;
    // no need to worry about the other tickTextObj keys
    var _push = function(d, bndIndex) {
        var xb = d.xbnd[bndIndex];
        if(xb !== null) {
            out.push(Lib.extendFlat({}, d, {x: xb}));
        }
    };

    if(vals.length) {
        for(i = 0; i < vals.length; i++) {
            _push(vals[i], 0);
        }
        _push(vals[i - 1], 1);
    }

    return out;
}

function getSecondaryLabelVals(ax, vals) {
    var out = [];
    var lookup = {};

    for(var i = 0; i < vals.length; i++) {
        var d = vals[i];
        if(lookup[d.text2]) {
            lookup[d.text2].push(d.x);
        } else {
            lookup[d.text2] = [d.x];
        }
    }

    for(var k in lookup) {
        out.push(tickTextObj(ax, Lib.interp(lookup[k], 0.5), k));
    }

    return out;
}

function getDividerVals(ax, vals) {
    var out = [];
    var i, current;

    var reversed = (vals.length && vals[vals.length - 1].x < vals[0].x);

    // never used for labels;
    // no need to worry about the other tickTextObj keys
    var _push = function(d, bndIndex) {
        var xb = d.xbnd[bndIndex];
        if(xb !== null) {
            out.push(Lib.extendFlat({}, d, {x: xb}));
        }
    };

    if(ax.showdividers && vals.length) {
        for(i = 0; i < vals.length; i++) {
            var d = vals[i];
            if(d.text2 !== current) {
                _push(d, reversed ? 1 : 0);
            }
            current = d.text2;
        }
        _push(vals[i - 1], reversed ? 0 : 1);
    }

    return out;
}

function calcLabelLevelBbox(ax, cls, mainLinePositionShift) {
    var top, bottom;
    var left, right;

    if(ax._selections[cls].size()) {
        top = Infinity;
        bottom = -Infinity;
        left = Infinity;
        right = -Infinity;
        ax._selections[cls].each(function() {
            var thisLabel = selectTickLabel(this);
            // Use parent node <g.(x|y)tick>, to make Drawing.bBox
            // retrieve a bbox computed with transform info
            //
            // To improve perf, it would be nice to use `thisLabel.node()`
            // (like in fixLabelOverlaps) instead and use Axes.getPxPosition
            // together with the makeLabelFns outputs and `tickangle`
            // to compute one bbox per (tick value x tick style)
            if (thisLabel.node().style.display !== 'none') {
                var bb = Drawing.bBox(thisLabel.node().parentNode);
                top = Math.min(top, bb.top);
                bottom = Math.max(bottom, bb.bottom);
                left = Math.min(left, bb.left);
                right = Math.max(right, bb.right);
            }
        });
    } else {
        var dummyCalc = axes.makeLabelFns(ax, mainLinePositionShift);
        top = bottom = dummyCalc.yFn({dx: 0, dy: 0, fontSize: 0});
        left = right = dummyCalc.xFn({dx: 0, dy: 0, fontSize: 0});
    }

    return {
        top: top,
        bottom: bottom,
        left: left,
        right: right,
        height: bottom - top,
        width: right - left
    };
}

/**
 * Which direction do the 'ax.side' values, and free ticks go?
 *
 * @param {object} ax (full) axis object
 *  - {string} _id (starting with 'x' or 'y')
 *  - {string} side
 *  - {string} ticks
 * @return {array} all entries are either -1 or 1
 *  - [0]: sign for top/right ticks (i.e. negative SVG direction)
 *  - [1]: sign for bottom/left ticks (i.e. positive SVG direction)
 *  - [2]: sign for ticks corresponding to 'ax.side'
 *  - [3]: sign for ticks mirroring 'ax.side'
 *  - [4]: sign of arrow starting at axis pointing towards margin
 */
axes.getTickSigns = function(ax, minor) {
    var axLetter = ax._id.charAt(0);
    var sideOpposite = {x: 'top', y: 'right'}[axLetter];
    var main = ax.side === sideOpposite ? 1 : -1;
    var out = [-1, 1, main, -main];
    // then we flip if outside XOR y axis

    var ticks = minor ? (ax.minor || {}).ticks : ax.ticks;
    if((ticks !== 'inside') === (axLetter === 'x')) {
        out = out.map(function(v) { return -v; });
    }
    // independent of `ticks`; do not flip this one
    if(ax.side) {
        out.push({l: -1, t: -1, r: 1, b: 1}[ax.side.charAt(0)]);
    }
    return out;
};

/**
 * Make axis translate transform function
 *
 * @param {object} ax (full) axis object
 *  - {string} _id
 *  - {number} _offset
 *  - {fn} l2p
 * @return {fn} function of calcTicks items
 */
axes.makeTransTickFn = function(ax) {
    return ax._id.charAt(0) === 'x' ?
        function(d) { return strTranslate(ax._offset + ax.l2p(d.x), 0); } :
        function(d) { return strTranslate(0, ax._offset + ax.l2p(d.x)); };
};

axes.makeTransTickLabelFn = function(ax) {
    var uv = getTickLabelUV(ax);
    var shift = ax.ticklabelshift || 0;
    var standoff = ax.ticklabelstandoff || 0;

    var u = uv[0];
    var v = uv[1];

    var isReversed = ax.range[0] > ax.range[1];
    var labelsInside = ax.ticklabelposition && ax.ticklabelposition.indexOf('inside') !== -1;
    var labelsOutside = !labelsInside;

    if(shift) {
        var shiftSign = isReversed ? -1 : 1;
        shift = shift * shiftSign;
    }
    if(standoff) {
        var side = ax.side;
        var standoffSign = (
            (labelsInside && (side === 'top' || side === 'left')) ||
            (labelsOutside && (side === 'bottom' || side === 'right'))
        ) ? 1 : -1;
        standoff = standoff * standoffSign;
    }
    return ax._id.charAt(0) === 'x' ?
        function(d) {
            return strTranslate(
                u + ax._offset + ax.l2p(getPosX(d)) + shift,
                v + standoff
            );
        } :
        function(d) {
            return strTranslate(
                v + standoff,
                u + ax._offset + ax.l2p(getPosX(d)) + shift
            );
        };
};

function getPosX(d) {
    return d.periodX !== undefined ? d.periodX : d.x;
}

// u is a shift along the axis,
// v is a shift perpendicular to the axis
function getTickLabelUV(ax) {
    var ticklabelposition = ax.ticklabelposition || '';
    var tickson = ax.tickson || '';
    var has = function(str) {
        return ticklabelposition.indexOf(str) !== -1;
    };

    var isTop = has('top');
    var isLeft = has('left');
    var isRight = has('right');
    var isBottom = has('bottom');
    var isInside = has('inside');

    var isAligned = (tickson !== 'boundaries') && (isBottom || isLeft || isTop || isRight);

    // early return
    if(!isAligned && !isInside) return [0, 0];

    var side = ax.side;

    var u = isAligned ? (ax.tickwidth || 0) / 2 : 0;
    var v = TEXTPAD;

    var fontSize = ax.tickfont ? ax.tickfont.size : 12;
    if(isBottom || isTop) {
        u += fontSize * CAP_SHIFT;
        v += (ax.linewidth || 0) / 2;
    }
    if(isLeft || isRight) {
        u += (ax.linewidth || 0) / 2;
        v += TEXTPAD;
    }
    if(isInside && side === 'top') {
        v -= fontSize * (1 - CAP_SHIFT);
    }

    if(isLeft || isTop) u = -u;
    if(side === 'bottom' || side === 'right') v = -v;

    return [
        isAligned ? u : 0,
        isInside ? v : 0
    ];
}

/**
 * Make axis tick path string
 *
 * @param {object} ax (full) axis object
 *  - {string} _id
 *  - {number} ticklen
 *  - {number} linewidth
 * @param {number} shift along direction of ticklen
 * @param {1 or -1} sgn tick sign
 * @param {object} opts
 * - {number (optional)} len tick length
 * @return {string}
 */
axes.makeTickPath = function(ax, shift, sgn, opts) {
    if(!opts) opts = {};
    var minor = opts.minor;
    if(minor && !ax.minor) return '';

    var len = opts.len !== undefined ? opts.len :
        minor ? ax.minor.ticklen : ax.ticklen;

    var axLetter = ax._id.charAt(0);
    var pad = (ax.linewidth || 1) / 2;

    return axLetter === 'x' ?
        'M0,' + (shift + pad * sgn) + 'v' + (len * sgn) :
        'M' + (shift + pad * sgn) + ',0h' + (len * sgn);
};

/**
 * Make axis tick label x, y and anchor functions
 *
 * @param {object} ax (full) axis object
 *  - {string} _id
 *  - {string} ticks
 *  - {number} ticklen
 *  - {string} side
 *  - {number} linewidth
 *  - {number} tickfont.size
 *  - {boolean} showline
 * @param {number} shift
 * @param {number} angle [in degrees] ...
 * @return {object}
 *  - {fn} xFn
 *  - {fn} yFn
 *  - {fn} anchorFn
 *  - {fn} heightFn
 *  - {number} labelStandoff (gap parallel to ticks)
 *  - {number} labelShift (gap perpendicular to ticks)
 */
axes.makeLabelFns = function(ax, shift, angle) {
    var ticklabelposition = ax.ticklabelposition || '';
    var tickson = ax.tickson || '';

    var has = function(str) {
        return ticklabelposition.indexOf(str) !== -1;
    };

    var isTop = has('top');
    var isLeft = has('left');
    var isRight = has('right');
    var isBottom = has('bottom');
    var isAligned = (tickson !== 'boundaries') && (isBottom || isLeft || isTop || isRight);

    var insideTickLabels = has('inside');
    var labelsOverTicks =
        (ticklabelposition === 'inside' && ax.ticks === 'inside') ||
        (!insideTickLabels && ax.ticks === 'outside' && tickson !== 'boundaries');

    var labelStandoff = 0;
    var labelShift = 0;

    var tickLen = labelsOverTicks ? ax.ticklen : 0;
    if(insideTickLabels) {
        tickLen *= -1;
    } else if(isAligned) {
        tickLen = 0;
    }

    if(labelsOverTicks) {
        labelStandoff += tickLen;
        if(angle) {
            var rad = Lib.deg2rad(angle);
            labelStandoff = tickLen * Math.cos(rad) + 1;
            labelShift = tickLen * Math.sin(rad);
        }
    }

    if(ax.showticklabels && (labelsOverTicks || ax.showline)) {
        labelStandoff += 0.2 * ax.tickfont.size;
    }
    labelStandoff += (ax.linewidth || 1) / 2 * (insideTickLabels ? -1 : 1);

    var out = {
        labelStandoff: labelStandoff,
        labelShift: labelShift
    };

    var x0, y0, ff, flipIt;
    var xQ = 0;

    var side = ax.side;
    var axLetter = ax._id.charAt(0);
    var tickangle = ax.tickangle;
    var endSide;
    if(axLetter === 'x') {
        endSide =
            (!insideTickLabels && side === 'bottom') ||
            (insideTickLabels && side === 'top');

        flipIt = endSide ? 1 : -1;
        if(insideTickLabels) flipIt *= -1;

        x0 = labelShift * flipIt;
        y0 = shift + labelStandoff * flipIt;
        ff = endSide ? 1 : -0.2;
        if(Math.abs(tickangle) === 90) {
            if(insideTickLabels) {
                ff += MID_SHIFT;
            } else {
                if(tickangle === -90 && side === 'bottom') {
                    ff = CAP_SHIFT;
                } else if(tickangle === 90 && side === 'top') {
                    ff = MID_SHIFT;
                } else {
                    ff = 0.5;
                }
            }

            xQ = (MID_SHIFT / 2) * (tickangle / 90);
        }

        out.xFn = function(d) { return d.dx + x0 + xQ * d.fontSize; };
        out.yFn = function(d) { return d.dy + y0 + d.fontSize * ff; };
        out.anchorFn = function(d, a) {
            if(isAligned) {
                if(isLeft) return 'end';
                if(isRight) return 'start';
            }

            if(!isNumeric(a) || a === 0 || a === 180) {
                return 'middle';
            }

            return ((a * flipIt < 0) !== insideTickLabels) ? 'end' : 'start';
        };
        out.heightFn = function(d, a, h) {
            return (a < -60 || a > 60) ? -0.5 * h :
                ((ax.side === 'top') !== insideTickLabels) ? -h :
                0;
        };
    } else if(axLetter === 'y') {
        endSide =
            (!insideTickLabels && side === 'left') ||
            (insideTickLabels && side === 'right');

        flipIt = endSide ? 1 : -1;
        if(insideTickLabels) flipIt *= -1;

        x0 = labelStandoff;
        y0 = labelShift * flipIt;
        ff = 0;
        if(!insideTickLabels && Math.abs(tickangle) === 90) {
            if(
                (tickangle === -90 && side === 'left') ||
                (tickangle === 90 && side === 'right')
            ) {
                ff = CAP_SHIFT;
            } else {
                ff = 0.5;
            }
        }

        if(insideTickLabels) {
            var ang = isNumeric(tickangle) ? +tickangle : 0;
            if(ang !== 0) {
                var rA = Lib.deg2rad(ang);
                xQ = Math.abs(Math.sin(rA)) * CAP_SHIFT * flipIt;
                ff = 0;
            }
        }

        out.xFn = function(d) { return d.dx + shift - (x0 + d.fontSize * ff) * flipIt + xQ * d.fontSize; };
        out.yFn = function(d) { return d.dy + y0 + d.fontSize * MID_SHIFT; };
        out.anchorFn = function(d, a) {
            if(isNumeric(a) && Math.abs(a) === 90) {
                return 'middle';
            }

            return endSide ? 'end' : 'start';
        };
        out.heightFn = function(d, a, h) {
            if(ax.side === 'right') a *= -1;

            return a < -30 ? -h :
                a < 30 ? -0.5 * h :
                0;
        };
    }

    return out;
};

function tickDataFn(d) {
    return [d.text, d.x, d.axInfo, d.font, d.fontSize, d.fontColor].join('_');
}

/**
 * Draw axis ticks
 *
 * @param {DOM element} gd
 * @param {object} ax (full) axis object
 *  - {string} _id
 *  - {string} ticks
 *  - {number} linewidth
 *  - {string} tickcolor
 * @param {object} opts
 * - {array of object} vals (calcTicks output-like)
 * - {d3 selection} layer
 * - {string or fn} path
 * - {fn} transFn
 * - {boolean} crisp (set to false to unset crisp-edge SVG rendering)
 */
axes.drawTicks = function(gd, ax, opts) {
    opts = opts || {};

    var cls = ax._id + 'tick';

    var vals = []
        .concat(ax.minor && ax.minor.ticks ?
            // minor vals
            opts.vals.filter(function(d) { return d.minor && !d.noTick; }) :
            []
        )
        .concat(ax.ticks ?
            // major vals
            opts.vals.filter(function(d) { return !d.minor && !d.noTick; }) :
            []
        );

    var ticks = opts.layer.selectAll('path.' + cls)
        .data(vals, tickDataFn);

    ticks.exit().remove();

    ticks.enter().append('path')
        .classed(cls, 1)
        .classed('ticks', 1)
        .classed('crisp', opts.crisp !== false)
        .each(function(d) {
            return Color.stroke(d3.select(this), d.minor ? ax.minor.tickcolor : ax.tickcolor);
        })
        .style('stroke-width', function(d) {
            return Drawing.crispRound(
                gd,
                d.minor ? ax.minor.tickwidth : ax.tickwidth,
                1
            ) + 'px';
        })
        .attr('d', opts.path)
        .style('display', null); // visible

    hideCounterAxisInsideTickLabels(ax, [TICK_PATH]);

    ticks.attr('transform', opts.transFn);
};

/**
 * Draw axis grid
 *
 * @param {DOM element} gd
 * @param {object} ax (full) axis object
 *  - {string} _id
 *  - {boolean} showgrid
 *  - {string} gridcolor
 *  - {string} gridwidth
 *  - {string} griddash
 *  - {boolean} zeroline
 *  - {string} type
 *  - {string} dtick
 * @param {object} opts
 * - {array of object} vals (calcTicks output-like)
 * - {d3 selection} layer
 * - {object} counterAxis (full axis object corresponding to counter axis)
 *     optional - only required if this axis supports zero lines
 * - {string or fn} path
 * - {fn} transFn
 * - {boolean} crisp (set to false to unset crisp-edge SVG rendering)
 */
axes.drawGrid = function(gd, ax, opts) {
    opts = opts || {};

    if(ax.tickmode === 'sync') {
        // for tickmode sync we use the overlaying axis grid
        return;
    }

    var cls = ax._id + 'grid';

    var hasMinor = ax.minor && ax.minor.showgrid;
    var minorVals = hasMinor ? opts.vals.filter(function(d) { return d.minor; }) : [];
    var majorVals = ax.showgrid ? opts.vals.filter(function(d) { return !d.minor; }) : [];

    var counterAx = opts.counterAxis;
    if(counterAx && axes.shouldShowZeroLine(gd, ax, counterAx)) {
        var isArrayMode = ax.tickmode === 'array';
        for(var i = 0; i < majorVals.length; i++) {
            var xi = majorVals[i].x;
            if(isArrayMode ? !xi : (Math.abs(xi) < ax.dtick / 100)) {
                majorVals = majorVals.slice(0, i).concat(majorVals.slice(i + 1));
                // In array mode you can in principle have multiple
                // ticks at 0, so test them all. Otherwise once we found
                // one we can stop.
                if(isArrayMode) i--;
                else break;
            }
        }
    }

    ax._gw =
        Drawing.crispRound(gd, ax.gridwidth, 1);

    var wMinor = !hasMinor ? 0 :
        Drawing.crispRound(gd, ax.minor.gridwidth, 1);

    var majorLayer = opts.layer;
    var minorLayer = opts.minorLayer;
    for(var major = 1; major >= 0; major--) {
        var layer = major ? majorLayer : minorLayer;
        if(!layer) continue;

        var grid = layer.selectAll('path.' + cls)
            .data(major ? majorVals : minorVals, tickDataFn);

        grid.exit().remove();

        grid.enter().append('path')
            .classed(cls, 1)
            .classed('crisp', opts.crisp !== false);

        grid.attr('transform', opts.transFn)
            .attr('d', opts.path)
            .each(function(d) {
                return Color.stroke(d3.select(this), d.minor ?
                    ax.minor.gridcolor :
                    (ax.gridcolor || '#ddd')
                );
            })
            .style('stroke-dasharray', function(d) {
                return Drawing.dashStyle(
                    d.minor ? ax.minor.griddash : ax.griddash,
                    d.minor ? ax.minor.gridwidth : ax.gridwidth
                );
            })
            .style('stroke-width', function(d) {
                return (d.minor ? wMinor : ax._gw) + 'px';
            })
            .style('display', null); // visible

        if(typeof opts.path === 'function') grid.attr('d', opts.path);
    }

    hideCounterAxisInsideTickLabels(ax, [GRID_PATH, MINORGRID_PATH]);
};

/**
 * Draw axis zero-line
 *
 * @param {DOM element} gd
 * @param {object} ax (full) axis object
 *  - {string} _id
 *  - {boolean} zeroline
 *  - {number} zerolinewidth
 *  - {string} zerolinecolor
 *  - {number (optional)} _gridWidthCrispRound
 * @param {object} opts
 * - {d3 selection} layer
 * - {object} counterAxis (full axis object corresponding to counter axis)
 * - {string or fn} path
 * - {fn} transFn
 * - {boolean} crisp (set to false to unset crisp-edge SVG rendering)
 */
axes.drawZeroLine = function(gd, ax, opts) {
    opts = opts || opts;

    var cls = ax._id + 'zl';
    var show = axes.shouldShowZeroLine(gd, ax, opts.counterAxis);

    var zl = opts.layer.selectAll('path.' + cls)
        .data(show ? [{x: 0, id: ax._id}] : []);

    zl.exit().remove();

    zl.enter().append('path')
        .classed(cls, 1)
        .classed('zl', 1)
        .classed('crisp', opts.crisp !== false)
        .each(function() {
            // use the fact that only one element can enter to trigger a sort.
            // If several zerolines enter at the same time we will sort once per,
            // but generally this should be a minimal overhead.
            opts.layer.selectAll('path').sort(function(da, db) {
                return idSort(da.id, db.id);
            });
        });

    zl.attr('transform', opts.transFn)
        .attr('d', opts.path)
        .call(Color.stroke, ax.zerolinecolor || Color.defaultLine)
        .style('stroke-width', Drawing.crispRound(gd, ax.zerolinewidth, ax._gw || 1) + 'px')
        .style('display', null); // visible

    hideCounterAxisInsideTickLabels(ax, [ZERO_PATH]);
};

/**
 * Draw axis tick labels
 *
 * @param {DOM element} gd
 * @param {object} ax (full) axis object
 *  - {string} _id
 *  - {boolean} showticklabels
 *  - {number} tickangle
 *  - {object (optional)} _selections
 *  - {object} (optional)} _tickAngles
 *  - {object} (optional)} _prevTickAngles
 * @param {object} opts
 * - {array of object} vals (calcTicks output-like)
 * - {d3 selection} layer
 * - {string (optional)} cls (node className)
 * - {boolean} repositionOnUpdate (set to true to reposition update selection)
 * - {boolean} secondary
 * - {fn} transFn
 * - {object} labelFns
 *  + {fn} xFn
 *  + {fn} yFn
 *  + {fn} anchorFn
 *  + {fn} heightFn
 */
axes.drawLabels = function(gd, ax, opts) {
    opts = opts || {};

    var fullLayout = gd._fullLayout;
    var axId = ax._id;
    var zerolineIsAbove = ax.zerolinelayer === 'above traces';
    var cls = opts.cls || axId + 'tick';

    var vals = opts.vals.filter(function(d) { return d.text; });

    var labelFns = opts.labelFns;
    var tickAngle = opts.secondary ? 0 : ax.tickangle;

    var prevAngle = (ax._prevTickAngles || {})[cls];

    var tickLabels = opts.layer.selectAll('g.' + cls)
        .data(ax.showticklabels ? vals : [], tickDataFn);

    var labelsReady = [];

    tickLabels.enter().append('g')
        .classed(cls, 1)
        .append('text')
            // only so tex has predictable alignment that we can
            // alter later
            .attr('text-anchor', 'middle')
            .each(function(d) {
                var thisLabel = d3.select(this);
                var newPromise = gd._promises.length;

                thisLabel
                    .call(svgTextUtils.positionText, labelFns.xFn(d), labelFns.yFn(d))
                    .call(Drawing.font, {
                        family: d.font,
                        size: d.fontSize,
                        color: d.fontColor,
                        weight: d.fontWeight,
                        style: d.fontStyle,
                        variant: d.fontVariant,
                        textcase: d.fontTextcase,
                        lineposition: d.fontLineposition,
                        shadow: d.fontShadow,
                    })
                    .text(d.text)
                    .call(svgTextUtils.convertToTspans, gd);

                if(gd._promises[newPromise]) {
                    // if we have an async label, we'll deal with that
                    // all here so take it out of gd._promises and
                    // instead position the label and promise this in
                    // labelsReady
                    labelsReady.push(gd._promises.pop().then(function() {
                        positionLabels(thisLabel, tickAngle);
                    }));
                } else {
                    // sync label: just position it now.
                    positionLabels(thisLabel, tickAngle);
                }
            });

    hideCounterAxisInsideTickLabels(ax, [TICK_TEXT]);

    tickLabels.exit().remove();

    if(opts.repositionOnUpdate) {
        tickLabels.each(function(d) {
            d3.select(this).select('text')
                .call(svgTextUtils.positionText, labelFns.xFn(d), labelFns.yFn(d));
        });
    }

    function positionLabels(s, angle) {
        s.each(function(d) {
            var thisLabel = d3.select(this);
            var mathjaxGroup = thisLabel.select('.text-math-group');
            var anchor = labelFns.anchorFn(d, angle);

            var transform = opts.transFn.call(thisLabel.node(), d) +
                ((isNumeric(angle) && +angle !== 0) ?
                (' rotate(' + angle + ',' + labelFns.xFn(d) + ',' +
                    (labelFns.yFn(d) - d.fontSize / 2) + ')') :
                '');

            // how much to shift a multi-line label to center it vertically.
            var nLines = svgTextUtils.lineCount(thisLabel);
            var lineHeight = LINE_SPACING * d.fontSize;
            var anchorHeight = labelFns.heightFn(d, isNumeric(angle) ? +angle : 0, (nLines - 1) * lineHeight);

            if(anchorHeight) {
                transform += strTranslate(0, anchorHeight);
            }

            if(mathjaxGroup.empty()) {
                var thisText = thisLabel.select('text');
                thisText.attr({
                    transform: transform,
                    'text-anchor': anchor
                });

                thisText.style('display', null); // visible

                if(ax._adjustTickLabelsOverflow) {
                    ax._adjustTickLabelsOverflow();
                }
            } else {
                var mjWidth = Drawing.bBox(mathjaxGroup.node()).width;
                var mjShift = mjWidth * {end: -0.5, start: 0.5}[anchor];
                mathjaxGroup.attr('transform', transform + strTranslate(mjShift, 0));
            }
        });
    }

    ax._adjustTickLabelsOverflow = function() {
        var ticklabeloverflow = ax.ticklabeloverflow;
        if(!ticklabeloverflow || ticklabeloverflow === 'allow') return;

        var hideOverflow = ticklabeloverflow.indexOf('hide') !== -1;

        var isX = ax._id.charAt(0) === 'x';
        // div positions
        var p0 = 0;
        var p1 = isX ?
            gd._fullLayout.width :
            gd._fullLayout.height;

        if(ticklabeloverflow.indexOf('domain') !== -1) {
            // domain positions
            var rl = Lib.simpleMap(ax.range, ax.r2l);
            p0 = ax.l2p(rl[0]) + ax._offset;
            p1 = ax.l2p(rl[1]) + ax._offset;
        }

        var min = Math.min(p0, p1);
        var max = Math.max(p0, p1);

        var side = ax.side;

        var visibleLabelMin = Infinity;
        var visibleLabelMax = -Infinity;

        tickLabels.each(function(d) {
            var thisLabel = d3.select(this);
            var mathjaxGroup = thisLabel.select('.text-math-group');

            if(mathjaxGroup.empty()) {
                var bb = Drawing.bBox(thisLabel.node());
                var adjust = 0;
                if(isX) {
                    if(bb.right > max) adjust = 1;
                    else if(bb.left < min) adjust = 1;
                } else {
                    if(bb.bottom > max) adjust = 1;
                    else if(bb.top + (ax.tickangle ? 0 : d.fontSize / 4) < min) adjust = 1;
                }

                var t = thisLabel.select('text');
                if(adjust) {
                    if(hideOverflow) t.style('display', 'none'); // hidden
                } else if(t.node().style.display !== 'none'){
                    t.style('display', null);

                    if(side === 'bottom' || side === 'right') {
                        visibleLabelMin = Math.min(visibleLabelMin, isX ? bb.top : bb.left);
                    } else {
                        visibleLabelMin = -Infinity;
                    }

                    if(side === 'top' || side === 'left') {
                        visibleLabelMax = Math.max(visibleLabelMax, isX ? bb.bottom : bb.right);
                    } else {
                        visibleLabelMax = Infinity;
                    }
                }
            } // TODO: hide mathjax?
        });

        for(var subplot in fullLayout._plots) {
            var plotinfo = fullLayout._plots[subplot];
            if(ax._id !== plotinfo.xaxis._id && ax._id !== plotinfo.yaxis._id) continue;
            var anchorAx = isX ? plotinfo.yaxis : plotinfo.xaxis;
            if(anchorAx) {
                anchorAx['_visibleLabelMin_' + ax._id] = visibleLabelMin;
                anchorAx['_visibleLabelMax_' + ax._id] = visibleLabelMax;
            }
        }
    };

    ax._hideCounterAxisInsideTickLabels = function(partialOpts) {
        var isX = ax._id.charAt(0) === 'x';

        var anchoredAxes = [];
        for(var subplot in fullLayout._plots) {
            var plotinfo = fullLayout._plots[subplot];
            if(ax._id !== plotinfo.xaxis._id && ax._id !== plotinfo.yaxis._id) continue;
            anchoredAxes.push(isX ? plotinfo.yaxis : plotinfo.xaxis);
        }

        anchoredAxes.forEach(function(anchorAx, idx) {
            if(anchorAx && insideTicklabelposition(anchorAx)) {
                (partialOpts || [
                    ZERO_PATH,
                    MINORGRID_PATH,
                    GRID_PATH,
                    TICK_PATH,
                    TICK_TEXT
                ]).forEach(function(e) {
                    var isPeriodLabel =
                        e.K === 'tick' &&
                        e.L === 'text' &&
                        ax.ticklabelmode === 'period';

                    var mainPlotinfo = fullLayout._plots[ax._mainSubplot];

                    var sel;
                    if(e.K === ZERO_PATH.K) {
                        var zerolineLayer = zerolineIsAbove ? mainPlotinfo.zerolinelayerAbove : mainPlotinfo.zerolinelayer;
                        sel = zerolineLayer.selectAll('.' + ax._id + 'zl');
                    } else if(e.K === MINORGRID_PATH.K) sel = mainPlotinfo.minorGridlayer.selectAll('.' + ax._id);
                    else if(e.K === GRID_PATH.K) sel = mainPlotinfo.gridlayer.selectAll('.' + ax._id);
                    else sel = mainPlotinfo[ax._id.charAt(0) + 'axislayer'];

                    sel.each(function() {
                        var w = d3.select(this);
                        if(e.L) w = w.selectAll(e.L);

                        w.each(function(d) {
                            var q = ax.l2p(
                                isPeriodLabel ? getPosX(d) : d.x
                            ) + ax._offset;

                            var t = d3.select(this);
                            if(
                                q < ax['_visibleLabelMax_' + anchorAx._id] &&
                                q > ax['_visibleLabelMin_' + anchorAx._id]
                            ) {
                                t.style('display', 'none'); // hidden
                            } else if(e.K === 'tick' && !idx && t.node().style.display !== 'none') {
                                t.style('display', null); // visible
                            }
                        });
                    });
                });
            }
        });
    };

    // make sure all labels are correctly positioned at their base angle
    // the positionLabels call above is only for newly drawn labels.
    // do this without waiting, using the last calculated angle to
    // minimize flicker, then do it again when we know all labels are
    // there, putting back the prescribed angle to check for overlaps.
    positionLabels(tickLabels, (prevAngle + 1) ? prevAngle : tickAngle);

    function allLabelsReady() {
        return labelsReady.length && Promise.all(labelsReady);
    }

    var autoangle = null;

    function fixLabelOverlaps() {
        positionLabels(tickLabels, tickAngle);

        // check for auto-angling if x labels overlap
        // don't auto-angle at all for log axes with
        // base and digit format
        if(vals.length && ax.autotickangles &&
            (ax.type !== 'log' || String(ax.dtick).charAt(0) !== 'D')
        ) {
            autoangle = ax.autotickangles[0];

            var maxFontSize = 0;
            var lbbArray = [];
            var i;
            var maxLines = 1;
            tickLabels.each(function(d) {
                maxFontSize = Math.max(maxFontSize, d.fontSize);

                var x = ax.l2p(d.x);
                var thisLabel = selectTickLabel(this);
                var bb = Drawing.bBox(thisLabel.node());
                maxLines = Math.max(maxLines, svgTextUtils.lineCount(thisLabel));

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

            // autotickangles
            // if there are dividers or ticks on boundaries, the labels will be in between and
            // we need to prevent overlap with the next divider/tick. Else the labels will be on
            // the ticks and we need to prevent overlap with the next label.

            // TODO should secondary labels also fall into this fix-overlap regime?
            var preventOverlapWithTick = (ax.tickson === 'boundaries' || ax.showdividers) && !opts.secondary;

            var vLen = vals.length;
            var tickSpacing = Math.abs((vals[vLen - 1].x - vals[0].x) * ax._m) / (vLen - 1);

            var adjacent = preventOverlapWithTick ? tickSpacing / 2 : tickSpacing;
            var opposite = preventOverlapWithTick ? ax.ticklen : maxFontSize * 1.25 * maxLines;
            var hypotenuse = Math.sqrt(Math.pow(adjacent, 2) + Math.pow(opposite, 2));
            var maxCos = adjacent / hypotenuse;
            var autoTickAnglesRadians = ax.autotickangles.map(
                function(degrees) { return degrees * Math.PI / 180; }
            );
            var angleRadians = autoTickAnglesRadians.find(
                function(angle) { return Math.abs(Math.cos(angle)) <= maxCos; }
            );
            if(angleRadians === undefined) {
                // no angle with smaller cosine than maxCos, just pick the angle with smallest cosine
                angleRadians = autoTickAnglesRadians.reduce(
                    function(currentMax, nextAngle) {
                        return Math.abs(Math.cos(currentMax)) < Math.abs(Math.cos(nextAngle)) ? currentMax : nextAngle;
                    }
                    , autoTickAnglesRadians[0]
                );
            }
            var newAngle = angleRadians * (180 / Math.PI /* to degrees */);

            if(preventOverlapWithTick) {
                var gap = 2;
                if(ax.ticks) gap += ax.tickwidth / 2;

                for(i = 0; i < lbbArray.length; i++) {
                    var xbnd = vals[i].xbnd;
                    var lbb = lbbArray[i];
                    if(
                        (xbnd[0] !== null && (lbb.left - ax.l2p(xbnd[0])) < gap) ||
                        (xbnd[1] !== null && (ax.l2p(xbnd[1]) - lbb.right) < gap)
                    ) {
                        autoangle = newAngle;
                        break;
                    }
                }
            } else {
                var ticklabelposition = ax.ticklabelposition || '';
                var tickson = ax.tickson ||'';

                var has = function(str) {
                    return ticklabelposition.indexOf(str) !== -1;
                };
                var isTop = has('top');
                var isLeft = has('left');
                var isRight = has('right');
                var isBottom = has('bottom');
                var isAligned = (tickson !== 'boundaries') && (isBottom || isLeft || isTop || isRight);
                var pad = !isAligned ? 0 :
                (ax.tickwidth || 0) + 2 * TEXTPAD;

                for(i = 0; i < lbbArray.length - 1; i++) {
                    if(Lib.bBoxIntersect(lbbArray[i], lbbArray[i + 1], pad)) {
                        autoangle = newAngle;
                        break;
                    }
                }
            }

            if(autoangle) {
                positionLabels(tickLabels, autoangle);
            }
        }
    }

    if(ax._selections) {
        ax._selections[cls] = tickLabels;
    }

    var seq = [allLabelsReady];

    // N.B. during auto-margin redraws, if the axis fixed its label overlaps
    // by rotating 90 degrees, do not attempt to re-fix its label overlaps
    // as this can lead to infinite redraw loops!
    if(ax.automargin && fullLayout._redrawFromAutoMarginCount && prevAngle === 90) {
        autoangle = prevAngle;
        seq.push(function() {
            positionLabels(tickLabels, prevAngle);
        });
    } else {
        seq.push(fixLabelOverlaps);
    }

    // save current tick angle for future redraws
    if(ax._tickAngles) {
        seq.push(function() {
            ax._tickAngles[cls] = autoangle === null ?
                (isNumeric(tickAngle) ? tickAngle : 0) :
                autoangle;
        });
    }

    var computeTickLabelBoundingBoxes = function() {
        var labelsMaxW = 0;
        var labelsMaxH = 0;
        tickLabels.each(function(d, i) {
            var thisLabel = selectTickLabel(this);
            var mathjaxGroup = thisLabel.select('.text-math-group');

            if(mathjaxGroup.empty()) {
                var bb;

                if(ax._vals[i]) {
                    bb = ax._vals[i].bb || Drawing.bBox(thisLabel.node());
                    ax._vals[i].bb = bb;
                }

                labelsMaxW = Math.max(labelsMaxW, bb.width);
                labelsMaxH = Math.max(labelsMaxH, bb.height);
            }
        });

        return {
            labelsMaxW: labelsMaxW,
            labelsMaxH: labelsMaxH
        };
    };

    var anchorAx = ax._anchorAxis;
    if(
        anchorAx && (anchorAx.autorange || anchorAx.insiderange) &&
        insideTicklabelposition(ax) &&
        !isLinked(fullLayout, ax._id)
    ) {
        if(!fullLayout._insideTickLabelsUpdaterange) {
            fullLayout._insideTickLabelsUpdaterange = {};
        }

        if(anchorAx.autorange) {
            fullLayout._insideTickLabelsUpdaterange[anchorAx._name + '.autorange'] = anchorAx.autorange;

            seq.push(computeTickLabelBoundingBoxes);
        }

        if(anchorAx.insiderange) {
            var BBs = computeTickLabelBoundingBoxes();
            var move = ax._id.charAt(0) === 'y' ?
                BBs.labelsMaxW :
                BBs.labelsMaxH;

            move += 2 * TEXTPAD;

            if(ax.ticklabelposition === 'inside') {
                move += ax.ticklen || 0;
            }

            var sgn = (ax.side === 'right' || ax.side === 'top') ? 1 : -1;
            var index = sgn === 1 ? 1 : 0;
            var otherIndex = sgn === 1 ? 0 : 1;

            var newRange = [];
            newRange[otherIndex] = anchorAx.range[otherIndex];

            var anchorAxRange = anchorAx.range;

            var p0 = anchorAx.r2p(anchorAxRange[index]);
            var p1 = anchorAx.r2p(anchorAxRange[otherIndex]);

            var _tempNewRange = fullLayout._insideTickLabelsUpdaterange[anchorAx._name + '.range'];
            if(_tempNewRange) { // case of having multiple anchored axes having insideticklabel
                var q0 = anchorAx.r2p(_tempNewRange[index]);
                var q1 = anchorAx.r2p(_tempNewRange[otherIndex]);

                var dir = sgn * (ax._id.charAt(0) === 'y' ? 1 : -1);

                if(dir * p0 < dir * q0) {
                    p0 = q0;
                    newRange[index] = anchorAxRange[index] = _tempNewRange[index];
                }

                if(dir * p1 > dir * q1) {
                    p1 = q1;
                    newRange[otherIndex] = anchorAxRange[otherIndex] = _tempNewRange[otherIndex];
                }
            }

            var dist = Math.abs(p1 - p0);
            if(dist - move > 0) {
                dist -= move;
                move *= 1 + move / dist;
            } else {
                move = 0;
            }

            if(ax._id.charAt(0) !== 'y') move = -move;

            newRange[index] = anchorAx.p2r(
                anchorAx.r2p(anchorAxRange[index]) +
                sgn * move
            );

            // handle partial ranges in insiderange
            if(
                anchorAx.autorange === 'min' ||
                anchorAx.autorange === 'max reversed'
            ) {
                newRange[0] = null;

                anchorAx._rangeInitial0 = undefined;
                anchorAx._rangeInitial1 = undefined;
            } else if(
                anchorAx.autorange === 'max' ||
                anchorAx.autorange === 'min reversed'
            ) {
                newRange[1] = null;

                anchorAx._rangeInitial0 = undefined;
                anchorAx._rangeInitial1 = undefined;
            }

            fullLayout._insideTickLabelsUpdaterange[anchorAx._name + '.range'] = newRange;
        }
    }

    var done = Lib.syncOrAsync(seq);
    if(done && done.then) gd._promises.push(done);
    return done;
};

/**
 * Draw axis dividers
 *
 * @param {DOM element} gd
 * @param {object} ax (full) axis object
 *  - {string} _id
 *  - {string} showdividers
 *  - {number} dividerwidth
 *  - {string} dividercolor
 * @param {object} opts
 * - {array of object} vals (calcTicks output-like)
 * - {d3 selection} layer
 * - {fn} path
 * - {fn} transFn
 */
function drawDividers(gd, ax, opts) {
    var cls = ax._id + 'divider';
    var vals = opts.vals;

    var dividers = opts.layer.selectAll('path.' + cls)
        .data(vals, tickDataFn);

    dividers.exit().remove();

    dividers.enter().insert('path', ':first-child')
        .classed(cls, 1)
        .classed('crisp', 1)
        .call(Color.stroke, ax.dividercolor)
        .style('stroke-width', Drawing.crispRound(gd, ax.dividerwidth, 1) + 'px');

    dividers
        .attr('transform', opts.transFn)
        .attr('d', opts.path);
}

/**
 * Get axis position in px, that is the distance for the graph's
 * top (left) edge for x (y) axes.
 *
 * @param {DOM element} gd
 * @param {object} ax (full) axis object
 *  - {string} _id
 *  - {string} side
 *  if anchored:
 *  - {object} _anchorAxis
 *  Otherwise:
 *  - {number} position
 * @return {number}
 */
axes.getPxPosition = function(gd, ax) {
    var gs = gd._fullLayout._size;
    var axLetter = ax._id.charAt(0);
    var side = ax.side;
    var anchorAxis;

    if(ax.anchor !== 'free') {
        anchorAxis = ax._anchorAxis;
    } else if(axLetter === 'x') {
        anchorAxis = {
            _offset: gs.t + (1 - (ax.position || 0)) * gs.h,
            _length: 0
        };
    } else if(axLetter === 'y') {
        anchorAxis = {
            _offset: gs.l + (ax.position || 0) * gs.w + ax._shift,
            _length: 0
        };
    }

    if(side === 'top' || side === 'left') {
        return anchorAxis._offset;
    } else if(side === 'bottom' || side === 'right') {
        return anchorAxis._offset + anchorAxis._length;
    }
};

/**
 * Approximate axis title depth (w/o computing its bounding box)
 *
 * @param {object} ax (full) axis object
 *  - {string} title.text
 *  - {number} title.font.size
 *  - {number} title.standoff
 * @return {number} (in px)
 */
function approxTitleDepth(ax) {
    var fontSize = ax.title.font.size;
    var extraLines = (ax.title.text.match(svgTextUtils.BR_TAG_ALL) || []).length;
    if(ax.title.hasOwnProperty('standoff')) {
        return fontSize * (CAP_SHIFT + (extraLines * LINE_SPACING));
    } else {
        return extraLines ?
            fontSize * (extraLines + 1) * LINE_SPACING :
            fontSize;
    }
}

/**
 * Draw axis title, compute default standoff if necessary
 *
 * @param {DOM element} gd
 * @param {object} ax (full) axis object
 *  - {string} _id
 *  - {string} _name
 *  - {string} side
 *  - {number} title.font.size
 *  - {object} _selections
 *
 *  - {number} _depth
 *  - {number} title.standoff
 *  OR
 *  - {number} linewidth
 *  - {boolean} showticklabels
 */
function drawTitle(gd, ax) {
    var fullLayout = gd._fullLayout;
    var axId = ax._id;
    var axLetter = axId.charAt(0);
    var fontSize = ax.title.font.size;
    var titleStandoff;
    var extraLines = (ax.title.text.match(svgTextUtils.BR_TAG_ALL) || []).length;

    if(ax.title.hasOwnProperty('standoff')) {
        // With ax._depth the initial drawing baseline is at the outer axis border (where the
        // ticklabels are drawn). Since the title text will be drawn above the baseline,
        // bottom/right axes must be shifted by 1 text line to draw below ticklabels instead of on
        // top of them, whereas for top/left axes, the first line would be drawn
        // before the ticklabels, but we need an offset for the descender portion of the first line
        // and all subsequent lines.
        if(ax.side === 'bottom' || ax.side === 'right') {
            titleStandoff = ax._depth + ax.title.standoff + fontSize * CAP_SHIFT;
        } else if(ax.side === 'top' || ax.side === 'left') {
            titleStandoff = ax._depth + ax.title.standoff + fontSize * (MID_SHIFT + (extraLines * LINE_SPACING));
        }
    } else {
        var isInside = insideTicklabelposition(ax);

        if(ax.type === 'multicategory') {
            titleStandoff = ax._depth;
        } else {
            var offsetBase = 1.5 * fontSize;
            if(isInside) {
                offsetBase = 0.5 * fontSize;
                if(ax.ticks === 'outside') {
                    offsetBase += ax.ticklen;
                }
            }
            titleStandoff = 10 + offsetBase + (ax.linewidth ? ax.linewidth - 1 : 0);
        }

        if(!isInside) {
            if(axLetter === 'x') {
                titleStandoff += ax.side === 'top' ?
                    fontSize * (ax.showticklabels ? 1 : 0) :
                    fontSize * (ax.showticklabels ? 1.5 : 0.5);
            } else {
                titleStandoff += ax.side === 'right' ?
                    fontSize * (ax.showticklabels ? 1 : 0.5) :
                    fontSize * (ax.showticklabels ? 0.5 : 0);
            }
        }
    }

    var pos = axes.getPxPosition(gd, ax);
    var transform, x, y;

    if(axLetter === 'x') {
        x = ax._offset + ax._length / 2;
        y = (ax.side === 'top') ? pos - titleStandoff : pos + titleStandoff;
    } else {
        y = ax._offset + ax._length / 2;
        x = (ax.side === 'right') ? pos + titleStandoff : pos - titleStandoff;
        transform = {rotate: '-90', offset: 0};
    }

    var avoid;

    if(ax.type !== 'multicategory') {
        var tickLabels = ax._selections[ax._id + 'tick'];

        avoid = {
            selection: tickLabels,
            side: ax.side
        };

        if(tickLabels && tickLabels.node() && tickLabels.node().parentNode) {
            var translation = Drawing.getTranslate(tickLabels.node().parentNode);
            avoid.offsetLeft = translation.x;
            avoid.offsetTop = translation.y;
        }

        if(ax.title.hasOwnProperty('standoff')) {
            avoid.pad = 0;
        }
    }

    ax._titleStandoff = titleStandoff;

    return Titles.draw(gd, axId + 'title', {
        propContainer: ax,
        propName: ax._name + '.title.text',
        placeholder: fullLayout._dfltTitle[axLetter],
        avoid: avoid,
        transform: transform,
        attributes: {x: x, y: y, 'text-anchor': 'middle'}
    });
}

axes.shouldShowZeroLine = function(gd, ax, counterAxis) {
    var rng = Lib.simpleMap(ax.range, ax.r2l);
    return (
        (rng[0] * rng[1] <= 0) &&
        ax.zeroline &&
        (ax.type === 'linear' || ax.type === '-') &&
        !(ax.rangebreaks && ax.maskBreaks(0) === BADNUM) &&
        (
            clipEnds(ax, 0) ||
            !anyCounterAxLineAtZero(gd, ax, counterAxis, rng) ||
            hasBarsOrFill(gd, ax)
        )
    );
};

axes.clipEnds = function(ax, vals) {
    return vals.filter(function(d) { return clipEnds(ax, d.x); });
};

function clipEnds(ax, l) {
    var p = ax.l2p(l);
    return (p > 1 && p < ax._length - 1);
}

function anyCounterAxLineAtZero(gd, ax, counterAxis, rng) {
    var mainCounterAxis = counterAxis._mainAxis;
    if(!mainCounterAxis) return;

    var fullLayout = gd._fullLayout;
    var axLetter = ax._id.charAt(0);
    var counterLetter = axes.counterLetter(ax._id);

    var zeroPosition = ax._offset + (
        ((Math.abs(rng[0]) < Math.abs(rng[1])) === (axLetter === 'x')) ?
        0 : ax._length
    );

    function lineNearZero(ax2) {
        if(!ax2.showline || !ax2.linewidth) return false;
        var tolerance = Math.max((ax2.linewidth + ax.zerolinewidth) / 2, 1);

        function closeEnough(pos2) {
            return typeof pos2 === 'number' && Math.abs(pos2 - zeroPosition) < tolerance;
        }

        if(closeEnough(ax2._mainLinePosition) || closeEnough(ax2._mainMirrorPosition)) {
            return true;
        }
        var linePositions = ax2._linepositions || {};
        for(var k in linePositions) {
            if(closeEnough(linePositions[k][0]) || closeEnough(linePositions[k][1])) {
                return true;
            }
        }
    }

    var plotinfo = fullLayout._plots[counterAxis._mainSubplot];
    if(!(plotinfo.mainplotinfo || plotinfo).overlays.length) {
        return lineNearZero(counterAxis, zeroPosition);
    }

    var counterLetterAxes = axes.list(gd, counterLetter);
    for(var i = 0; i < counterLetterAxes.length; i++) {
        var counterAxis2 = counterLetterAxes[i];
        if(
            counterAxis2._mainAxis === mainCounterAxis &&
            lineNearZero(counterAxis2, zeroPosition)
        ) {
            return true;
        }
    }
}

function hasBarsOrFill(gd, ax) {
    var fullData = gd._fullData;
    var subplot = ax._mainSubplot;
    var axLetter = ax._id.charAt(0);

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];

        if(trace.visible === true && (trace.xaxis + trace.yaxis) === subplot) {
            if(
                Registry.traceIs(trace, 'bar-like') &&
                trace.orientation === {x: 'h', y: 'v'}[axLetter]
            ) return true;

            if(
                trace.fill &&
                trace.fill.charAt(trace.fill.length - 1) === axLetter
            ) return true;
        }
    }
    return false;
}

function selectTickLabel(gTick) {
    var s = d3.select(gTick);
    var mj = s.select('.text-math-group');
    return mj.empty() ? s.select('text') : mj;
}

/**
 * Find all margin pushers for 2D axes and reserve them for later use
 * Both label and rangeslider automargin calculations happen later so
 * we need to explicitly allow their ids in order to not delete them.
 *
 * TODO: can we pull the actual automargin calls forward to avoid this hack?
 * We're probably also doing multiple redraws in this case, would be faster
 * if we can just do the whole calculation ahead of time and draw once.
 */
axes.allowAutoMargin = function(gd) {
    var axList = axes.list(gd, '', true);
    for(var i = 0; i < axList.length; i++) {
        var ax = axList[i];
        if(ax.automargin) {
            Plots.allowAutoMargin(gd, axAutoMarginID(ax));
            if(ax.mirror) {
                Plots.allowAutoMargin(gd, axMirrorAutoMarginID(ax));
            }
        }
        if(Registry.getComponentMethod('rangeslider', 'isVisible')(ax)) {
            Plots.allowAutoMargin(gd, rangeSliderAutoMarginID(ax));
        }
    }
};

function axAutoMarginID(ax) { return ax._id + '.automargin'; }
function axMirrorAutoMarginID(ax) { return axAutoMarginID(ax) + '.mirror'; }
function rangeSliderAutoMarginID(ax) { return ax._id + '.rangeslider'; }

// swap all the presentation attributes of the axes showing these traces
axes.swap = function(gd, traces) {
    var axGroups = makeAxisGroups(gd, traces);

    for(var i = 0; i < axGroups.length; i++) {
        swapAxisGroup(gd, axGroups[i].x, axGroups[i].y);
    }
};

function makeAxisGroups(gd, traces) {
    var groups = [];
    var i, j;

    for(i = 0; i < traces.length; i++) {
        var groupsi = [];
        var xi = gd._fullData[traces[i]].xaxis;
        var yi = gd._fullData[traces[i]].yaxis;
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

        var group0 = groups[groupsi[0]];
        var groupj;

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
    var xFullAxes = [];
    var yFullAxes = [];
    var layout = gd.layout;
    var i, j;

    for(i = 0; i < xIds.length; i++) xFullAxes.push(axes.getFromId(gd, xIds[i]));
    for(i = 0; i < yIds.length; i++) yFullAxes.push(axes.getFromId(gd, yIds[i]));

    var allAxKeys = Object.keys(axAttrs);

    var noSwapAttrs = [
        'anchor', 'domain', 'overlaying', 'position', 'side', 'tickangle', 'editType'
    ];
    var numericTypes = ['linear', 'log'];

    for(i = 0; i < allAxKeys.length; i++) {
        var keyi = allAxKeys[i];
        var xVal = xFullAxes[0][keyi];
        var yVal = yFullAxes[0][keyi];
        var allEqual = true;
        var coerceLinearX = false;
        var coerceLinearY = false;
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
            } else if(xVali !== xVal) allEqual = false;
        }
        for(j = 1; j < yFullAxes.length && allEqual; j++) {
            var yVali = yFullAxes[j][keyi];
            if(keyi === 'type' && numericTypes.indexOf(yVal) !== -1 &&
                    numericTypes.indexOf(yVali) !== -1 && yVal !== yVali) {
                // type is special - if we find a mixture of linear and log,
                // coerce them all to linear on flipping
                coerceLinearY = true;
            } else if(yFullAxes[j][keyi] !== yVal) allEqual = false;
        }
        if(allEqual) {
            if(coerceLinearX) layout[xFullAxes[0]._name].type = 'linear';
            if(coerceLinearY) layout[yFullAxes[0]._name].type = 'linear';
            swapAxisAttrs(layout, keyi, xFullAxes, yFullAxes, gd._fullLayout._dfltTitle);
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

function swapAxisAttrs(layout, key, xFullAxes, yFullAxes, dfltTitle) {
    // in case the value is the default for either axis,
    // look at the first axis in each list and see if
    // this key's value is undefined
    var np = Lib.nestedProperty;
    var xVal = np(layout[xFullAxes[0]._name], key).get();
    var yVal = np(layout[yFullAxes[0]._name], key).get();
    var i;

    if(key === 'title') {
        // special handling of placeholder titles
        if(xVal && xVal.text === dfltTitle.x) {
            xVal.text = dfltTitle.y;
        }
        if(yVal && yVal.text === dfltTitle.y) {
            yVal.text = dfltTitle.x;
        }
    }

    for(i = 0; i < xFullAxes.length; i++) {
        np(layout, xFullAxes[i]._name + '.' + key).set(yVal);
    }
    for(i = 0; i < yFullAxes.length; i++) {
        np(layout, yFullAxes[i]._name + '.' + key).set(xVal);
    }
}

function isAngular(ax) {
    return ax._id === 'angularaxis';
}

function moveOutsideBreak(v, ax) {
    var len = ax._rangebreaks.length;
    for(var k = 0; k < len; k++) {
        var brk = ax._rangebreaks[k];
        if(v >= brk.min && v < brk.max) {
            return brk.max;
        }
    }
    return v;
}

function insideTicklabelposition(ax) {
    return ((ax.ticklabelposition || '').indexOf('inside') !== -1);
}

function hideCounterAxisInsideTickLabels(ax, opts) {
    if(insideTicklabelposition(ax._anchorAxis || {})) {
        if(ax._hideCounterAxisInsideTickLabels) {
            ax._hideCounterAxisInsideTickLabels(opts);
        }
    }
}

function incrementShift(ax, shiftVal, axShifts, normalize) {
    // Need to set 'overlay' for anchored axis
    var overlay = ((ax.anchor !== 'free') && ((ax.overlaying === undefined) || (ax.overlaying === false))) ? ax._id : ax.overlaying;
    var shiftValAdj;
    if(normalize) {
        shiftValAdj = ax.side === 'right' ? shiftVal : -shiftVal;
    } else {
        shiftValAdj = shiftVal;
    }
    if(!(overlay in axShifts)) {
        axShifts[overlay] = {};
    }
    if(!(ax.side in axShifts[overlay])) {
        axShifts[overlay][ax.side] = 0;
    }
    axShifts[overlay][ax.side] += shiftValAdj;
}

function setShiftVal(ax, axShifts) {
    return ax.autoshift ?
        axShifts[ax.overlaying][ax.side] :
        (ax.shift || 0);
}

/**
 * Checks if the given period is at least the period described by the tickformat or larger. If that
 * is the case, they are compatible, because then the tickformat can be used to describe the period.
 * E.g. it doesn't make sense to put a year label on a period spanning only a month.
 * @param {number} period in ms
 * @param {string} tickformat
 * @returns {boolean}
 */
function periodCompatibleWithTickformat(period, tickformat) {
    return (
        /%f/.test(tickformat) ? period >= ONEMICROSEC :
        /%L/.test(tickformat) ? period >= ONEMILLI :
        /%[SX]/.test(tickformat) ? period >= ONESEC :
        /%M/.test(tickformat) ? period >= ONEMIN :
        /%[HI]/.test(tickformat) ? period >= ONEHOUR :
        /%p/.test(tickformat) ? period >= HALFDAY :
        /%[Aadejuwx]/.test(tickformat) ? period >= ONEDAY :
        /%[UVW]/.test(tickformat) ? period >= ONEWEEK :
        /%[Bbm]/.test(tickformat) ? period >= ONEMINMONTH :
        /%[q]/.test(tickformat) ? period >= ONEMINQUARTER :
        /%[Yy]/.test(tickformat) ? period >= ONEMINYEAR :
        true
    );
}
