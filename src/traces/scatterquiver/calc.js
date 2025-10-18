'use strict';

var Lib = require('../../lib');

/**
 * Calculate arrow positions and orientations for quiver plot
 * Ported from plotly.py _quiver.py
 */
function calculateArrows(x, y, u, v, scale, arrowScale, angle, scaleRatio) {
    var len = x.length;
    var barbX = [];
    var barbY = [];
    var arrowX = [];
    var arrowY = [];

    // Scale u and v to avoid overlap
    var scaledU = u.map(function(val) { return val * scale * (scaleRatio || 1); });
    var scaledV = v.map(function(val) { return val * scale; });

    // Calculate arrow endpoints
    var endX = x.map(function(val, i) { return val + scaledU[i]; });
    var endY = y.map(function(val, i) { return val + scaledV[i]; });

    // Create barb lines (main arrow shafts)
    for(var i = 0; i < len; i++) {
        barbX.push(x[i], endX[i], null);
        barbY.push(y[i], endY[i], null);
    }

    // Calculate arrow heads
    for(var i = 0; i < len; i++) {
        var dx = endX[i] - x[i];
        var dy = endY[i] - y[i];

        // Calculate barb length
        var barbLen = Math.sqrt(dx * dx / (scaleRatio || 1) + dy * dy);

        // Calculate arrow head length
        var arrowLen = barbLen * arrowScale;

        // Calculate barb angle
        var barbAng = Math.atan2(dy, dx / (scaleRatio || 1));

        // Calculate arrow head angles
        var ang1 = barbAng + angle;
        var ang2 = barbAng - angle;

        // Calculate arrow head points
        var point1X = endX[i] - arrowLen * Math.cos(ang1) * (scaleRatio || 1);
        var point1Y = endY[i] - arrowLen * Math.sin(ang1);
        var point2X = endX[i] - arrowLen * Math.cos(ang2) * (scaleRatio || 1);
        var point2Y = endY[i] - arrowLen * Math.sin(ang2);

        // Add arrow head lines
        arrowX.push(point1X, endX[i], point2X, null);
        arrowY.push(point1Y, endY[i], point2Y, null);
    }

    return {
        barbX: barbX,
        barbY: barbY,
        arrowX: arrowX,
        arrowY: arrowY
    };
}

/**
 * Main calculation function for scatterquiver trace
 */
module.exports = function calc(gd, trace) {
    var x = trace.x;
    var y = trace.y;
    var u = trace.u;
    var v = trace.v;
    var scale = trace.scale;
    var arrowScale = trace.arrow_scale;
    var angle = trace.angle;
    var scaleRatio = trace.scaleratio;

    // Calculate arrow positions
    var arrowData = calculateArrows(x, y, u, v, scale, arrowScale, angle, scaleRatio);

    // Create calcdata - one complete arrow per entry
    var calcdata = [];
    var len = x.length;
    
    for(var i = 0; i < len; i++) {
        // Calculate arrow components
        var dx = u[i] * scale * (scaleRatio || 1);
        var dy = v[i] * scale;
        var barbLen = Math.sqrt(dx * dx / (scaleRatio || 1) + dy * dy);
        var arrowLen = barbLen * arrowScale;
        var barbAng = Math.atan2(dy, dx / (scaleRatio || 1));
        
        var ang1 = barbAng + angle;
        var ang2 = barbAng - angle;
        
        var endX = x[i] + dx;
        var endY = y[i] + dy;
        
        var point1X = endX - arrowLen * Math.cos(ang1) * (scaleRatio || 1);
        var point1Y = endY - arrowLen * Math.sin(ang1);
        var point2X = endX - arrowLen * Math.cos(ang2) * (scaleRatio || 1);
        var point2Y = endY - arrowLen * Math.sin(ang2);

        // Create complete arrow as one path: shaft + arrow head
        var arrowPath = [
            { x: x[i], y: y[i], i: i },                    // Start point
            { x: endX, y: endY, i: i },                   // End of shaft
            { x: point1X, y: point1Y, i: i },            // Arrow head point 1
            { x: endX, y: endY, i: i },                   // Back to end
            { x: point2X, y: point2Y, i: i }             // Arrow head point 2
        ];

        calcdata.push(arrowPath);
    }

    return calcdata;
};