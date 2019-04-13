/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var hoverLabelText = require('../../plots/cartesian/axes').hoverLabelText;
var opacity = require('../../components/color').opacity;
var hoverOnBars = require('../bar/hover').hoverOnBars;

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var point = hoverOnBars(pointData, xval, yval, hovermode);
    if(!point) return;

    var cd = point.cd;
    var trace = cd[0].trace;
    var isHorizontal = (trace.orientation === 'h');

    var vAxis = isHorizontal ? pointData.xa : pointData.ya;

    function formatNumber(a) {
        return hoverLabelText(vAxis, a);
    }

    // the closest data point
    var index = point.index;
    var di = cd[index];

    var sizeLetter = isHorizontal ? 'x' : 'y';

    point[sizeLetter + 'LabelVal'] = di.s;

    // display ratio to initial value
    point.extraText = [
        formatNumber(100 * di.sumR |0) + '% of total',
        formatNumber(100 * di.difR |0) + '% of previous',
        formatNumber(100 * di.begR |0) + '% of initial'
    ].join('<br>');
    // TODO: Should we use pieHelpers.formatPieValue instead ?

    point.color = getTraceColor(trace, di);

    return [point];
};

function getTraceColor(trace, di) {
    var cont = trace.marker;
    var mc = di.mc || cont.color;
    var mlc = di.mlc || cont.line.color;
    var mlw = di.mlw || cont.line.width;
    if(opacity(mc)) return mc;
    else if(opacity(mlc) && mlw) return mlc;
}
