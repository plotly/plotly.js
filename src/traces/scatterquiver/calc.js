'use strict';

var Lib = require('../../lib');

/**
 * Main calculation function for scatterquiver trace
 * Creates calcdata with arrow path data for each vector
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