/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');

var arraysToCalcdata = require('../bar/arrays_to_calcdata');
var binFunctions = require('./bin_functions');
var normFunctions = require('./norm_functions');
var doAvg = require('./average');
var cleanBins = require('./clean_bins');
var oneMonth = require('../../constants/numerical').ONEAVGMONTH;


module.exports = function calc(gd, trace) {
    // ignore as much processing as possible (and including in autorange) if bar is not visible
    if(trace.visible !== true) return;

    // depending on orientation, set position and size axes and data ranges
    // note: this logic for choosing orientation is duplicated in graph_obj->setstyles
    var pos = [];
    var size = [];
    var pa = Axes.getFromId(gd, trace.orientation === 'h' ?
        (trace.yaxis || 'y') : (trace.xaxis || 'x'));
    var mainData = trace.orientation === 'h' ? 'y' : 'x';
    var counterData = {x: 'y', y: 'x'}[mainData];
    var calendar = trace[mainData + 'calendar'];
    var cumulativeSpec = trace.cumulative;
    var i;

    cleanBins(trace, pa, mainData);

    var binsAndPos = calcAllAutoBins(gd, trace, pa, mainData);
    var binSpec = binsAndPos[0];
    var pos0 = binsAndPos[1];

    var nonuniformBins = typeof binSpec.size === 'string';
    var bins = nonuniformBins ? [] : binSpec;
    // make the empty bin array
    var inc = [];
    var counts = [];
    var total = 0;
    var norm = trace.histnorm;
    var func = trace.histfunc;
    var densityNorm = norm.indexOf('density') !== -1;
    var i2, binEnd, n;

    if(cumulativeSpec.enabled && densityNorm) {
        // we treat "cumulative" like it means "integral" if you use a density norm,
        // which in the end means it's the same as without "density"
        norm = norm.replace(/ ?density$/, '');
        densityNorm = false;
    }

    var extremeFunc = func === 'max' || func === 'min';
    var sizeInit = extremeFunc ? null : 0;
    var binFunc = binFunctions.count;
    var normFunc = normFunctions[norm];
    var isAvg = false;
    var pr2c = function(v) { return pa.r2c(v, 0, calendar); };
    var rawCounterData;

    if(Array.isArray(trace[counterData]) && func !== 'count') {
        rawCounterData = trace[counterData];
        isAvg = func === 'avg';
        binFunc = binFunctions[func];
    }

    // create the bins (and any extra arrays needed)
    // assume more than 1e6 bins is an error, so we don't crash the browser
    i = pr2c(binSpec.start);

    // decrease end a little in case of rounding errors
    binEnd = pr2c(binSpec.end) + (i - Axes.tickIncrement(i, binSpec.size, false, calendar)) / 1e6;

    while(i < binEnd && pos.length < 1e6) {
        i2 = Axes.tickIncrement(i, binSpec.size, false, calendar);
        pos.push((i + i2) / 2);
        size.push(sizeInit);
        // nonuniform bins (like months) we need to search,
        // rather than straight calculate the bin we're in
        if(nonuniformBins) bins.push(i);
        // nonuniform bins also need nonuniform normalization factors
        if(densityNorm) inc.push(1 / (i2 - i));
        if(isAvg) counts.push(0);
        // break to avoid infinite loops
        if(i2 <= i) break;
        i = i2;
    }

    // for date axes we need bin bounds to be calcdata. For nonuniform bins
    // we already have this, but uniform with start/end/size they're still strings.
    if(!nonuniformBins && pa.type === 'date') {
        bins = {
            start: pr2c(bins.start),
            end: pr2c(bins.end),
            size: bins.size
        };
    }

    var nMax = size.length;
    // bin the data
    for(i = 0; i < pos0.length; i++) {
        n = Lib.findBin(pos0[i], bins);
        if(n >= 0 && n < nMax) total += binFunc(n, i, size, rawCounterData, counts);
    }

    // average and/or normalize the data, if needed
    if(isAvg) total = doAvg(size, counts);
    if(normFunc) normFunc(size, total, inc);

    // after all normalization etc, now we can accumulate if desired
    if(cumulativeSpec.enabled) cdf(size, cumulativeSpec.direction, cumulativeSpec.currentbin);


    var seriesLen = Math.min(pos.length, size.length);
    var cd = [];
    var firstNonzero = 0;
    var lastNonzero = seriesLen - 1;

    // look for empty bins at the ends to remove, so autoscale omits them
    for(i = 0; i < seriesLen; i++) {
        if(size[i]) {
            firstNonzero = i;
            break;
        }
    }
    for(i = seriesLen - 1; i >= firstNonzero; i--) {
        if(size[i]) {
            lastNonzero = i;
            break;
        }
    }

    // create the "calculated data" to plot
    for(i = firstNonzero; i <= lastNonzero; i++) {
        if((isNumeric(pos[i]) && isNumeric(size[i]))) {
            cd.push({p: pos[i], s: size[i], b: 0});
        }
    }

    if(cd.length === 1) {
        // when we collapse to a single bin, calcdata no longer describes bin size
        // so we need to explicitly specify it
        cd[0].width1 = Axes.tickIncrement(cd[0].p, binSpec.size, false, calendar) - cd[0].p;
    }

    arraysToCalcdata(cd, trace);

    return cd;
};

