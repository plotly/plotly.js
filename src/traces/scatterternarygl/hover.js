'use strict';

const hover = require('../scattergl/hover');
const ternaryHover = require('../scatterternary/hover');

module.exports = function (pointData, xval, yval, hovermode) {
    const cd = pointData.cd;
    const stash = cd[0].t;

    const scatterPointData = hover.hoverPoints(pointData, xval, yval, hovermode);

    // scattergl may return pointData without an index when no point is found
    if (!scatterPointData || scatterPointData[0].index === undefined || scatterPointData[0].index === false) return;

    const point = scatterPointData[0];
    const i = point.index;
    const cdi = point.cd[i];

    cdi.a = stash.a[i];
    cdi.b = stash.b[i];
    cdi.c = stash.c[i];

    ternaryHover.formatPoint(scatterPointData, pointData);

    return scatterPointData;
};
