/**
* Copyright 2012-2017, Plotly, Inc.
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

    var fullTraces = gd._fullData,
        calcTraces = gd.calcdata,
        calcTracesHorizontal = [],
        calcTracesVertical = [],
        i;
    for(i = 0; i < fullTraces.length; i++) {
        var fullTrace = fullTraces[i];
        if(
            fullTrace.visible === true &&
            Registry.traceIs(fullTrace, 'bar') &&
            fullTrace.xaxis === xa._id &&
            fullTrace.yaxis === ya._id
        ) {
            if(fullTrace.orientation === 'h') {
                calcTracesHorizontal.push(calcTraces[i]);
            }
            else {
                calcTracesVertical.push(calcTraces[i]);
            }
        }
    }

    setGroupPositions(gd, xa, ya, calcTracesVertical);
    setGroupPositions(gd, ya, xa, calcTracesHorizontal);
};


function setGroupPositions(gd, pa, sa, calcTraces) {
    if(!calcTraces.length) return;

    var barmode = gd._fullLayout.barmode,
        overlay = (barmode === 'overlay'),
        group = (barmode === 'group'),
        excluded,
        included,
        i, calcTrace, fullTrace;

    if(overlay) {
        setGroupPositionsInOverlayMode(gd, pa, sa, calcTraces);
    }
    else if(group) {
        // exclude from the group those traces for which the user set an offset
        excluded = [];
        included = [];
        for(i = 0; i < calcTraces.length; i++) {
            calcTrace = calcTraces[i];
            fullTrace = calcTrace[0].trace;

            if(fullTrace.offset === undefined) included.push(calcTrace);
            else excluded.push(calcTrace);
        }

        if(included.length) {
            setGroupPositionsInGroupMode(gd, pa, sa, included);
        }
        if(excluded.length) {
            setGroupPositionsInOverlayMode(gd, pa, sa, excluded);
        }
    }
    else {
        // exclude from the stack those traces for which the user set a base
        excluded = [];
        included = [];
        for(i = 0; i < calcTraces.length; i++) {
            calcTrace = calcTraces[i];
            fullTrace = calcTrace[0].trace;

            if(fullTrace.base === undefined) included.push(calcTrace);
            else excluded.push(calcTrace);
        }

        if(included.length) {
            setGroupPositionsInStackOrRelativeMode(gd, pa, sa, included);
        }
        if(excluded.length) {
            setGroupPositionsInOverlayMode(gd, pa, sa, excluded);
        }
    }
}


function setGroupPositionsInOverlayMode(gd, pa, sa, calcTraces) {
    var barnorm = gd._fullLayout.barnorm,
        separateNegativeValues = false,
        dontMergeOverlappingData = !barnorm;

    // update position axis and set bar offsets and widths
    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];

        var sieve = new Sieve(
            [calcTrace], separateNegativeValues, dontMergeOverlappingData
        );

        // set bar offsets and widths, and update position axis
        setOffsetAndWidth(gd, pa, sieve);

        // set bar bases and sizes, and update size axis
        //
        // (note that `setGroupPositionsInOverlayMode` handles the case barnorm
        // is defined, because this function is also invoked for traces that
        // can't be grouped or stacked)
        if(barnorm) {
            sieveBars(gd, sa, sieve);
            normalizeBars(gd, sa, sieve);
        }
        else {
            setBaseAndTop(gd, sa, sieve);
        }
    }
}


function setGroupPositionsInGroupMode(gd, pa, sa, calcTraces) {
    var fullLayout = gd._fullLayout,
        barnorm = fullLayout.barnorm,
        separateNegativeValues = false,
        dontMergeOverlappingData = !barnorm,
        sieve = new Sieve(
                calcTraces, separateNegativeValues, dontMergeOverlappingData
            );

    // set bar offsets and widths, and update position axis
    setOffsetAndWidthInGroupMode(gd, pa, sieve);

    // set bar bases and sizes, and update size axis
    if(barnorm) {
        sieveBars(gd, sa, sieve);
        normalizeBars(gd, sa, sieve);
    }
    else {
        setBaseAndTop(gd, sa, sieve);
    }
}


function setGroupPositionsInStackOrRelativeMode(gd, pa, sa, calcTraces) {
    var fullLayout = gd._fullLayout,
        barmode = fullLayout.barmode,
        stack = (barmode === 'stack'),
        relative = (barmode === 'relative'),
        barnorm = gd._fullLayout.barnorm,
        separateNegativeValues = relative,
        dontMergeOverlappingData = !(barnorm || stack || relative),
        sieve = new Sieve(
                calcTraces, separateNegativeValues, dontMergeOverlappingData
            );

    // set bar offsets and widths, and update position axis
    setOffsetAndWidth(gd, pa, sieve);

    // set bar bases and sizes, and update size axis
    stackBars(gd, sa, sieve);

    // flag the outmost bar (for text display purposes)
    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];

        for(var j = 0; j < calcTrace.length; j++) {
            var bar = calcTrace[j];

            if(!isNumeric(bar.s)) continue;

            var isOutmostBar = ((bar.b + bar.s) === sieve.get(bar.p, bar.s));
            if(isOutmostBar) bar._outmost = true;
        }
    }

    // Note that marking the outmost bars has to be done
    // before `normalizeBars` changes `bar.b` and `bar.s`.
    if(barnorm) normalizeBars(gd, sa, sieve);
}


function setOffsetAndWidth(gd, pa, sieve) {
    var fullLayout = gd._fullLayout,
        bargap = fullLayout.bargap,
        bargroupgap = fullLayout.bargroupgap,
        minDiff = sieve.minDiff,
        calcTraces = sieve.traces,
        i, calcTrace, calcTrace0,
        t;

    // set bar offsets and widths
    var barGroupWidth = minDiff * (1 - bargap),
        barWidthPlusGap = barGroupWidth,
        barWidth = barWidthPlusGap * (1 - bargroupgap);

    // computer bar group center and bar offset
    var offsetFromCenter = -barWidth / 2;

    for(i = 0; i < calcTraces.length; i++) {
        calcTrace = calcTraces[i];
        calcTrace0 = calcTrace[0];

        // store bar width and offset for this trace
        t = calcTrace0.t;
        t.barwidth = barWidth;
        t.poffset = offsetFromCenter;
        t.bargroupwidth = barGroupWidth;
    }

    // stack bars that only differ by rounding
    sieve.binWidth = calcTraces[0][0].t.barwidth / 100;

    // if defined, apply trace offset and width
    applyAttributes(sieve);

    // store the bar center in each calcdata item
    setBarCenter(gd, pa, sieve);

    // update position axes
    updatePositionAxis(gd, pa, sieve);
}


function setOffsetAndWidthInGroupMode(gd, pa, sieve) {
    var fullLayout = gd._fullLayout,
        bargap = fullLayout.bargap,
        bargroupgap = fullLayout.bargroupgap,
        positions = sieve.positions,
        distinctPositions = sieve.distinctPositions,
        minDiff = sieve.minDiff,
        calcTraces = sieve.traces,
        i, calcTrace, calcTrace0,
        t;

    // if there aren't any overlapping positions,
    // let them have full width even if mode is group
    var overlap = (positions.length !== distinctPositions.length);

    var nTraces = calcTraces.length,
        barGroupWidth = minDiff * (1 - bargap),
        barWidthPlusGap = (overlap) ? barGroupWidth / nTraces : barGroupWidth,
        barWidth = barWidthPlusGap * (1 - bargroupgap);

    for(i = 0; i < nTraces; i++) {
        calcTrace = calcTraces[i];
        calcTrace0 = calcTrace[0];

        // computer bar group center and bar offset
        var offsetFromCenter = (overlap) ?
                ((2 * i + 1 - nTraces) * barWidthPlusGap - barWidth) / 2 :
                -barWidth / 2;

        // store bar width and offset for this trace
        t = calcTrace0.t;
        t.barwidth = barWidth;
        t.poffset = offsetFromCenter;
        t.bargroupwidth = barGroupWidth;
    }

    // stack bars that only differ by rounding
    sieve.binWidth = calcTraces[0][0].t.barwidth / 100;

    // if defined, apply trace width
    applyAttributes(sieve);

    // store the bar center in each calcdata item
    setBarCenter(gd, pa, sieve);

    // update position axes
    updatePositionAxis(gd, pa, sieve, overlap);
}


function applyAttributes(sieve) {
    var calcTraces = sieve.traces,
        i, calcTrace, calcTrace0, fullTrace,
        j,
        t;

    for(i = 0; i < calcTraces.length; i++) {
        calcTrace = calcTraces[i];
        calcTrace0 = calcTrace[0];
        fullTrace = calcTrace0.trace;
        t = calcTrace0.t;

        var offset = fullTrace.offset,
            initialPoffset = t.poffset,
            newPoffset;

        if(Array.isArray(offset)) {
            // if offset is an array, then clone it into t.poffset.
            newPoffset = offset.slice(0, calcTrace.length);

            // guard against non-numeric items
            for(j = 0; j < newPoffset.length; j++) {
                if(!isNumeric(newPoffset[j])) {
                    newPoffset[j] = initialPoffset;
                }
            }

            // if the length of the array is too short,
            // then extend it with the initial value of t.poffset
            for(j = newPoffset.length; j < calcTrace.length; j++) {
                newPoffset.push(initialPoffset);
            }

            t.poffset = newPoffset;
        }
        else if(offset !== undefined) {
            t.poffset = offset;
        }

        var width = fullTrace.width,
            initialBarwidth = t.barwidth;

        if(Array.isArray(width)) {
            // if width is an array, then clone it into t.barwidth.
            var newBarwidth = width.slice(0, calcTrace.length);

            // guard against non-numeric items
            for(j = 0; j < newBarwidth.length; j++) {
                if(!isNumeric(newBarwidth[j])) newBarwidth[j] = initialBarwidth;
            }

            // if the length of the array is too short,
            // then extend it with the initial value of t.barwidth
            for(j = newBarwidth.length; j < calcTrace.length; j++) {
                newBarwidth.push(initialBarwidth);
            }

            t.barwidth = newBarwidth;

            // if user didn't set offset,
            // then correct t.poffset to ensure bars remain centered
            if(offset === undefined) {
                newPoffset = [];
                for(j = 0; j < calcTrace.length; j++) {
                    newPoffset.push(
                        initialPoffset + (initialBarwidth - newBarwidth[j]) / 2
                    );
                }
                t.poffset = newPoffset;
            }
        }
        else if(width !== undefined) {
            t.barwidth = width;

            // if user didn't set offset,
            // then correct t.poffset to ensure bars remain centered
            if(offset === undefined) {
                t.poffset = initialPoffset + (initialBarwidth - width) / 2;
            }
        }
    }
}


function setBarCenter(gd, pa, sieve) {
    var calcTraces = sieve.traces,
        pLetter = getAxisLetter(pa);

    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i],
            t = calcTrace[0].t,
            poffset = t.poffset,
            poffsetIsArray = Array.isArray(poffset),
            barwidth = t.barwidth,
            barwidthIsArray = Array.isArray(barwidth);

        for(var j = 0; j < calcTrace.length; j++) {
            var calcBar = calcTrace[j];

            calcBar[pLetter] = calcBar.p +
                ((poffsetIsArray) ? poffset[j] : poffset) +
                ((barwidthIsArray) ? barwidth[j] : barwidth) / 2;
        }
    }
}


function updatePositionAxis(gd, pa, sieve, allowMinDtick) {
    var calcTraces = sieve.traces,
        distinctPositions = sieve.distinctPositions,
        distinctPositions0 = distinctPositions[0],
        minDiff = sieve.minDiff,
        vpad = minDiff / 2;

    Axes.minDtick(pa, minDiff, distinctPositions0, allowMinDtick);

    // If the user set the bar width or the offset,
    // then bars can be shifted away from their positions
    // and widths can be larger than minDiff.
    //
    // Here, we compute pMin and pMax to expand the position axis,
    // so that all bars are fully within the axis range.
    var pMin = Math.min.apply(Math, distinctPositions) - vpad,
        pMax = Math.max.apply(Math, distinctPositions) + vpad;

    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i],
            calcTrace0 = calcTrace[0],
            fullTrace = calcTrace0.trace;

        if(fullTrace.width === undefined && fullTrace.offset === undefined) {
            continue;
        }

        var t = calcTrace0.t,
            poffset = t.poffset,
            barwidth = t.barwidth,
            poffsetIsArray = Array.isArray(poffset),
            barwidthIsArray = Array.isArray(barwidth);

        for(var j = 0; j < calcTrace.length; j++) {
            var calcBar = calcTrace[j],
                calcBarOffset = (poffsetIsArray) ? poffset[j] : poffset,
                calcBarWidth = (barwidthIsArray) ? barwidth[j] : barwidth,
                p = calcBar.p,
                l = p + calcBarOffset,
                r = l + calcBarWidth;

            pMin = Math.min(pMin, l);
            pMax = Math.max(pMax, r);
        }
    }

    Axes.expand(pa, [pMin, pMax], {padded: false});
}


function setBaseAndTop(gd, sa, sieve) {
    // store these bar bases and tops in calcdata
    // and make sure the size axis includes zero,
    // along with the bases and tops of each bar.
    var traces = sieve.traces,
        sLetter = getAxisLetter(sa),
        sMax = sa.l2c(sa.c2l(0)),
        sMin = sMax;

    for(var i = 0; i < traces.length; i++) {
        var trace = traces[i];

        for(var j = 0; j < trace.length; j++) {
            var bar = trace[j],
                barBase = bar.b,
                barTop = barBase + bar.s;

            bar[sLetter] = barTop;

            if(isNumeric(sa.c2l(barTop))) {
                sMax = Math.max(sMax, barTop);
                sMin = Math.min(sMin, barTop);
            }
            if(isNumeric(sa.c2l(barBase))) {
                sMax = Math.max(sMax, barBase);
                sMin = Math.min(sMin, barBase);
            }
        }
    }

    Axes.expand(sa, [sMin, sMax], {tozero: true, padded: true});
}


function stackBars(gd, sa, sieve) {
    var fullLayout = gd._fullLayout,
        barnorm = fullLayout.barnorm,
        sLetter = getAxisLetter(sa),
        traces = sieve.traces,
        i, trace,
        j, bar;

    var sMax = sa.l2c(sa.c2l(0)),
        sMin = sMax;

    for(i = 0; i < traces.length; i++) {
        trace = traces[i];

        for(j = 0; j < trace.length; j++) {
            bar = trace[j];

            if(!isNumeric(bar.s)) continue;

            // stack current bar and get previous sum
            var barBase = sieve.put(bar.p, bar.b + bar.s),
                barTop = barBase + bar.b + bar.s;

            // store the bar base and top in each calcdata item
            bar.b = barBase;
            bar[sLetter] = barTop;

            if(!barnorm) {
                if(isNumeric(sa.c2l(barTop))) {
                    sMax = Math.max(sMax, barTop);
                    sMin = Math.min(sMin, barTop);
                }
                if(isNumeric(sa.c2l(barBase))) {
                    sMax = Math.max(sMax, barBase);
                    sMin = Math.min(sMin, barBase);
                }
            }
        }
    }

    // if barnorm is set, let normalizeBars update the axis range
    if(!barnorm) Axes.expand(sa, [sMin, sMax], {tozero: true, padded: true});
}


function sieveBars(gd, sa, sieve) {
    var traces = sieve.traces;

    for(var i = 0; i < traces.length; i++) {
        var trace = traces[i];

        for(var j = 0; j < trace.length; j++) {
            var bar = trace[j];

            if(isNumeric(bar.s)) sieve.put(bar.p, bar.b + bar.s);
        }
    }
}


function normalizeBars(gd, sa, sieve) {
    // Note:
    //
    // normalizeBars requires that either sieveBars or stackBars has been
    // previously invoked.

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
            var bar = trace[j];

            if(!isNumeric(bar.s)) continue;

            var scale = Math.abs(sTop / sieve.get(bar.p, bar.s));
            bar.b *= scale;
            bar.s *= scale;

            var barBase = bar.b,
                barTop = barBase + bar.s;
            bar[sLetter] = barTop;

            if(isNumeric(sa.c2l(barTop))) {
                if(barTop < sMin - sTiny) {
                    padded = true;
                    sMin = barTop;
                }
                if(barTop > sMax + sTiny) {
                    padded = true;
                    sMax = barTop;
                }
            }

            if(isNumeric(sa.c2l(barBase))) {
                if(barBase < sMin - sTiny) {
                    padded = true;
                    sMin = barBase;
                }
                if(barBase > sMax + sTiny) {
                    padded = true;
                    sMax = barBase;
                }
            }
        }
    }

    // update range of size axis
    Axes.expand(sa, [sMin, sMax], {tozero: true, padded: padded});
}


function getAxisLetter(ax) {
    return ax._id.charAt(0);
}
