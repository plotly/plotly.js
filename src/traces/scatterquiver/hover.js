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

    // Find the closest arrow to the hover point
    var minDistance = Infinity;
    var closestPoint = null;
    var closestIndex = -1;

    // Check each arrow segment
    for(var i = 0; i < cd.length; i++) {
        var segment = cd[i];
        if(segment.length < 2) continue;

        // Calculate distance to the start point of the arrow
        var x1 = xa.c2p(segment[0].x);
        var y1 = ya.c2p(segment[0].y);
        
        var distance = Math.sqrt((xpx - x1) * (xpx - x1) + (ypx - y1) * (ypx - y1));
        
        if(distance < minDistance) {
            minDistance = distance;
            closestPoint = segment[0]; // Use the start point for hover data
            closestIndex = i;
        }
    }

    if(!closestPoint || minDistance > (trace.hoverdistance || 20)) return;

    // Create hover point data with proper label values and spikeline support
    var hoverPoint = {
        x: closestPoint.x,
        y: closestPoint.y,
        u: trace.u[closestIndex],
        v: trace.v[closestIndex],
        text: trace.text ? trace.text[closestIndex] : '',
        name: trace.name || '',
        trace: trace,
        index: closestIndex,
        // Set label values for proper hover formatting
        xLabelVal: closestPoint.x,
        yLabelVal: closestPoint.y,
        uLabelVal: trace.u[closestIndex],
        vLabelVal: trace.v[closestIndex],
        // Add spikeline support
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