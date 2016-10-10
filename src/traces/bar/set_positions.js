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
var Lib = require('../../lib');

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

    var fullLayout = gd._fullLayout,
        pLetter = pa._id.charAt(0),
        sLetter = sa._id.charAt(0),
        i, j;

    if(fullLayout.barmode === 'overlay') {
        traces.forEach(function(trace) {
            setOffsetAndWidth(gd, pa, pLetter, [trace]);
        });
    }
    else setOffsetAndWidth(gd, pa, pLetter, traces);

    var stack = (fullLayout.barmode === 'stack'),
        relative = (fullLayout.barmode === 'relative'),
        norm = fullLayout.barnorm;

    // bar size range and stacking calculation
    if(stack || relative || norm) {
        // for stacked bars, we need to evaluate every step in every
        // stack, because negative bars mean the extremes could be
        // anywhere
        // also stores the base (b) of each bar in calcdata
        // so we don't have to redo this later
        var sMax = sa.l2c(sa.c2l(0)),
            sMin = sMax,
            sums = {},

            // make sure if p is different only by rounding,
            // we still stack
            sumround = traces[0][0].t.barwidth / 100,
            sv = 0,
            padded = true,
            barEnd,
            ti,
            scale;

        for(i = 0; i < traces.length; i++) { // trace index
            ti = traces[i];

            for(j = 0; j < ti.length; j++) {

                // skip over bars with no size,
                // so that we don't try to stack them
                if(!isNumeric(ti[j].s)) continue;

                sv = Math.round(ti[j].p / sumround);

                // store the negative sum value for p at the same key,
                // with sign flipped using string to ensure -0 !== 0.
                if(relative && ti[j].s < 0) sv = '-' + sv;

                var previousSum = sums[sv] || 0;
                if(stack || relative) ti[j].b = previousSum;
                barEnd = ti[j].b + ti[j].s;
                sums[sv] = previousSum + ti[j].s;

                // store the bar top in each calcdata item
                if(stack || relative) {
                    ti[j][sLetter] = barEnd;
                    if(!norm && isNumeric(sa.c2l(barEnd))) {
                        sMax = Math.max(sMax, barEnd);
                        sMin = Math.min(sMin, barEnd);
                    }
                }
            }
        }

        if(norm) {
            var top = norm === 'fraction' ? 1 : 100,
                relAndNegative = false,
                tiny = top / 1e9; // in case of rounding error in sum

            padded = false;
            sMin = 0;
            sMax = stack ? top : 0;

            for(i = 0; i < traces.length; i++) { // trace index
                ti = traces[i];

                for(j = 0; j < ti.length; j++) {
                    relAndNegative = (relative && ti[j].s < 0);

                    sv = Math.round(ti[j].p / sumround);

                    // locate negative sum amount for this p val
                    if(relAndNegative) sv = '-' + sv;

                    scale = top / sums[sv];

                    // preserve sign if negative
                    if(relAndNegative) scale *= -1;
                    ti[j].b *= scale;
                    ti[j].s *= scale;
                    barEnd = ti[j].b + ti[j].s;
                    ti[j][sLetter] = barEnd;

                    if(isNumeric(sa.c2l(barEnd))) {
                        if(barEnd < sMin - tiny) {
                            padded = true;
                            sMin = barEnd;
                        }
                        if(barEnd > sMax + tiny) {
                            padded = true;
                            sMax = barEnd;
                        }
                    }
                }
            }
        }

        Axes.expand(sa, [sMin, sMax], {tozero: true, padded: padded});
    }
    else {
        // for grouped or overlaid bars, just make sure zero is
        // included, along with the tops of each bar, and store
        // these bar tops in calcdata
        var fs = function(v) { v[sLetter] = v.s; return v.s; };

        for(i = 0; i < traces.length; i++) {
            Axes.expand(sa, traces[i].map(fs), {tozero: true, padded: true});
        }
    }
}


// bar position offset and width calculation
// traces is a list of traces (in calcdata) to look at together
// to find the maximum width bars that won't overlap
// for stacked or grouped bars, this is all vertical or horizontal
// bars for overlaid bars, call this individually on each trace.
function setOffsetAndWidth(gd, pa, pLetter, traces) {
    var fullLayout = gd._fullLayout,
        i, trace,
        j, bar;

    // make list of bar positions
    var positions = [];
    for(i = 0; i < traces.length; i++) {
        trace = traces[i];
        for(j = 0; j < trace.length; j++) {
            bar = trace[j];
            positions.push(bar.p);
        }
    }

    var dv = Lib.distinctVals(positions),
        distinctPositions = dv.vals,
        minDiff = dv.minDiff;

    // check if there are any overlapping positions;
    // if there aren't, let them have full width even if mode is group
    var overlap = false;
    if(fullLayout.barmode === 'group') {
        overlap = (positions.length !== distinctPositions.length);
    }

    // check forced minimum dtick
    Axes.minDtick(pa, minDiff, distinctPositions[0], overlap);

    // position axis autorange - always tight fitting
    Axes.expand(pa, distinctPositions, {vpad: minDiff / 2});

    // computer bar widths and position offsets
    var barWidth = minDiff * (1 - fullLayout.bargap);
    if(overlap) barWidth /= traces.length;

    var barWidthMinusGroupGap = barWidth * (1 - fullLayout.bargroupgap);

    for(i = 0; i < traces.length; i++) {
        trace = traces[i];

        // computer bar group center and bar offset
        var offsetFromCenter = (
                (overlap ? (2 * i + 1 - traces.length) * barWidth : 0) -
                barWidthMinusGroupGap
            ) / 2,
            barCenter = offsetFromCenter + barWidthMinusGroupGap / 2;

        // store bar width and offset for this trace
        var t = trace[0].t;
        t.barwidth = barWidthMinusGroupGap;
        t.poffset = offsetFromCenter;
        t.dbar = minDiff;

        // store the bar center in each calcdata item
        for(j = 0; j < trace.length; j++) {
            bar = trace[j];
            bar[pLetter] = bar.p + barCenter;
        }
    }
}