/*
 * calcAllAutoBins: we want all histograms on the same axes to share bin specs
 * if they're grouped or stacked. If the user has explicitly specified differing
 * bin specs, there's nothing we can do, but if possible we will try to use the
 * smallest bins of any of the auto values for all histograms grouped/stacked
 * together.
 */
function calcAllAutoBins(gd, trace, pa, mainData, _overlayEdgeCase) {
    var binAttr = mainData + 'bins';
    var isOverlay = gd._fullLayout.barmode === 'overlay';
    var i, tracei, calendar, firstManual, pos0;

    // all but the first trace in this group has already been marked finished
    // clear this flag, so next time we run calc we will run autobin again
    if(trace._autoBinFinished) {
        delete trace._autoBinFinished;
    }
    else {
        // must be the first trace in the group - do the autobinning on them all

        // find all grouped traces - in overlay mode each trace is independent
        var traceGroup = isOverlay ? [trace] : getConnectedHistograms(gd, trace);
        var autoBinnedTraces = [];

        var minSize = Infinity;
        var minStart = Infinity;
        var maxEnd = -Infinity;

        var autoBinAttr = 'autobin' + mainData;

        for(i = 0; i < traceGroup.length; i++) {
            tracei = traceGroup[i];

            // stash pos0 on the trace so we don't need to duplicate this
            // in the main body of calc
            pos0 = tracei._pos0 = pa.makeCalcdata(tracei, mainData);
            var binSpec = tracei[binAttr];

            if((tracei[autoBinAttr]) || !binSpec ||
                    binSpec.start === null || binSpec.end === null) {
                calendar = tracei[mainData + 'calendar'];
                var cumulativeSpec = tracei.cumulative;

                binSpec = Axes.autoBin(pos0, pa, tracei['nbins' + mainData], false, calendar);

                // Edge case: single-valued histogram overlaying others
                // Use them all together to calculate the bin size for the single-valued one
                if(isOverlay && binSpec._count === 1 && pa.type !== 'category') {
                    // Several single-valued histograms! Stop infinite recursion,
                    // just return an extra flag that tells handleSingleValueOverlays
                    // to sort out this trace too
                    if(_overlayEdgeCase) return [binSpec, pos0, true];

                    binSpec = handleSingleValueOverlays(gd, trace, pa, mainData, binAttr);
                }

                // adjust for CDF edge cases
                if(cumulativeSpec.enabled && (cumulativeSpec.currentbin !== 'include')) {
                    if(cumulativeSpec.direction === 'decreasing') {
                        minStart = Math.min(minStart, pa.r2c(binSpec.start, 0, calendar) - binSpec.size);
                    }
                    else {
                        maxEnd = Math.max(maxEnd, pa.r2c(binSpec.end, 0, calendar) + binSpec.size);
                    }
                }

                // note that it's possible to get here with an explicit autobin: false
                // if the bins were not specified. mark this trace for followup
                autoBinnedTraces.push(tracei);
            }
            else if(!firstManual) {
                // Remember the first manually set binSpec. We'll try to be extra
                // accommodating of this one, so other bins line up with these.
                // But if there's more than one manual bin set and they're mutually
                // inconsistent, then there's not much we can do...
                firstManual = {
                    size: binSpec.size,
                    start: pa.r2c(binSpec.start, 0, calendar),
                    end: pa.r2c(binSpec.end, 0, calendar)
                };
            }

            // Even non-autobinned traces get included here, so we get the greatest extent
            // and minimum bin size of them all.
            // But manually binned traces won't be adjusted, even if the auto values
            // are inconsistent with the manual ones (or the manual ones are inconsistent
            // with each other).
            minSize = getMinSize(minSize, binSpec.size);
            minStart = Math.min(minStart, pa.r2c(binSpec.start, 0, calendar));
            maxEnd = Math.max(maxEnd, pa.r2c(binSpec.end, 0, calendar));

            // add the flag that lets us abort autobin on later traces
            if(i) tracei._autoBinFinished = 1;
        }

        // do what we can to match the auto bins to the first manual bins
        // but only if sizes are all numeric
        if(firstManual && isNumeric(firstManual.size) && isNumeric(minSize)) {
            // first need to ensure the bin size is the same as or an integer fraction
            // of the first manual bin
            // allow the bin size to increase just under the autobin step size to match,
            // (which is a factor of 2 or 2.5) otherwise shrink it
            if(minSize > firstManual.size / 1.9) minSize = firstManual.size;
            else minSize = firstManual.size / Math.ceil(firstManual.size / minSize);

            // now decrease minStart if needed to make the bin centers line up
            var adjustedFirstStart = firstManual.start + (firstManual.size - minSize) / 2;
            minStart = adjustedFirstStart - minSize * Math.ceil((adjustedFirstStart - minStart) / minSize);
        }

        // now go back to the autobinned traces and update their bin specs with the final values
        for(i = 0; i < autoBinnedTraces.length; i++) {
            tracei = autoBinnedTraces[i];
            calendar = tracei[mainData + 'calendar'];

            tracei._input[binAttr] = tracei[binAttr] = {
                start: pa.c2r(minStart, 0, calendar),
                end: pa.c2r(maxEnd, 0, calendar),
                size: minSize
            };

            // note that it's possible to get here with an explicit autobin: false
            // if the bins were not specified.
            // in that case this will remain in the trace, so that future updates
            // which would change the autobinning will not do so.
            tracei._input[autoBinAttr] = tracei[autoBinAttr];
        }
    }

    pos0 = trace._pos0;
    delete trace._pos0;

    return [trace[binAttr], pos0];
}

