'use strict';

var scatterHover = require('../scatter/hover');

function hoverPoints(pointData, xval, yval, hovermode) {
    var scatterPointData = scatterHover(pointData, xval, yval, hovermode);
    if(!scatterPointData || scatterPointData[0].index === false) return;

    var newPointData = scatterPointData[0];

    // hovering on fill case
    if(newPointData.index === undefined) {
        return scatterPointData;
    }

    var subplot = pointData.subplot;
    var cdi = newPointData.cd[newPointData.index];
    var trace = newPointData.trace;

    if(!subplot.isPtInside(cdi)) return;

    newPointData.xLabelVal = undefined;
    newPointData.yLabelVal = undefined;
    makeHoverPointText(cdi, trace, subplot, newPointData);
    newPointData.hovertemplate = trace.hovertemplate;
    return scatterPointData;
}

function makeHoverPointText(cdi, trace, subplot, pointData) {
    var radialAxis = subplot.radialAxis;
    var angularAxis = subplot.angularAxis;
    radialAxis._hovertitle = 're';
    angularAxis._hovertitle = 'im';

    var fullLayout = {};
    fullLayout[trace.subplot] = {_subplot: subplot};
    var labels = trace._module.formatLabels(cdi, trace, fullLayout);
    pointData.rLabel = labels.rLabel;
    pointData.thetaLabel = labels.thetaLabel;

    if(!trace.hovertemplate) {
        pointData.extraText = cdi.re + ' + ' + cdi.im + 'j';
    }
}

module.exports = {
    hoverPoints: hoverPoints,
    makeHoverPointText: makeHoverPointText
};
