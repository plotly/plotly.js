/**
* Copyright 2012-2019, Plotly, Inc.
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

    var hoverinfo = trace.hoverinfo;
    if(hoverinfo !== 'none' && hoverinfo !== 'skip') {
        var parts = (hoverinfo || '').split('+');
        var isAll = (hoverinfo === 'all') || (hoverinfo === undefined);
        var hasFlag = function(flag) { return isAll || parts.indexOf(flag) !== -1; };

        if(hasFlag('percentInitial')) point.percentInitial = formatPercent(di.begR, 1);
        if(hasFlag('percentPrevious')) point.percentPrevious = formatPercent(di.difR, 1);
        if(hasFlag('percentTotal')) point.percentTotal = formatPercent(di.sumR, 1);
    }

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