/*
 * Adjust single-value histograms in overlay mode to make as good a
 * guess as we can at autobin values the user would like.
 *
 * Returns the binSpec for the trace that sparked all this
 */
function handleSingleValueOverlays(gd, trace, pa, mainData, binAttr) {
    var overlaidTraceGroup = getConnectedHistograms(gd, trace);
    var pastThisTrace = false;
    var minSize = Infinity;
    var singleValuedTraces = [trace];
    var i, tracei;

    // first collect all the:
    // - min bin size from all multi-valued traces
    // - single-valued traces
    for(i = 0; i < overlaidTraceGroup.length; i++) {
        tracei = overlaidTraceGroup[i];
        if(tracei === trace) pastThisTrace = true;
        else if(!pastThisTrace) {
            // This trace has already had its autobins calculated
            // (so must not have been single-valued).
            minSize = Math.min(minSize, tracei[binAttr].size);
        }
        else {
            var resulti = calcAllAutoBins(gd, tracei, pa, mainData, true);
            var binSpeci = resulti[0];
            var isSingleValued = resulti[2];

            // so we can use this result when we get to tracei in the normal
            // course of events, mark it as done and put _pos0 back
            tracei._autoBinFinished = 1;
            tracei._pos0 = resulti[1];

            if(isSingleValued) {
                singleValuedTraces.push(tracei);
            }
            else {
                minSize = Math.min(minSize, binSpeci.size);
            }
        }
    }

    // find the real data values for each single-valued trace
    // hunt through pos0 for the first valid value
    var dataVals = new Array(singleValuedTraces.length);
    for(i = 0; i < singleValuedTraces.length; i++) {
        var pos0 = singleValuedTraces[i]._pos0;
        for(var j = 0; j < pos0.length; j++) {
            if(pos0[j] !== undefined) {
                dataVals[i] = pos0[j];
                break;
            }
        }
    }

    // are ALL traces are single-valued? use the min difference between
    // all of their values (which defaults to 1 if there's still only one)
    if(!isFinite(minSize)) {
        minSize = Lib.distinctVals(dataVals).minDiff;
    }

    // now apply the min size we found to all single-valued traces
    for(i = 0; i < singleValuedTraces.length; i++) {
        tracei = singleValuedTraces[i];
        var calendar = tracei[mainData + 'calendar'];

        tracei._input[binAttr] = tracei[binAttr] = {
            start: pa.c2r(dataVals[i] - minSize / 2, 0, calendar),
            end: pa.c2r(dataVals[i] + minSize / 2, 0, calendar),
            size: minSize
        };
    }

    return trace[binAttr];
}

