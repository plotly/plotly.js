/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var isArrayOrTypedArray = require('../../lib').isArrayOrTypedArray;
var BADNUM = require('../../constants/numerical').BADNUM;

var Registry = require('../../registry');
var Axes = require('../../plots/cartesian/axes');
var Sieve = require('./sieve.js');

/*
 * Bar chart stacking/grouping positioning and autoscaling calculations
 * for each direction separately calculate the ranges and positions
 * note that this handles histograms too
 * now doing this one subplot at a time
 */

function crossTraceCalc(gd, plotinfo) {
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;

    var fullTraces = gd._fullData;
    var calcTraces = gd.calcdata;
    var calcTracesHorizontal = [];
    var calcTracesVertical = [];

    for(var i = 0; i < fullTraces.length; i++) {
        var fullTrace = fullTraces[i];
        if(
            fullTrace.visible === true &&
            Registry.traceIs(fullTrace, 'bar') &&
            fullTrace.xaxis === xa._id &&
            fullTrace.yaxis === ya._id
        ) {
            if(fullTrace.orientation === 'h') {
                calcTracesHorizontal.push(calcTraces[i]);
            } else {
                calcTracesVertical.push(calcTraces[i]);
            }
        }
    }

    setGroupPositions(gd, xa, ya, calcTracesVertical);
    setGroupPositions(gd, ya, xa, calcTracesHorizontal);
}

function setGroupPositions(gd, pa, sa, calcTraces) {
    if(!calcTraces.length) return;

    var barmode = gd._fullLayout.barmode;
    var overlay = (barmode === 'overlay');
    var group = (barmode === 'group');
    var excluded;
    var included;
    var i, calcTrace, fullTrace;

    initBase(gd, pa, sa, calcTraces);

    if(overlay) {
        setGroupPositionsInOverlayMode(gd, pa, sa, calcTraces);
    } else if(group) {
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
    } else {
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

    collectExtents(calcTraces, pa);
}

function initBase(gd, pa, sa, calcTraces) {
    var i, j;

    for(i = 0; i < calcTraces.length; i++) {
        var cd = calcTraces[i];
        var trace = cd[0].trace;
        var base = trace.base;
        var b;

        // not sure if it really makes sense to have dates for bar size data...
        // ideally if we want to make gantt charts or something we'd treat
        // the actual size (trace.x or y) as time delta but base as absolute
        // time. But included here for completeness.
        var scalendar = trace.orientation === 'h' ? trace.xcalendar : trace.ycalendar;

        // 'base' on categorical axes makes no sense
        var d2c = sa.type === 'category' || sa.type === 'multicategory' ?
            function() { return null; } :
            sa.d2c;

        if(isArrayOrTypedArray(base)) {
            for(j = 0; j < Math.min(base.length, cd.length); j++) {
                b = d2c(base[j], 0, scalendar);
                if(isNumeric(b)) {
                    cd[j].b = +b;
                    cd[j].hasB = 1;
                }
                else cd[j].b = 0;
            }
            for(; j < cd.length; j++) {
                cd[j].b = 0;
            }
        } else {
            b = d2c(base, 0, scalendar);
            var hasBase = isNumeric(b);
            b = hasBase ? b : 0;
            for(j = 0; j < cd.length; j++) {
                cd[j].b = b;
                if(hasBase) cd[j].hasB = 1;
            }
        }
    }
}

function setGroupPositionsInOverlayMode(gd, pa, sa, calcTraces) {
    var barnorm = gd._fullLayout.barnorm;
    var separateNegativeValues = false;
    var dontMergeOverlappingData = !barnorm;

    // update position axis and set bar offsets and widths
    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];
        var sieve = new Sieve([calcTrace], separateNegativeValues, dontMergeOverlappingData);

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
        } else {
            setBaseAndTop(gd, sa, sieve);
        }
    }
}

function setGroupPositionsInGroupMode(gd, pa, sa, calcTraces) {
    var fullLayout = gd._fullLayout;
    var barnorm = fullLayout.barnorm;
    var separateNegativeValues = false;
    var dontMergeOverlappingData = !barnorm;
    var sieve = new Sieve(calcTraces, separateNegativeValues, dontMergeOverlappingData);

    // set bar offsets and widths, and update position axis
    setOffsetAndWidthInGroupMode(gd, pa, sieve);

    // set bar bases and sizes, and update size axis
    if(barnorm) {
        sieveBars(gd, sa, sieve);
        normalizeBars(gd, sa, sieve);
    } else {
        setBaseAndTop(gd, sa, sieve);
    }
}

