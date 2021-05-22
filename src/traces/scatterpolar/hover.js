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
    radialAxis._hovertitle = 'r';
    angularAxis._hovertitle = 'θ';

    var fullLayout = {};
    fullLayout[trace.subplot] = {_subplot: subplot};
    var labels = trace._module.formatLabels(cdi, trace, fullLayout);
    pointData.rLabel = labels.rLabel;
    pointData.thetaLabel = labels.thetaLabel;

    var hoverinfo = cdi.hi || trace.hoverinfo;
    var text = [];
    function textPart(ax, val) {
        text.push(ax._hovertitle + ': ' + val);
    }

    if(!trace.hovertemplate) {
        var parts = hoverinfo.split('+');

        if(parts.indexOf('all') !== -1) parts = ['r', 'theta', 'text'];
        if(parts.indexOf('r') !== -1) textPart(radialAxis, pointData.rLabel);
        if(parts.indexOf('theta') !== -1) textPart(angularAxis, pointData.thetaLabel);

        if(parts.indexOf('text') !== -1 && pointData.text) {
            text.push(pointData.text);
            delete pointData.text;
        }

        pointData.extraText = text.join('<br>');
    }
}

module.exports = {
    hoverPoints: hoverPoints,
    makeHoverPointText: makeHoverPointText
};
