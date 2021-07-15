'use strict';

var getTraceFromCd = require('../../lib/trace_from_cd');
var Axes = require('../../plots/cartesian/axes');
var scatterMapboxHoverPoints = require('../scattermapbox/hover').hoverPoints;
var getExtraText = require('../scattermapbox/hover').getExtraText;

module.exports = function hoverPoints(pointData, xval, yval) {
    var pts = scatterMapboxHoverPoints(pointData, xval, yval);
    if(!pts) return;

    var newPointData = pts[0];
    var cd = newPointData.cd;
    var trace = getTraceFromCd(cd);
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
