'use strict';

var Lib = require('../../lib');
var Fx = require('../../components/fx');
var Registry = require('../../registry');

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var xpx = xa.c2p(xval);
    var ypx = ya.c2p(yval);

    // Find the closest arrow base point to the hover point
    var minDistance = Infinity;
    var closestPoint = null;
    var closestIndex = -1;

    // Each cd[i] is a calcdata point object with x/y
    for(var i = 0; i < cd.length; i++) {
        var cdi = cd[i];
        if(cdi.x === undefined || cdi.y === undefined) continue;

        var px = xa.c2p(cdi.x);
        var py = ya.c2p(cdi.y);

        var distance = Math.sqrt((xpx - px) * (xpx - px) + (ypx - py) * (ypx - py));

        if(distance < minDistance) {
            minDistance = distance;
            closestPoint = cdi;
            closestIndex = i;
        }
    }

    var maxHoverDist = pointData.distance === Infinity ? Infinity : (trace.hoverdistance || 20);
    if(!closestPoint || minDistance > maxHoverDist) return;

    // Create hover point data with proper label values and spikeline support
    var hoverPoint = {
        x: closestPoint.x,
        y: closestPoint.y,
        u: trace.u ? trace.u[closestIndex] : undefined,
        v: trace.v ? trace.v[closestIndex] : undefined,
        text: Array.isArray(trace.text) ? trace.text[closestIndex] : trace.text,
        name: trace.name || '',
        trace: trace,
        index: closestIndex,
        // Label values for formatting
        xLabelVal: closestPoint.x,
        yLabelVal: closestPoint.y,
        uLabelVal: trace.u ? trace.u[closestIndex] : undefined,
        vLabelVal: trace.v ? trace.v[closestIndex] : undefined,
        // Spikeline support
        xa: pointData.xa,
        ya: pointData.ya,
        x0: closestPoint.x,
        x1: closestPoint.x,
        y0: closestPoint.y,
        y1: closestPoint.y,
        distance: minDistance,
        spikeDistance: minDistance,
        curveNumber: trace.index,
        color: trace.line ? trace.line.color : 'blue'
    };

    // Set hover text
    var hovertext = trace.hovertext || trace.text;
    if(hovertext && hovertext[closestIndex]) {
        hoverPoint.hovertext = hovertext[closestIndex];
    }

    return [hoverPoint];
};