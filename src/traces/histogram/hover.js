'use strict';

var getTraceFromCd = require('../../lib/trace_from_cd');
var barHover = require('../bar/hover').hoverPoints;
var hoverLabelText = require('../../plots/cartesian/axes').hoverLabelText;

module.exports = function hoverPoints(pointData, xval, yval, hovermode, opts) {
    var pts = barHover(pointData, xval, yval, hovermode, opts);

    if(!pts) return;

    pointData = pts[0];
    var di = pointData.cd[pointData.index];
    var trace = getTraceFromCd(pointData.cd);

    if(!trace.cumulative.enabled) {
        var posLetter = trace.orientation === 'h' ? 'y' : 'x';

        pointData[posLetter + 'Label'] = hoverLabelText(pointData[posLetter + 'a'], [di.ph0, di.ph1], trace[posLetter + 'hoverformat']);
    }

    return pts;
};
