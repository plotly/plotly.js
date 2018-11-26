/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');

var orientations = ['v', 'h'];

function crossTraceCalc(gd, plotinfo) {
    var calcdata = gd.calcdata;
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;

    for(var i = 0; i < orientations.length; i++) {
        var orientation = orientations[i];
        var posAxis = orientation === 'h' ? ya : xa;
        var boxList = [];

        // make list of boxes / candlesticks
        // For backward compatibility, candlesticks are treated as if they *are* box traces here
        for(var j = 0; j < calcdata.length; j++) {
            var cd = calcdata[j];
            var t = cd[0].t;
            var trace = cd[0].trace;

            if(trace.visible === true &&
                    (trace.type === 'box' || trace.type === 'candlestick') &&
                    !t.empty &&
                    (trace.orientation || 'v') === orientation &&
                    trace.xaxis === xa._id &&
                    trace.yaxis === ya._id
              ) {
                boxList.push(j);
            }
        }

        setPositionOffset('box', gd, boxList, posAxis);
    }
}

function setPositionOffset(traceType, gd, boxList, posAxis) {
    var calcdata = gd.calcdata;
    var fullLayout = gd._fullLayout;
    var axId = posAxis._id;
    var axLetter = axId.charAt(0);

    // N.B. reused in violin
    var numKey = traceType === 'violin' ? '_numViolins' : '_numBoxes';

    var i, j, calcTrace;
    var pointList = [];

    // make list of box points
    for(i = 0; i < boxList.length; i++) {
        calcTrace = calcdata[boxList[i]];
        for(j = 0; j < calcTrace.length; j++) {
            pointList.push(calcTrace[j].pos);
        }
    }

    if(!pointList.length) return;

    // box plots - update dPos based on multiple traces
    var boxdv = Lib.distinctVals(pointList);
    var dPos0 = boxdv.minDiff / 2;

    // if there's no duplication of x points,
    // disable 'group' mode by setting counter to 1
    if(pointList.length === boxdv.vals.length) {
        fullLayout[numKey] = 1;
    }

    // check for forced minimum dtick
    Axes.minDtick(posAxis, boxdv.minDiff, boxdv.vals[0], true);

    var num = fullLayout[numKey];
    var group = (fullLayout[traceType + 'mode'] === 'group' && num > 1);
    var groupFraction = 1 - fullLayout[traceType + 'gap'];
    var groupGapFraction = 1 - fullLayout[traceType + 'groupgap'];

    for(i = 0; i < boxList.length; i++) {
        calcTrace = calcdata[boxList[i]];

        var trace = calcTrace[0].trace;
        var t = calcTrace[0].t;
        var width = trace.width;
        var side = trace.side;
        var pointpos = trace.pointpos;

        // position coordinate delta
        var dPos;
        // box half width;
        var bdPos;
        // box center offset
        var bPos;
        // half-width within which to accept hover for this box/violin
        // always split the distance to the closest box/violin
        var wHover;

        if(width) {
            dPos = bdPos = wHover = width / 2;
            bPos = 0;
        } else {
            dPos = dPos0;
            bdPos = dPos * groupFraction * groupGapFraction / (group ? num : 1);
            bPos = group ? 2 * dPos * (-0.5 + (t.num + 0.5) / num) * groupFraction : 0;
            wHover = dPos * (group ? groupFraction / num : 1);
        }
        t.dPos = dPos;
        t.bPos = bPos;
        t.bdPos = bdPos;
        t.wHover = wHover;

        var edge = bPos + bdPos;
        // data-space padding
        var vpadplus = 0;
        var vpadminus = 0;
        // pixel-space padding
        var ppadplus;
        var ppadminus;

        if(side === 'positive') {
            vpadplus = edge;
            vpadminus = bPos;
        } else if(side === 'negative') {
            vpadplus = bPos;
            vpadminus = edge;
        } else {
            vpadplus = edge;
            vpadminus = edge;
        }

        if(trace.boxpoints || trace.points) {
            var jitter = trace.jitter;
            var ms = trace.marker.size / 2;

            if((pointpos + jitter) >= 0) {
                ppadplus = ms;
                var pp = bPos + bdPos * (pointpos + jitter);
                if(pp > vpadplus) vpadplus = pp;
            }
            if((pointpos - jitter) <= 0) {
                ppadminus = ms;
                var pm = -bPos - bdPos * (pointpos - jitter);
                if(pm > vpadminus) vpadminus = pm;
            }
        }

        // calcdata[i][j] are in ascending order
        var firstPos = calcTrace[0].pos;
        var lastPos = calcTrace[calcTrace.length - 1].pos;

        trace._extremes[axId] = Axes.findExtremes(posAxis, [firstPos, lastPos], {
            vpadminus: vpadminus,
            vpadplus: vpadplus,
            // N.B. SVG px-space positive/negative
            ppadminus: {x: ppadminus, y: ppadplus}[axLetter],
            ppadplus: {x: ppadplus, y: ppadminus}[axLetter],
            // add 5% of both sides
            padded: true
        });
    }
}

module.exports = {
    crossTraceCalc: crossTraceCalc,
    setPositionOffset: setPositionOffset
};