/*
 * Return an array of histograms that share axes and orientation.
 *
 * Only considers histograms. In principle we could include bars in a
 * similar way to how we do manually binned histograms, though this
 * would have tons of edge cases and value judgments to make.
 */
function getConnectedHistograms(gd, trace) {
    var xid = trace.xaxis;
    var yid = trace.yaxis;
    var orientation = trace.orientation;

    var out = [];
    var fullData = gd._fullData;
    for(var i = 0; i < fullData.length; i++) {
        var tracei = fullData[i];
        if(tracei.type === 'histogram' &&
            tracei.orientation === orientation &&
            tracei.xaxis === xid && tracei.yaxis === yid
        ) {
            out.push(tracei);
        }
    }

    return out;
}


/*
 * getMinSize: find the smallest given that size can be a string code
 * ie 'M6' for 6 months. ('L' wouldn't make sense to compare with numeric sizes)
 */
function getMinSize(size1, size2) {
    if(size1 === Infinity) return size2;
    var sizeNumeric1 = numericSize(size1);
    var sizeNumeric2 = numericSize(size2);
    return sizeNumeric2 < sizeNumeric1 ? size2 : size1;
}

function numericSize(size) {
    if(isNumeric(size)) return size;
    if(typeof size === 'string' && size.charAt(0) === 'M') {
        return oneMonth * +(size.substr(1));
    }
    return Infinity;
}

function cdf(size, direction, currentBin) {
    var i, vi, prevSum;

    function firstHalfPoint(i) {
        prevSum = size[i];
        size[i] /= 2;
    }

    function nextHalfPoint(i) {
        vi = size[i];
        size[i] = prevSum + vi / 2;
        prevSum += vi;
    }

    if(currentBin === 'half') {

        if(direction === 'increasing') {
            firstHalfPoint(0);
            for(i = 1; i < size.length; i++) {
                nextHalfPoint(i);
            }
        }
        else {
            firstHalfPoint(size.length - 1);
            for(i = size.length - 2; i >= 0; i--) {
                nextHalfPoint(i);
            }
        }
    }
    else if(direction === 'increasing') {
        for(i = 1; i < size.length; i++) {
            size[i] += size[i - 1];
        }

        // 'exclude' is identical to 'include' just shifted one bin over
        if(currentBin === 'exclude') {
            size.unshift(0);
            size.pop();
        }
    }
    else {
        for(i = size.length - 2; i >= 0; i--) {
            size[i] += size[i + 1];
        }

        if(currentBin === 'exclude') {
            size.push(0);
            size.shift();
        }
    }
}