function setGroupPositionsInStackOrRelativeMode(gd, pa, sa, calcTraces) {
    var fullLayout = gd._fullLayout;
    var barmode = fullLayout.barmode;
    var stack = barmode === 'stack';
    var relative = barmode === 'relative';
    var barnorm = fullLayout.barnorm;
    var separateNegativeValues = relative;
    var dontMergeOverlappingData = !(barnorm || stack || relative);
    var sieve = new Sieve(calcTraces, separateNegativeValues, dontMergeOverlappingData);

    // set bar offsets and widths, and update position axis
    setOffsetAndWidth(gd, pa, sieve);

    // set bar bases and sizes, and update size axis
    stackBars(gd, sa, sieve);

    // flag the outmost bar (for text display purposes)
    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];

        for(var j = 0; j < calcTrace.length; j++) {
            var bar = calcTrace[j];

            if(bar.s !== BADNUM) {
                var isOutmostBar = ((bar.b + bar.s) === sieve.get(bar.p, bar.s));
                if(isOutmostBar) bar._outmost = true;
            }
        }
    }

    // Note that marking the outmost bars has to be done
    // before `normalizeBars` changes `bar.b` and `bar.s`.
    if(barnorm) normalizeBars(gd, sa, sieve);
}

function setOffsetAndWidth(gd, pa, sieve) {
    var fullLayout = gd._fullLayout;
    var bargap = fullLayout.bargap;
    var bargroupgap = fullLayout.bargroupgap || 0;
    var minDiff = sieve.minDiff;
    var calcTraces = sieve.traces;

    // set bar offsets and widths
    var barGroupWidth = minDiff * (1 - bargap);
    var barWidthPlusGap = barGroupWidth;
    var barWidth = barWidthPlusGap * (1 - bargroupgap);

    // computer bar group center and bar offset
    var offsetFromCenter = -barWidth / 2;

    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];
        var t = calcTrace[0].t;

        // store bar width and offset for this trace
        t.barwidth = barWidth;
        t.poffset = offsetFromCenter;
        t.bargroupwidth = barGroupWidth;
        t.bardelta = minDiff;
    }

    // stack bars that only differ by rounding
    sieve.binWidth = calcTraces[0][0].t.barwidth / 100;

    // if defined, apply trace offset and width
    applyAttributes(sieve);

    // store the bar center in each calcdata item
    setBarCenterAndWidth(gd, pa, sieve);

    // update position axes
    updatePositionAxis(gd, pa, sieve);
}

function setOffsetAndWidthInGroupMode(gd, pa, sieve) {
    var fullLayout = gd._fullLayout;
    var bargap = fullLayout.bargap;
    var bargroupgap = fullLayout.bargroupgap || 0;
    var positions = sieve.positions;
    var distinctPositions = sieve.distinctPositions;
    var minDiff = sieve.minDiff;
    var calcTraces = sieve.traces;

    // if there aren't any overlapping positions,
    // let them have full width even if mode is group
    var overlap = (positions.length !== distinctPositions.length);

    var nTraces = calcTraces.length;
    var barGroupWidth = minDiff * (1 - bargap);
    var barWidthPlusGap = (overlap) ? barGroupWidth / nTraces : barGroupWidth;
    var barWidth = barWidthPlusGap * (1 - bargroupgap);

    for(var i = 0; i < nTraces; i++) {
        var calcTrace = calcTraces[i];
        var t = calcTrace[0].t;

        // computer bar group center and bar offset
        var offsetFromCenter = overlap ?
            ((2 * i + 1 - nTraces) * barWidthPlusGap - barWidth) / 2 :
            -barWidth / 2;

        // store bar width and offset for this trace
        t.barwidth = barWidth;
        t.poffset = offsetFromCenter;
        t.bargroupwidth = barGroupWidth;
        t.bardelta = minDiff;
    }

    // stack bars that only differ by rounding
    sieve.binWidth = calcTraces[0][0].t.barwidth / 100;

    // if defined, apply trace width
    applyAttributes(sieve);

    // store the bar center in each calcdata item
    setBarCenterAndWidth(gd, pa, sieve);

    // update position axes
    updatePositionAxis(gd, pa, sieve, overlap);
}

