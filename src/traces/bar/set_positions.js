/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Plots = require('../../plots/plots');
var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');

/*
 * Bar chart stacking/grouping positioning and autoscaling calculations
 * for each direction separately calculate the ranges and positions
 * note that this handles histograms too
 * now doing this one subplot at a time
 */

module.exports = function setPositions(gd, plotinfo) {
    var fullLayout = gd._fullLayout,
        xa = plotinfo.x(),
        ya = plotinfo.y(),
        i, j;

    ['v', 'h'].forEach(function(dir) {
        var bl = [],
            pLetter = {v: 'x', h: 'y'}[dir],
            sLetter = {v: 'y', h: 'x'}[dir],
            pa = plotinfo[pLetter](),
            sa = plotinfo[sLetter]();

        gd._fullData.forEach(function(trace, i) {
            if(trace.visible === true &&
                    Plots.traceIs(trace, 'bar') &&
                    trace.orientation === dir &&
                    trace.xaxis === xa._id &&
                    trace.yaxis === ya._id) {
                bl.push(i);
            }
        });

        if(!bl.length) return;

        // bar position offset and width calculation
        // bl1 is a list of traces (in calcdata) to look at together
        // to find the maximum size bars that won't overlap
        // for stacked or grouped bars, this is all vertical or horizontal
        // bars for overlaid bars, call this individually on each trace.
        function barposition(bl1) {
            // find the min. difference between any points
            // in any traces in bl1
            var pvals = [];
            bl1.forEach(function(i) {
                gd.calcdata[i].forEach(function(v) { pvals.push(v.p); });
            });
            var dv = Lib.distinctVals(pvals),
                pv2 = dv.vals,
                barDiff = dv.minDiff;

            // check if all the traces have only independent positions
            // if so, let them have full width even if mode is group
            var overlap = false,
                comparelist = [];

            if(fullLayout.barmode === 'group') {
                bl1.forEach(function(i) {
                    if(overlap) return;
                    gd.calcdata[i].forEach(function(v) {
                        if(overlap) return;
                        comparelist.forEach(function(cp) {
                            if(Math.abs(v.p - cp) < barDiff) overlap = true;
                        });
                    });
                    if(overlap) return;
                    gd.calcdata[i].forEach(function(v) {
                        comparelist.push(v.p);
                    });
                });
            }

            // check forced minimum dtick
            Axes.minDtick(pa, barDiff, pv2[0], overlap);

            // position axis autorange - always tight fitting
            Axes.expand(pa, pv2, {vpad: barDiff / 2});

            // bar widths and position offsets
            barDiff *= 1 - fullLayout.bargap;
            if(overlap) barDiff /= bl.length;

            var barCenter;
            function setBarCenter(v) { v[pLetter] = v.p + barCenter; }

            for(var i = 0; i < bl1.length; i++) {
                var t = gd.calcdata[bl1[i]][0].t;
                t.barwidth = barDiff * (1 - fullLayout.bargroupgap);
                t.poffset = ((overlap ? (2 * i + 1 - bl1.length) * barDiff : 0) -
                    t.barwidth) / 2;
                t.dbar = dv.minDiff;

                // store the bar center in each calcdata item
                barCenter = t.poffset + t.barwidth / 2;
                gd.calcdata[bl1[i]].forEach(setBarCenter);
            }
        }

        if(fullLayout.barmode === 'overlay') {
            bl.forEach(function(bli) { barposition([bli]); });
        }
        else barposition(bl);

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
                sumround = gd.calcdata[bl[0]][0].t.barwidth / 100,
                sv = 0,
                padded = true,
                barEnd,
                ti,
                scale;

            for(i = 0; i < bl.length; i++) { // trace index
                ti = gd.calcdata[bl[i]];
                for(j = 0; j < ti.length; j++) {
                    sv = Math.round(ti[j].p / sumround);
                    // store the negative sum value for p at the same key, with sign flipped
                    if(relative && ti[j].s < 0) sv = -sv;
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
                padded = false;
                var top = norm === 'fraction' ? 1 : 100,
                    relAndNegative = false,
                    tiny = top / 1e9; // in case of rounding error in sum
                sMin = 0;
                sMax = stack ? top : 0;
                for(i = 0; i < bl.length; i++) { // trace index
                    ti = gd.calcdata[bl[i]];
                    for(j = 0; j < ti.length; j++) {
                        relAndNegative = relative && ti[j].s < 0;
                        sv = Math.round(ti[j].p / sumround);
                        if(relAndNegative) sv = -sv;  // locate negative sum amount for this p val
                        scale = top / sums[sv];
                        if(relAndNegative) scale *= -1; // preserve sign if negative
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

            for(i = 0; i < bl.length; i++) {
                Axes.expand(sa, gd.calcdata[bl[i]].map(fs),
                    {tozero: true, padded: true});
            }
        }
    });
};
