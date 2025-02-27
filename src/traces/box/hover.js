'use strict';

var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');
var Fx = require('../../components/fx');
var Color = require('../../components/color');
var fillText = Lib.fillText;

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

    var pLetter, vLetter, pAxis, vAxis, vVal, pVal, dx, dy, dPos,
        hoverPseudoDistance, spikePseudoDistance;

    var boxDelta = t.bdPos;
    var boxDeltaPos, boxDeltaNeg;
    var posAcceptance = t.wHover;
    var shiftPos = function(di) { return pAxis.c2l(di.pos) + t.bPos - pAxis.c2l(pVal); };

    if(isViolin && trace.side !== 'both') {
        if(trace.side === 'positive') {
            dPos = function(di) {
                var pos = shiftPos(di);
                return Fx.inbox(pos, pos + posAcceptance, hoverPseudoDistance);
            };
            boxDeltaPos = boxDelta;
            boxDeltaNeg = 0;
        }
        if(trace.side === 'negative') {
            dPos = function(di) {
                var pos = shiftPos(di);
                return Fx.inbox(pos - posAcceptance, pos, hoverPseudoDistance);
            };
            boxDeltaPos = 0;
            boxDeltaNeg = boxDelta;
        }
    } else {
        dPos = function(di) {
            var pos = shiftPos(di);
            return Fx.inbox(pos - posAcceptance, pos + posAcceptance, hoverPseudoDistance);
        };
        boxDeltaPos = boxDeltaNeg = boxDelta;
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

    pointData[pLetter + '0'] = pAxis.c2p(di.pos + t.bPos - boxDeltaNeg, true);
    pointData[pLetter + '1'] = pAxis.c2p(di.pos + t.bPos + boxDeltaPos, true);

    pointData[pLetter + 'LabelVal'] = di.orig_p !== undefined ? di.orig_p : di.pos;

    var spikePosAttr = pLetter + 'Spike';
    pointData.spikeDistance = dxy(di) * spikePseudoDistance / hoverPseudoDistance;
    pointData[spikePosAttr] = pAxis.c2p(di.pos, true);

    var hasMean = trace.boxmean || (trace.sizemode === 'sd') || (trace.meanline || {}).visible;
    var hasFences = trace.boxpoints || trace.points;

    // labels with equal values (e.g. when min === q1) should still be presented in the order they have when they're unequal
    var attrs =
        (hasFences && hasMean) ? ['max', 'uf', 'q3', 'med', 'mean', 'q1', 'lf', 'min'] :
        (hasFences && !hasMean) ? ['max', 'uf', 'q3', 'med', 'q1', 'lf', 'min'] :
        (!hasFences && hasMean) ? ['max', 'q3', 'med', 'mean', 'q1', 'min'] :
        ['max', 'q3', 'med', 'q1', 'min'];

    var rev = vAxis.range[1] < vAxis.range[0];

    if(trace.orientation === (rev ? 'v' : 'h')) {
        attrs.reverse();
    }

    var spikeDistance = pointData.spikeDistance;
    var spikePosition = pointData[spikePosAttr];

    var closeBoxData = [];
    for(var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];

        if(!(attr in di)) continue;

        // copy out to a new object for each value to label
        var val = di[attr];
        var valPx = vAxis.c2p(val, true);
        var pointData2 = Lib.extendFlat({}, pointData);

        pointData2.attr = attr;
        pointData2[vLetter + '0'] = pointData2[vLetter + '1'] = valPx;
        pointData2[vLetter + 'LabelVal'] = val;
        pointData2[vLetter + 'Label'] = (t.labels ? t.labels[attr] + ' ' : '') + Axes.hoverLabelText(vAxis, val, trace[vLetter + 'hoverformat']);

        // Note: introduced to be able to distinguish a
        // clicked point from a box during click-to-select
        pointData2.hoverOnBox = true;

        if(attr === 'mean' && ('sd' in di) && ((trace.boxmean === 'sd') || (trace.sizemode === 'sd'))) {
            pointData2[vLetter + 'err'] = di.sd;
        }

        // no hovertemplate support yet
        pointData2.hovertemplate = false;

        closeBoxData.push(pointData2);
    }

    // only keep name and spikes on the median
    pointData.name = '';
    pointData.spikeDistance = undefined;
    pointData[spikePosAttr] = undefined;
    for(var k = 0; k < closeBoxData.length; k++) {
        if(closeBoxData[k].attr !== 'med') {
            closeBoxData[k].name = '';
            closeBoxData[k].spikeDistance = undefined;
            closeBoxData[k][spikePosAttr] = undefined;
        } else {
            closeBoxData[k].spikeDistance = spikeDistance;
            closeBoxData[k][spikePosAttr] = spikePosition;
        }
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
        y0: yc - rad,
        y1: yc + rad,
        spikeDistance: pointData.distance,
        hovertemplate: trace.hovertemplate
    });

    var origPos = di.orig_p;
    var pos = origPos !== undefined ? origPos : di.pos;
    var pa;
    if(trace.orientation === 'h') {
        pa = ya;
        closePtData.xLabelVal = pt.x;
        closePtData.yLabelVal = pos;
    } else {
        pa = xa;
        closePtData.xLabelVal = pos;
        closePtData.yLabelVal = pt.y;
    }

    var pLetter = pa._id.charAt(0);
    closePtData[pLetter + 'Spike'] = pa.c2p(di.pos, true);

    fillText(pt, trace, closePtData);

    return closePtData;
}

module.exports = {
    hoverPoints: hoverPoints,
    hoverOnBoxes: hoverOnBoxes,
    hoverOnPoints: hoverOnPoints
};
