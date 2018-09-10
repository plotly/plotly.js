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
var Fx = require('../../components/fx');
var Color = require('../../components/color');
var fillHoverText = require('../scatter/fill_hover_text');

function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var hoveron = trace.hoveron;
    var closeBoxData = [];
    var closePtData;

    if(hoveron.indexOf('boxes') !== -1) {
        closeBoxData = closeBoxData.concat(hoverOnBoxes(pointData, xval, yval, hovermode));
    }

    if(hoveron.indexOf('points') !== -1) {
        closePtData = hoverOnPoints(pointData, xval, yval);
    }

    // If there's a point in range and hoveron has points, show the best single point only.
    // If hoveron has boxes and there's no point in range (or hoveron doesn't have points), show the box stats.
    if(hovermode === 'closest') {
        if(closePtData) return [closePtData];
        return closeBoxData;
    }

    // Otherwise in compare mode, allow a point AND the box stats to be labeled
    // If there are multiple boxes in range (ie boxmode = 'overlay') we'll see stats for all of them.
    if(closePtData) {
        closeBoxData.push(closePtData);
        return closeBoxData;
    }
    return closeBoxData;
}

function hoverOnBoxes(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var trace = cd[0].trace;
    var t = cd[0].t;
    var isViolin = trace.type === 'violin';
    var closeBoxData = [];

    var pLetter, vLetter, pAxis, vAxis, vVal, pVal, dx, dy, dPos,
        hoverPseudoDistance, spikePseudoDistance;

    var boxDelta = t.bdPos;
    var posAcceptance = t.wHover;
    var shiftPos = function(di) { return di.pos + t.bPos - pVal; };

    if(isViolin && trace.side !== 'both') {
        if(trace.side === 'positive') {
            dPos = function(di) {
                var pos = shiftPos(di);
                return Fx.inbox(pos, pos + posAcceptance, hoverPseudoDistance);
            };
        }
        if(trace.side === 'negative') {
            dPos = function(di) {
                var pos = shiftPos(di);
                return Fx.inbox(pos - posAcceptance, pos, hoverPseudoDistance);
            };
        }
    } else {
        dPos = function(di) {
            var pos = shiftPos(di);
            return Fx.inbox(pos - posAcceptance, pos + posAcceptance, hoverPseudoDistance);
        };
    }

    var dVal;

    if(isViolin) {
        dVal = function(di) {
            return Fx.inbox(di.span[0] - vVal, di.span[1] - vVal, hoverPseudoDistance);
        };
    } else {
        dVal = function(di) {
            return Fx.inbox(di.min - vVal, di.max - vVal, hoverPseudoDistance);
        };
    }

    if(trace.orientation === 'h') {
        vVal = xval;
        pVal = yval;
        dx = dVal;
        dy = dPos;
        pLetter = 'y';
        pAxis = ya;
        vLetter = 'x';
        vAxis = xa;
    } else {
        vVal = yval;
        pVal = xval;
        dx = dPos;
        dy = dVal;
        pLetter = 'x';
        pAxis = xa;
        vLetter = 'y';
        vAxis = ya;
    }

    // if two boxes are overlaying, let the narrowest one win
    var pseudoDistance = Math.min(1, boxDelta / Math.abs(pAxis.r2c(pAxis.range[1]) - pAxis.r2c(pAxis.range[0])));
    hoverPseudoDistance = pointData.maxHoverDistance - pseudoDistance;
    spikePseudoDistance = pointData.maxSpikeDistance - pseudoDistance;

    function dxy(di) { return (dx(di) + dy(di)) / 2; }
    var distfn = Fx.getDistanceFunction(hovermode, dx, dy, dxy);
    Fx.getClosest(cd, distfn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    // and create the item(s) in closedata for this point
    if(pointData.index === false) return [];

    var di = cd[pointData.index];
    var lc = trace.line.color;
    var mc = (trace.marker || {}).color;

    if(Color.opacity(lc) && trace.line.width) pointData.color = lc;
    else if(Color.opacity(mc) && trace.boxpoints) pointData.color = mc;
    else pointData.color = trace.fillcolor;

    pointData[pLetter + '0'] = pAxis.c2p(di.pos + t.bPos - boxDelta, true);
    pointData[pLetter + '1'] = pAxis.c2p(di.pos + t.bPos + boxDelta, true);

    pointData[pLetter + 'LabelVal'] = di.pos;

    var spikePosAttr = pLetter + 'Spike';
    pointData.spikeDistance = dxy(di) * spikePseudoDistance / hoverPseudoDistance;
    pointData[spikePosAttr] = pAxis.c2p(di.pos, true);

    // box plots: each "point" gets many labels
    var usedVals = {};
    var attrs = ['med', 'min', 'q1', 'q3', 'max'];

    if(trace.boxmean || (trace.meanline || {}).visible) {
        attrs.push('mean');
    }
    if(trace.boxpoints || trace.points) {
        attrs.push('lf', 'uf');
    }

    for(var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];

        if(!(attr in di) || (di[attr] in usedVals)) continue;
        usedVals[di[attr]] = true;

        // copy out to a new object for each value to label
        var val = di[attr];
        var valPx = vAxis.c2p(val, true);
        var pointData2 = Lib.extendFlat({}, pointData);

        pointData2[vLetter + '0'] = pointData2[vLetter + '1'] = valPx;
        pointData2[vLetter + 'LabelVal'] = val;
        pointData2[vLetter + 'Label'] = (t.labels ? t.labels[attr] + ' ' : '') + Axes.hoverLabelText(vAxis, val);

        if(attr === 'mean' && ('sd' in di) && trace.boxmean === 'sd') {
            pointData2[vLetter + 'err'] = di.sd;
        }
        // only keep name and spikes on the first item (median)
        pointData.name = '';
        pointData.spikeDistance = undefined;
        pointData[spikePosAttr] = undefined;

        closeBoxData.push(pointData2);
    }

    return closeBoxData;
}

