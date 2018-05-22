/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var Fx = require('../../components/fx');
var Color = require('../../components/color');
var fillHoverText = require('../scatter/fill_hover_text');

var DIRSYMBOL = {
    increasing: '▲',
    decreasing: '▼'
};

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var trace = cd[0].trace;
    var t = cd[0].t;

    var type = trace.type;
    var minAttr = type === 'ohlc' ? 'l' : 'min';
    var maxAttr = type === 'ohlc' ? 'h' : 'max';

    // potentially shift xval for grouped candlesticks
    var centerShift = t.bPos || 0;
    var x0 = xval - centerShift;

    // ohlc and candlestick call displayHalfWidth different things...
    var displayHalfWidth = t.bdPos || t.tickLen;
    var hoverHalfWidth = t.wHover;

    // if two items are overlaying, let the narrowest one win
    var pseudoDistance = Math.min(1, displayHalfWidth / Math.abs(xa.r2c(xa.range[1]) - xa.r2c(xa.range[0])));
    var hoverPseudoDistance = pointData.maxHoverDistance - pseudoDistance;
    var spikePseudoDistance = pointData.maxSpikeDistance - pseudoDistance;

    function dx(di) {
        var pos = di.pos - x0;
        return Fx.inbox(pos - hoverHalfWidth, pos + hoverHalfWidth, hoverPseudoDistance);
    }

    function dy(di) {
        return Fx.inbox(di[minAttr] - yval, di[maxAttr] - yval, hoverPseudoDistance);
    }

    function dxy(di) { return (dx(di) + dy(di)) / 2; }
    var distfn = Fx.getDistanceFunction(hovermode, dx, dy, dxy);
    Fx.getClosest(cd, distfn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index === false) return [];

    // we don't make a calcdata point if we're missing any piece (x/o/h/l/c)
    // so we need to fix the index here to point to the data arrays
    var cdIndex = pointData.index;
    var di = cd[cdIndex];
    var i = pointData.index = di.i;

    var dir = di.dir;
    var container = trace[dir];
    var lc = container.line.color;

    if(Color.opacity(lc) && container.line.width) pointData.color = lc;
    else pointData.color = container.fillcolor;

    pointData.x0 = xa.c2p(di.pos + centerShift - displayHalfWidth, true);
    pointData.x1 = xa.c2p(di.pos + centerShift + displayHalfWidth, true);

    pointData.xLabelVal = di.pos;

    pointData.spikeDistance = dxy(di) * spikePseudoDistance / hoverPseudoDistance;
    pointData.xSpike = xa.c2p(di.pos, true);

    function getLabelLine(attr) {
        return t.labels[attr] + Axes.hoverLabelText(ya, trace[attr][i]);
    }

    var hoverinfo = trace.hoverinfo;
    var hoverParts = hoverinfo.split('+');
    var isAll = hoverinfo === 'all';
    var hasY = isAll || hoverParts.indexOf('y') !== -1;
    var hasText = isAll || hoverParts.indexOf('text') !== -1;

    var textParts = hasY ? [
        getLabelLine('open'),
        getLabelLine('high'),
        getLabelLine('low'),
        getLabelLine('close') + '  ' + DIRSYMBOL[dir]
    ] : [];
    if(hasText) fillHoverText(di, trace, textParts);

    // don't make .yLabelVal or .text, since we're managing hoverinfo
    // put it all in .extraText
    pointData.extraText = textParts.join('<br>');

    // this puts the label *and the spike* at the midpoint of the box, ie
    // halfway between open and close, not between high and low.
    pointData.y0 = pointData.y1 = ya.c2p(di.yc, true);

    return [pointData];
};
