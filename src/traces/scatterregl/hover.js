'use strict'

var Lib = require('../../lib');
var Fx = require('../../components/fx');
var getTraceColor = require('../scatter/get_trace_color');
var ErrorBars = require('../../components/errorbars');
var MAXDIST = Fx.constants.MAXDIST;

module.exports = hover

function hover (pointData, xval, yval, hovermode) {
	var cd = pointData.cd,
        trace = cd[0].trace,
        xa = pointData.xa,
        ya = pointData.ya,
        xpx = xa.c2p(xval),
        ypx = ya.c2p(yval),
        pt = [xpx, ypx],
        hoveron = trace.hoveron || '',
        tree = trace._tree

    if (!tree) return [pointData]

    //FIXME: make sure this is a proper way to calc search radius
    var ids = tree.within(xval, yval, MAXDIST / xa._m)

    pointData.index = ids[0]

    if(pointData.index != null) {
        // the closest data point
        var di = cd[pointData.index],
            xc = xa.c2p(di.x, true),
            yc = ya.c2p(di.y, true),
            rad = di.mrc || 1;

        Lib.extendFlat(pointData, {
            color: getTraceColor(trace, di),

            x0: xc - rad,
            x1: xc + rad,
            xLabelVal: di.x,

            y0: yc - rad,
            y1: yc + rad,
            yLabelVal: di.y
        });

        if(di.htx) pointData.text = di.htx;
        else if(trace.hovertext) pointData.text = trace.hovertext;
        else if(di.tx) pointData.text = di.tx;
        else if(trace.text) pointData.text = trace.text;

        ErrorBars.hoverInfo(di, trace, pointData);

        return [pointData];
    }

    return [pointData]
}