function applyAttributes(sieve) {
    var calcTraces = sieve.traces;
    var i, j;

    for(i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];
        var calcTrace0 = calcTrace[0];
        var fullTrace = calcTrace0.trace;
        var t = calcTrace0.t;
        var offset = fullTrace._offset || fullTrace.offset;
        var initialPoffset = t.poffset;
        var newPoffset;

        if(isArrayOrTypedArray(offset)) {
            // if offset is an array, then clone it into t.poffset.
            newPoffset = Array.prototype.slice.call(offset, 0, calcTrace.length);

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
        } else if(offset !== undefined) {
            t.poffset = offset;
        }

        var width = fullTrace._width || fullTrace.width;
        var initialBarwidth = t.barwidth;

        if(isArrayOrTypedArray(width)) {
            // if width is an array, then clone it into t.barwidth.
            var newBarwidth = Array.prototype.slice.call(width, 0, calcTrace.length);

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
        } else if(width !== undefined) {
            t.barwidth = width;

            // if user didn't set offset,
            // then correct t.poffset to ensure bars remain centered
            if(offset === undefined) {
                t.poffset = initialPoffset + (initialBarwidth - width) / 2;
            }
        }
    }
}

function setBarCenterAndWidth(gd, pa, sieve) {
    var calcTraces = sieve.traces;
    var pLetter = getAxisLetter(pa);

    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];
        var t = calcTrace[0].t;
        var poffset = t.poffset;
        var poffsetIsArray = Array.isArray(poffset);
        var barwidth = t.barwidth;
        var barwidthIsArray = Array.isArray(barwidth);

        for(var j = 0; j < calcTrace.length; j++) {
            var calcBar = calcTrace[j];

            // store the actual bar width and position, for use by hover
            var width = calcBar.w = barwidthIsArray ? barwidth[j] : barwidth;
            calcBar[pLetter] = calcBar.p + (poffsetIsArray ? poffset[j] : poffset) + width / 2;
        }
    }
}

function updatePositionAxis(gd, pa, sieve, allowMinDtick) {
    var calcTraces = sieve.traces;
    var minDiff = sieve.minDiff;
    var vpad = minDiff / 2;

    Axes.minDtick(pa, sieve.minDiff, sieve.distinctPositions[0], allowMinDtick);

    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];
        var calcTrace0 = calcTrace[0];
        var fullTrace = calcTrace0.trace;
        var pts = [];
        var bar, l, r, j;

        for(j = 0; j < calcTrace.length; j++) {
            bar = calcTrace[j];
            l = bar.p - vpad;
            r = bar.p + vpad;
            pts.push(l, r);
        }

        if(fullTrace.width || fullTrace.offset) {
            var t = calcTrace0.t;
            var poffset = t.poffset;
            var barwidth = t.barwidth;
            var poffsetIsArray = Array.isArray(poffset);
            var barwidthIsArray = Array.isArray(barwidth);

            for(j = 0; j < calcTrace.length; j++) {
                bar = calcTrace[j];
                var calcBarOffset = poffsetIsArray ? poffset[j] : poffset;
                var calcBarWidth = barwidthIsArray ? barwidth[j] : barwidth;
                l = bar.p + calcBarOffset;
                r = l + calcBarWidth;
                pts.push(l, r);
            }
        }

        fullTrace._extremes[pa._id] = Axes.findExtremes(pa, pts, {padded: false});
    }
}

// store these bar bases and tops in calcdata
// and make sure the size axis includes zero,
// along with the bases and tops of each bar.
function setBaseAndTop(gd, sa, sieve) {
    var calcTraces = sieve.traces;
    var sLetter = getAxisLetter(sa);

    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];
        var fullTrace = calcTrace[0].trace;
        var pts = [];

        for(var j = 0; j < calcTrace.length; j++) {
            var bar = calcTrace[j];
            var barBase = bar.b;
            var barTop = barBase + bar.s;

            bar[sLetter] = barTop;
            pts.push(barTop);
            if(bar.hasB) pts.push(barBase);
        }

        fullTrace._extremes[sa._id] = Axes.findExtremes(sa, pts, {
            tozero: true,
            padded: true
        });
    }
}

function stackBars(gd, sa, sieve) {
    var fullLayout = gd._fullLayout;
    var barnorm = fullLayout.barnorm;
    var sLetter = getAxisLetter(sa);
    var calcTraces = sieve.traces;

    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];
        var fullTrace = calcTrace[0].trace;
        var pts = [];

        for(var j = 0; j < calcTrace.length; j++) {
            var bar = calcTrace[j];

            if(bar.s !== BADNUM) {
                // stack current bar and get previous sum
                var barBase = sieve.put(bar.p, bar.b + bar.s);
                var barTop = barBase + bar.b + bar.s;

                // store the bar base and top in each calcdata item
                bar.b = barBase;
                bar[sLetter] = barTop;

                if(!barnorm) {
                    pts.push(barTop);
                    if(bar.hasB) pts.push(barBase);
                }
            }
        }

        // if barnorm is set, let normalizeBars update the axis range
        if(!barnorm) {
            fullTrace._extremes[sa._id] = Axes.findExtremes(sa, pts, {
                tozero: true,
                padded: true
            });
        }
    }
}

