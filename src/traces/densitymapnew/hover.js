'use strict';

var Axes = require('../../plots/cartesian/axes');
var scatterMapHoverPoints = require('../scattermap/hover').hoverPoints;
var getExtraText = require('../scattermap/hover').getExtraText;

module.exports = function hoverPoints(pointData, xval, yval) {
    var pts = scatterMapHoverPoints(pointData, xval, yval);
    if(!pts) return;

    var newPointData = pts[0];
    var cd = newPointData.cd;
    var trace = cd[0].trace;
    var di = cd[newPointData.index];

    // let Fx.hover pick the color
    delete newPointData.color;

    if('z' in di) {
        var ax = newPointData.subplot.mockAxis;
        newPointData.z = di.z;
        newPointData.zLabel = Axes.tickText(ax, ax.c2l(di.z), 'hover').text;
    }

    newPointData.extraText = getExtraText(trace, di, cd[0].t.labels);

    return [newPointData];
};