function hoverOnPoints(pointData, xval, yval) {
    var cd = pointData.cd;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var trace = cd[0].trace;
    var xPx = xa.c2p(xval);
    var yPx = ya.c2p(yval);
    var closePtData;

    var dx = function(di) {
        var rad = Math.max(3, di.mrc || 0);
        return Math.max(Math.abs(xa.c2p(di.x) - xPx) - rad, 1 - 3 / rad);
    };
    var dy = function(di) {
        var rad = Math.max(3, di.mrc || 0);
        return Math.max(Math.abs(ya.c2p(di.y) - yPx) - rad, 1 - 3 / rad);
    };
    var distfn = Fx.quadrature(dx, dy);

    // show one point per trace
    var ijClosest = false;
    var di, pt;

    for(var i = 0; i < cd.length; i++) {
        di = cd[i];

        for(var j = 0; j < (di.pts || []).length; j++) {
            pt = di.pts[j];

            var newDistance = distfn(pt);
            if(newDistance <= pointData.distance) {
                pointData.distance = newDistance;
                ijClosest = [i, j];
            }
        }
    }

    if(!ijClosest) return false;

    di = cd[ijClosest[0]];
    pt = di.pts[ijClosest[1]];

    var xc = xa.c2p(pt.x, true);
    var yc = ya.c2p(pt.y, true);
    var rad = pt.mrc || 1;

    closePtData = Lib.extendFlat({}, pointData, {
        // corresponds to index in x/y input data array
        index: pt.i,
        color: (trace.marker || {}).color,
        name: trace.name,
        x0: xc - rad,
        x1: xc + rad,
        xLabelVal: pt.x,
        y0: yc - rad,
        y1: yc + rad,
        yLabelVal: pt.y,
        spikeDistance: pointData.distance
    });
    var pLetter = trace.orientation === 'h' ? 'y' : 'x';
    var pa = trace.orientation === 'h' ? ya : xa;
    closePtData[pLetter + 'Spike'] = pa.c2p(di.pos, true);
    fillHoverText(pt, trace, closePtData);

    return closePtData;
}

module.exports = {
    hoverPoints: hoverPoints,
    hoverOnBoxes: hoverOnBoxes,
    hoverOnPoints: hoverOnPoints
};
