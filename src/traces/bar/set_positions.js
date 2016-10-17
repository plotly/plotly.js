/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Registry = require('../../registry');
var Axes = require('../../plots/cartesian/axes');
var Sieve = require('./sieve.js');

/*
 * Bar chart stacking/grouping positioning and autoscaling calculations
 * for each direction separately calculate the ranges and positions
 * note that this handles histograms too
 * now doing this one subplot at a time
 */

module.exports = function setPositions(gd, plotinfo) {
    var xa = plotinfo.xaxis,
        ya = plotinfo.yaxis;

    var traces = gd._fullData,
        tracesCalc = gd.calcdata,
        tracesHorizontal = [],
        tracesVertical = [],
        i;
    for(i = 0; i < traces.length; i++) {
        var trace = traces[i];
        if(
            trace.visible === true &&
            Registry.traceIs(trace, 'bar') &&
            trace.xaxis === xa._id &&
            trace.yaxis === ya._id
        ) {
            if(trace.orientation === 'h') tracesHorizontal.push(tracesCalc[i]);
            else tracesVertical.push(tracesCalc[i]);
        }
    }

    setGroupPositions(gd, xa, ya, tracesVertical);
    setGroupPositions(gd, ya, xa, tracesHorizontal);
};


function setGroupPositions(gd, pa, sa, traces) {
    if(!traces.length) return;

    var barmode = gd._fullLayout.barmode,
        overlay = (barmode === 'overlay'),
        group = (barmode === 'group');

    if(overlay) {
        setGroupPositionsInOverlayMode(gd, pa, sa, traces);
    }
    else if(group) {
        setGroupPositionsInGroupMode(gd, pa, sa, traces);
    }
    else {
        setGroupPositionsInStackOrRelativeMode(gd, pa, sa, traces);
    }
}


function setGroupPositionsInOverlayMode(gd, pa, sa, traces) {
    var barnorm = gd._fullLayout.barnorm,
        separateNegativeValues = false,
        dontMergeOverlappingData = !barnorm;

    // update position axis and set bar offsets and widths
    traces.forEach(function(trace) {
        var sieve = new Sieve(
                    [trace], separateNegativeValues, dontMergeOverlappingData
                );

        // set bar offsets and widths, and update position axis
        setOffsetAndWidth(gd, pa, sieve);

        // set bar bases and sizes, and update size axis
        if(barnorm) {
            stackBars(gd, sa, sieve);
        }
        else {
            // make sure the size axis includes zero,
            // along with the tops of each bar,
            // and store these bar tops in calcdata
            var sLetter = getAxisLetter(sa),
                fs = function(v) { v[sLetter] = v.s; return v.s; };

            Axes.expand(sa, trace.map(fs), {tozero: true, padded: true});
        }
    });
}


function setGroupPositionsInGroupMode(gd, pa, sa, traces) {
    var fullLayout = gd._fullLayout,
        barnorm = fullLayout.barnorm,
        separateNegativeValues = false,
        dontMergeOverlappingData = !barnorm,
        sieve = new Sieve(
                traces, separateNegativeValues, dontMergeOverlappingData
            );

    // set bar offsets and widths, and update position axis
    setOffsetAndWidthInGroupMode(gd, pa, sieve);

    // set bar bases and sizes, and update size axis
    if(barnorm) {
        stackBars(gd, sa, sieve);
    }
    else {
        // make sure the size axis includes zero,
        // along with the tops of each bar,
        // and store these bar tops in calcdata
        var sLetter = getAxisLetter(sa),
            fs = function(v) { v[sLetter] = v.s; return v.s; };

        for(var i = 0; i < traces.length; i++) {
            Axes.expand(sa, traces[i].map(fs), {tozero: true, padded: true});
        }
    }
}


function setGroupPositionsInStackOrRelativeMode(gd, pa, sa, traces) {
    var fullLayout = gd._fullLayout,
        barmode = fullLayout.barmode,
        stack = (barmode === 'stack'),
        relative = (barmode === 'relative'),
        barnorm = gd._fullLayout.barnorm,
        separateNegativeValues = relative,
        dontMergeOverlappingData = !(barnorm || stack || relative),
        sieve = new Sieve(
                traces, separateNegativeValues, dontMergeOverlappingData
            );

    // set bar offsets and widths, and update position axis
    setOffsetAndWidth(gd, pa, sieve);

    // set bar bases and sizes, and update size axis
    stackBars(gd, sa, sieve);
}


function setOffsetAndWidth(gd, pa, sieve) {
    var fullLayout = gd._fullLayout,
        pLetter = getAxisLetter(pa),
        traces = sieve.traces,
        bargap = fullLayout.bargap,
        bargroupgap = fullLayout.bargroupgap,
        distinctPositions = sieve.distinctPositions,
        minDiff = sieve.minDiff;

    // set bar offsets and widths
    var barGroupWidth = minDiff * (1 - bargap),
        barWidthPlusGap = barGroupWidth,
        barWidth = barWidthPlusGap * (1 - bargroupgap);

    // computer bar group center and bar offset
    var offsetFromCenter = -barWidth / 2,
        barCenter = 0;

    for(var i = 0; i < traces.length; i++) {
        var trace = traces[i];

        // store bar width and offset for this trace
        var t = trace[0].t;
        t.barwidth = barWidth;
        t.poffset = offsetFromCenter;
        t.bargroupwidth = barGroupWidth;

        // store the bar center in each calcdata item
        for(var j = 0; j < trace.length; j++) {
            var bar = trace[j];
            bar[pLetter] = bar.p + barCenter;
        }
    }

    // update position axes
    Axes.minDtick(pa, minDiff, distinctPositions[0]);
    Axes.expand(pa, distinctPositions, {vpad: minDiff / 2});
}


