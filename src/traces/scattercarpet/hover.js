/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var scatterHover = require('../scatter/hover');
var Axes = require('../../plots/cartesian/axes');


module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var scatterPointData = scatterHover(pointData, xval, yval, hovermode);
    if(!scatterPointData || scatterPointData[0].index === false) return;

    var newPointData = scatterPointData[0];

    // if hovering on a fill, we don't show any point data so the label is
    // unchanged from what scatter gives us - except that it needs to
    // be constrained to the trianglular plot area, not just the rectangular
    // area defined by the synthetic x and y axes
    // TODO: in some cases the vertical middle of the shape is not within
    // the triangular viewport at all, so the label can become disconnected
    // from the shape entirely. But calculating what portion of the shape
    // is actually visible, as constrained by the diagonal axis lines, is not
    // so easy and anyway we lost the information we would have needed to do
    // this inside scatterHover.
    if(newPointData.index === undefined) {
        var yFracUp = 1 - (newPointData.y0 / pointData.ya._length),
            xLen = pointData.xa._length,
            xMin = xLen * yFracUp / 2,
            xMax = xLen - xMin;
        newPointData.x0 = Math.max(Math.min(newPointData.x0, xMax), xMin);
        newPointData.x1 = Math.max(Math.min(newPointData.x1, xMax), xMin);
        return scatterPointData;
    }

    var cdi = newPointData.cd[newPointData.index];

    newPointData.a = cdi.a;
    newPointData.b = cdi.b;
    newPointData.c = cdi.c;

    newPointData.xLabelVal = undefined;
    newPointData.yLabelVal = undefined;
    // TODO: nice formatting, and label by axis title, for a, b, and c?

    var trace = newPointData.trace,
        ternary = trace._ternary,
        hoverinfo = trace.hoverinfo.split('+'),
        text = [];

    function textPart(ax, val) {
        text.push(ax._hovertitle + ': ' + Axes.tickText(ax, val, 'hover').text);
    }

    if(hoverinfo.indexOf('all') !== -1) hoverinfo = ['a', 'b', 'c'];
    if(hoverinfo.indexOf('a') !== -1) textPart(ternary.aaxis, cdi.a);
    if(hoverinfo.indexOf('b') !== -1) textPart(ternary.baxis, cdi.b);
    if(hoverinfo.indexOf('c') !== -1) textPart(ternary.caxis, cdi.c);

    newPointData.extraText = text.join('<br>');

    return scatterPointData;
};
