'use strict'

module.exports = hover

function hover (pointData, xval, yval, hovermode) {
	var cd = pointData.cd,
        trace = cd[0].trace,
        xa = pointData.xa,
        ya = pointData.ya,
        xpx = xa.c2p(xval),
        ypx = ya.c2p(yval),
        pt = [xpx, ypx],
        hoveron = trace.hoveron || '';

    // console.log(xpx, ypx, trace)
	// console.log(pointData, xval, yval, hovermode)
}