function sieveBars(gd, sa, sieve) {
    var calcTraces = sieve.traces;

    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];

        for(var j = 0; j < calcTrace.length; j++) {
            var bar = calcTrace[j];

            if(bar.s !== BADNUM) sieve.put(bar.p, bar.b + bar.s);
        }
    }
}

// Note:
//
// normalizeBars requires that either sieveBars or stackBars has been
// previously invoked.
function normalizeBars(gd, sa, sieve) {
    var fullLayout = gd._fullLayout;
    var calcTraces = sieve.traces;
    var sLetter = getAxisLetter(sa);
    var sTop = fullLayout.barnorm === 'fraction' ? 1 : 100;
    var sTiny = sTop / 1e9; // in case of rounding error in sum
    var sMin = sa.l2c(sa.c2l(0));
    var sMax = fullLayout.barmode === 'stack' ? sTop : sMin;

    function needsPadding(v) {
        return (
            isNumeric(sa.c2l(v)) &&
            ((v < sMin - sTiny) || (v > sMax + sTiny) || !isNumeric(sMin))
        );
    }

    for(var i = 0; i < calcTraces.length; i++) {
        var calcTrace = calcTraces[i];
        var fullTrace = calcTrace[0].trace;
        var pts = [];
        var padded = false;

        for(var j = 0; j < calcTrace.length; j++) {
            var bar = calcTrace[j];

            if(bar.s !== BADNUM) {
                var scale = Math.abs(sTop / sieve.get(bar.p, bar.s));
                bar.b *= scale;
                bar.s *= scale;

                var barBase = bar.b;
                var barTop = barBase + bar.s;

                bar[sLetter] = barTop;
                pts.push(barTop);
                padded = padded || needsPadding(barTop);

                if(bar.hasB) {
                    pts.push(barBase);
                    padded = padded || needsPadding(barBase);
                }
            }
        }

        fullTrace._extremes[sa._id] = Axes.findExtremes(sa, pts, {
            tozero: true,
            padded: padded
        });
    }
}

// find the full position span of bars at each position
// for use by hover, to ensure labels move in if bars are
// narrower than the space they're in.
// run once per trace group (subplot & direction) and
// the same mapping is attached to all calcdata traces
function collectExtents(calcTraces, pa) {
    var pLetter = getAxisLetter(pa);
    var extents = {};
    var i, j, cd;

    var pMin = Infinity;
    var pMax = -Infinity;

    for(i = 0; i < calcTraces.length; i++) {
        cd = calcTraces[i];
        for(j = 0; j < cd.length; j++) {
            var p = cd[j].p;
            if(isNumeric(p)) {
                pMin = Math.min(pMin, p);
                pMax = Math.max(pMax, p);
            }
        }
    }

    // this is just for positioning of hover labels, and nobody will care if
    // the label is 1px too far out; so round positions to 1/10K in case
    // position values don't exactly match from trace to trace
    var roundFactor = 10000 / (pMax - pMin);
    var round = extents.round = function(p) {
        return String(Math.round(roundFactor * (p - pMin)));
    };

    for(i = 0; i < calcTraces.length; i++) {
        cd = calcTraces[i];
        cd[0].t.extents = extents;

        var poffset = cd[0].t.poffset;
        var poffsetIsArray = Array.isArray(poffset);

        for(j = 0; j < cd.length; j++) {
            var di = cd[j];
            var p0 = di[pLetter] - di.w / 2;

            if(isNumeric(p0)) {
                var p1 = di[pLetter] + di.w / 2;
                var pVal = round(di.p);
                if(extents[pVal]) {
                    extents[pVal] = [Math.min(p0, extents[pVal][0]), Math.max(p1, extents[pVal][1])];
                } else {
                    extents[pVal] = [p0, p1];
                }
            }

            di.p0 = di.p + (poffsetIsArray ? poffset[j] : poffset);
            di.p1 = di.p0 + di.w;
            di.s0 = di.b;
            di.s1 = di.s0 + di.s;
        }
    }
}

function getAxisLetter(ax) {
    return ax._id.charAt(0);
}

module.exports = {
    crossTraceCalc: crossTraceCalc,
    setGroupPositions: setGroupPositions
};
