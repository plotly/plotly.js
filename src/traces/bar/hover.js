'use strict';

var Fx = require('../../components/fx');
var Registry = require('../../registry');
var Color = require('../../components/color');

var fillText = require('../../lib').fillText;
var getLineWidth = require('./helpers').getLineWidth;
var hoverLabelText = require('../../plots/cartesian/axes').hoverLabelText;
var BADNUM = require('../../constants/numerical').BADNUM;

function hoverPoints(pointData, xval, yval, hovermode, opts) {
    var barPointData = hoverOnBars(pointData, xval, yval, hovermode, opts);

    if(barPointData) {
        var cd = barPointData.cd;
        var trace = cd[0].trace;
        var di = cd[barPointData.index];

        barPointData.color = getTraceColor(trace, di);
        Registry.getComponentMethod('errorbars', 'hoverInfo')(di, trace, barPointData);

        return [barPointData];
    }
}

function hoverOnBars(pointData, xval, yval, hovermode, opts) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var t = cd[0].t;
    var isClosest = (hovermode === 'closest');
    var isWaterfall = (trace.type === 'waterfall');
    var maxHoverDistance = pointData.maxHoverDistance;
    var maxSpikeDistance = pointData.maxSpikeDistance;

    var posVal, sizeVal, posLetter, sizeLetter, dx, dy, pRangeCalc;

    if(trace.orientation === 'h') {
        posVal = yval;
        sizeVal = xval;
        posLetter = 'y';
        sizeLetter = 'x';
        dx = sizeFn;
        dy = positionFn;
    } else {
        posVal = xval;
        sizeVal = yval;
        posLetter = 'x';
        sizeLetter = 'y';
        dy = sizeFn;
        dx = positionFn;
    }

    var period = trace[posLetter + 'period'];
    var isClosestOrPeriod = isClosest || period;

    function thisBarMinPos(di) { return thisBarExtPos(di, -1); }
    function thisBarMaxPos(di) { return thisBarExtPos(di, 1); }

    function thisBarExtPos(di, sgn) {
        var w = di.w;

        return di[posLetter] + sgn * w / 2;
    }

    function periodLength(di) {
        return di[posLetter + 'End'] - di[posLetter + 'Start'];
    }

    var minPos = isClosest ?
        thisBarMinPos : period ?
        function(di) {
            return di.p - periodLength(di) / 2;
        } :
        function(di) {
            /*
             * In compare mode, accept a bar if you're on it *or* its group.
             * Nearly always it's the group that matters, but in case the bar
             * was explicitly set wider than its group we'd better accept the
             * whole bar.
             *
             * use `bardelta` instead of `bargroupwidth` so we accept hover
             * in the gap. That way hover doesn't flash on and off as you
             * mouse over the plot in compare modes.
             * In 'closest' mode though the flashing seems inevitable,
             * without far more complex logic
             */
            return Math.min(thisBarMinPos(di), di.p - t.bardelta / 2);
        };

    var maxPos = isClosest ?
        thisBarMaxPos : period ?
        function(di) {
            return di.p + periodLength(di) / 2;
        } :
        function(di) {
            return Math.max(thisBarMaxPos(di), di.p + t.bardelta / 2);
        };

    function inbox(_minPos, _maxPos, maxDistance) {
        if(opts.finiteRange) maxDistance = 0;

        // add a little to the pseudo-distance for wider bars, so that like scatter,
        // if you are over two overlapping bars, the narrower one wins.
        return Fx.inbox(_minPos - posVal, _maxPos - posVal,
            maxDistance + Math.min(1, Math.abs(_maxPos - _minPos) / pRangeCalc) - 1);
    }

    function positionFn(di) {
        return inbox(minPos(di), maxPos(di), maxHoverDistance);
    }

    function thisBarPositionFn(di) {
        return inbox(thisBarMinPos(di), thisBarMaxPos(di), maxSpikeDistance);
    }

    function getSize(di) {
        var s = di[sizeLetter];

        if(isWaterfall) {
            var rawS = Math.abs(di.rawS) || 0;
            if(sizeVal > 0) {
                s += rawS;
            } else if(sizeVal < 0) {
                s -= rawS;
            }
        }

        return s;
    }

    function sizeFn(di) {
        var v = sizeVal;
        var b = di.b;
        var s = getSize(di);

        // add a gradient so hovering near the end of a
        // bar makes it a little closer match
        return Fx.inbox(b - v, s - v, maxHoverDistance + (s - v) / (s - b) - 1);
    }

    function thisBarSizeFn(di) {
        var v = sizeVal;
        var b = di.b;
        var s = getSize(di);

        // add a gradient so hovering near the end of a
        // bar makes it a little closer match
        return Fx.inbox(b - v, s - v, maxSpikeDistance + (s - v) / (s - b) - 1);
    }

    var pa = pointData[posLetter + 'a'];
    var sa = pointData[sizeLetter + 'a'];

    pRangeCalc = Math.abs(pa.r2c(pa.range[1]) - pa.r2c(pa.range[0]));

    function dxy(di) { return (dx(di) + dy(di)) / 2; }
    var distfn = Fx.getDistanceFunction(hovermode, dx, dy, dxy);
    Fx.getClosest(cd, distfn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index === false) return;

    // skip points inside axis rangebreaks
    if(cd[pointData.index].p === BADNUM) return;

    // if we get here and we're not in 'closest' mode, push min/max pos back
    // onto the group - even though that means occasionally the mouse will be
    // over the hover label.
    if(!isClosestOrPeriod) {
        minPos = function(di) {
            return Math.min(thisBarMinPos(di), di.p - t.bargroupwidth / 2);
        };
        maxPos = function(di) {
            return Math.max(thisBarMaxPos(di), di.p + t.bargroupwidth / 2);
        };
    }

    // the closest data point
    var index = pointData.index;
    var di = cd[index];

    var size = (trace.base) ? di.b + di.s : di.s;
    pointData[sizeLetter + '0'] = pointData[sizeLetter + '1'] = sa.c2p(di[sizeLetter], true);
    pointData[sizeLetter + 'LabelVal'] = size;

    var extent = t.extents[t.extents.round(di.p)];
    pointData[posLetter + '0'] = pa.c2p(isClosest ? minPos(di) : extent[0], true);
    pointData[posLetter + '1'] = pa.c2p(isClosest ? maxPos(di) : extent[1], true);

    var hasPeriod = di.orig_p !== undefined;
    pointData[posLetter + 'LabelVal'] = hasPeriod ? di.orig_p : di.p;

    pointData.labelLabel = hoverLabelText(pa, pointData[posLetter + 'LabelVal'], trace[posLetter + 'hoverformat']);
    pointData.valueLabel = hoverLabelText(sa, pointData[sizeLetter + 'LabelVal'], trace[sizeLetter + 'hoverformat']);
    pointData.baseLabel = hoverLabelText(sa, di.b, trace[sizeLetter + 'hoverformat']);

    // spikelines always want "closest" distance regardless of hovermode
    pointData.spikeDistance = (thisBarSizeFn(di) + thisBarPositionFn(di)) / 2;
    // they also want to point to the data value, regardless of where the label goes
    // in case of bars shifted within groups
    pointData[posLetter + 'Spike'] = pa.c2p(di.p, true);

    fillText(di, trace, pointData);
    pointData.hovertemplate = trace.hovertemplate;

    return pointData;
}

function getTraceColor(trace, di) {
    var mc = di.mcc || trace.marker.color;
    var mlc = di.mlcc || trace.marker.line.color;
    var mlw = getLineWidth(trace, di);

    if(Color.opacity(mc)) return mc;
    else if(Color.opacity(mlc) && mlw) return mlc;
}

module.exports = {
    hoverPoints: hoverPoints,
    hoverOnBars: hoverOnBars,
    getTraceColor: getTraceColor
};
