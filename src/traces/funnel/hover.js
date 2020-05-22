/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var opacity = require('../../components/color').opacity;
var hoverOnBars = require('../bar/hover').hoverOnBars;
var formatPercent = require('../../lib').formatPercent;

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var point = hoverOnBars(pointData, xval, yval, hovermode);
    if(!point) return;

    var cd = point.cd;
    var trace = cd[0].trace;
    var isHorizontal = (trace.orientation === 'h');

    // the closest data point
    var index = point.index;
    var di = cd[index];

    var sizeLetter = isHorizontal ? 'x' : 'y';
    point[sizeLetter + 'LabelVal'] = di.s;

    point.percentInitial = di.begR;
    point.percentInitialLabel = formatPercent(di.begR, 1);

    point.percentPrevious = di.difR;
    point.percentPreviousLabel = formatPercent(di.difR, 1);

    point.percentTotal = di.sumR;
    point.percentTotalLabel = formatPercent(di.sumR, 1);

    var hoverinfo = di.hi || trace.hoverinfo;
    var text = [];
    if(hoverinfo && hoverinfo !== 'none' && hoverinfo !== 'skip') {
        var isAll = (hoverinfo === 'all');
        var parts = hoverinfo.split('+');

        var hasFlag = function(flag) { return isAll || parts.indexOf(flag) !== -1; };

        if(hasFlag('percent initial')) {
            text.push(point.percentInitialLabel + ' of initial');
        }
        if(hasFlag('percent previous')) {
            text.push(point.percentPreviousLabel + ' of previous');
        }
        if(hasFlag('percent total')) {
            text.push(point.percentTotalLabel + ' of total');
        }
    }
    point.extraText = text.join('<br>');

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
