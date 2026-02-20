'use strict';

var Lib = require('../../lib');
var Fx = require('../../components/fx');
var getTraceColor = require('../scatter/get_trace_color');

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var xpx = xa.c2p(xval);
    var ypx = ya.c2p(yval);

    var distfn = function(di) {
        var x = xa.c2p(di.x) - xpx;
        var y = ya.c2p(di.y) - ypx;
        return Math.sqrt(x * x + y * y);
    };

    Fx.getClosest(cd, distfn, pointData);

    // skip if we didn't find a close point
    if(pointData.index === false) return;

    // the closest data point
    var di = cd[pointData.index];
    var xc = xa.c2p(di.x, true);
    var yc = ya.c2p(di.y, true);

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

        spikeDistance: Math.sqrt((xpx - xc) * (xpx - xc) + (ypx - yc) * (ypx - yc)),
        hovertemplate: trace.hovertemplate
    });

    Lib.fillText(di, trace, pointData);

    return [pointData];
};