function setOffsetAndWidthInGroupMode(gd, pa, sieve) {
    var fullLayout = gd._fullLayout,
        pLetter = getAxisLetter(pa),
        traces = sieve.traces,
        bargap = fullLayout.bargap,
        bargroupgap = fullLayout.bargroupgap,
        positions = sieve.positions,
        distinctPositions = sieve.distinctPositions,
        minDiff = sieve.minDiff;

    // if there aren't any overlapping positions,
    // let them have full width even if mode is group
    var overlap = (positions.length !== distinctPositions.length);

    var barGroupWidth = minDiff * (1 - bargap),
        barWidthPlusGap = (overlap) ?
            barGroupWidth / traces.length :
            barGroupWidth,
        barWidth = barWidthPlusGap * (1 - bargroupgap);

    for(var i = 0; i < traces.length; i++) {
        var trace = traces[i];

        // computer bar group center and bar offset
        var offsetFromCenter = (overlap) ?
                ((2 * i + 1 - traces.length) * barWidthPlusGap - barWidth) / 2 :
                -barWidth / 2,
            barCenter = offsetFromCenter + barWidth / 2;

        // store bar width and offset for this trace
        var t = trace[0].t;
        t.barwidth = barWidth;
        t.poffset = offsetFromCenter;
        t.bargroupwidth = barGroupWidth;

        // store the bar center in each calcdata item
        for(var j = 0; j < trace.length; j++) {
            var bar = trace[j];
            bar[pLetter] = bar.p + barCenter;
        }
    }

    // update position axes
    Axes.minDtick(pa, minDiff, distinctPositions[0], overlap);
    Axes.expand(pa, distinctPositions, {vpad: minDiff / 2});
}


function stackBars(gd, sa, sieve) {
    var fullLayout = gd._fullLayout,
        sLetter = getAxisLetter(sa),
        traces = sieve.traces,
        i, trace,
        j, bar;

    var stack = (fullLayout.barmode === 'stack'),
        relative = (fullLayout.barmode === 'relative'),
        norm = fullLayout.barnorm;

    // bar size range and stacking calculation
    // for stacked bars, we need to evaluate every step in every
    // stack, because negative bars mean the extremes could be
    // anywhere
    // also stores the base (b) of each bar in calcdata
    // so we don't have to redo this later
    var sMax = sa.l2c(sa.c2l(0)),
        sMin = sMax;

    // stack bars that only differ by rounding
    sieve.binWidth = traces[0][0].t.barwidth / 100;

    for(i = 0; i < traces.length; i++) {
        trace = traces[i];

        for(j = 0; j < trace.length; j++) {
            bar = trace[j];

            // skip over bars with no size,
            // so that we don't try to stack them
            if(!isNumeric(bar.s)) continue;

            // stack current bar and get previous sum
            var previousSum = sieve.put(bar.p, bar.s);

            if(stack || relative) bar.b = previousSum;

            // store the bar top in each calcdata item
            if(stack || relative) {
                var barEnd = bar.b + bar.s;
                bar[sLetter] = barEnd;
                if(!norm && isNumeric(sa.c2l(barEnd))) {
                    sMax = Math.max(sMax, barEnd);
                    sMin = Math.min(sMin, barEnd);
                }
            }
        }
    }

    if(norm) {
        normalizeBars(gd, sa, sieve);
    }
    else {
        Axes.expand(sa, [sMin, sMax], {tozero: true, padded: true});
    }
}


function normalizeBars(gd, sa, sieve) {
    var traces = sieve.traces,
        sLetter = getAxisLetter(sa),
        sTop = (gd._fullLayout.barnorm === 'fraction') ? 1 : 100,
        sTiny = sTop / 1e9, // in case of rounding error in sum
        sMin = 0,
        sMax = (gd._fullLayout.barmode === 'stack') ? sTop : 0,
        padded = false;

    for(var i = 0; i < traces.length; i++) {
        var trace = traces[i];

        for(var j = 0; j < trace.length; j++) {
            var bar = trace[j],
                scale = Math.abs(sTop / sieve.get(bar.p, bar.s));

            bar.b *= scale;
            bar.s *= scale;
            var barEnd = bar.b + bar.s;
            bar[sLetter] = barEnd;

            if(isNumeric(sa.c2l(barEnd))) {
                if(barEnd < sMin - sTiny) {
                    padded = true;
                    sMin = barEnd;
                }
                if(barEnd > sMax + sTiny) {
                    padded = true;
                    sMax = barEnd;
                }
            }
        }
    }

    Axes.expand(sa, [sMin, sMax], {tozero: true, padded: padded});
}


function getAxisLetter(ax) {
    return ax._id.charAt(0);
}
