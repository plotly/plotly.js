'use strict';

var Lib = require('../../lib');
var Fx = require('../../components/fx');
var getTraceColor = require('../scatter/get_trace_color');

// Returns the shortest pixel distance from point (px,py)
// to segment (ax,ay)-(bx,by)
function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy; // Length of segment (ax,ay)-(bx,by), squared
    if(!len2) {
        // Zero-length segment, so fall back to point-to-point distance
        return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
    }
    // Compute position of point on segment which is closest to (px,py) -> call it (cx, cy)
    var t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    // Compute distance from (px,py) to (cx,cy)
    return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
}

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var xpx = xa.c2p(xval);
    var ypx = ya.c2p(yval);

    // Check distance from the whole arrow body (base -> tip)
    // rather than only the (x,y) data position of the arrow
    var distfn = function(di) {
        if(di._px0 === undefined) return Infinity;
        return distToSegment(xpx, ypx, di._px0, di._py0, di._px1, di._py1);
    };

    Fx.getClosest(cd, distfn, pointData);

    // skip if we didn't find a close point
    if(pointData.index === false) return;

    // the closest data point
    var di = cd[pointData.index];
    var xc = xa.c2p(di.x, true);
    var yc = ya.c2p(di.y, true);

    // Compute distance from cursor to the base point (x,y) of the arrow
    var distToPoint = Math.sqrt((xpx - xc) * (xpx - xc) + (ypx - yc) * (ypx - yc));

    // now we're done using the whole `calcdata` array, replace the
    // index with the original index
    pointData.index = di.i;

    var u = trace.u ? trace.u[di.i] : 0;
    var v = trace.v ? trace.v[di.i] : 0;

    // Build extraText to show u and v values
    var extraText = 'u: ' + u + ', v: ' + v;

    Lib.extendFlat(pointData, {
        color: getTraceColor(trace, di),

        x0: xc - 3,
        x1: xc + 3,
        xLabelVal: di.x,

        y0: yc - 3,
        y1: yc + 3,
        yLabelVal: di.y,

        uLabelVal: u,
        vLabelVal: v,
        
        extraText: extraText,

        spikeDistance: distToPoint,
        hovertemplate: trace.hovertemplate
    });

    Lib.fillText(di, trace, pointData);

    return [pointData];
};
