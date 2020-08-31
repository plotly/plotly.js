/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Fx = require('../../components/fx');
var Lib = require('../../lib');
var constants = require('./constants');

module.exports = function hoverPoints(pointData, xval, yval) {
    var cd0 = pointData.cd[0];
    var trace = cd0.trace;
    var xa = pointData.xa;
    var ya = pointData.ya;

    // Return early if not on image
    if(Fx.inbox(xval - cd0.x0, xval - (cd0.x0 + cd0.w * trace.dx), 0) > 0 ||
            Fx.inbox(yval - cd0.y0, yval - (cd0.y0 + cd0.h * trace.dy), 0) > 0) {
        return;
    }

    // Find nearest pixel's index
    var nx = Math.floor((xval - cd0.x0) / trace.dx);
    var ny = Math.floor(Math.abs(yval - cd0.y0) / trace.dy);

    var pixel;
    if(trace._hasZ) {
        pixel = cd0.z[ny][nx];
    } else if(trace._hasSource) {
        pixel = trace._canvas.el.getContext('2d').getImageData(nx, ny, 1, 1).data;
    }

    // return early if pixel is undefined
    if(!pixel) return;

    var hoverinfo = cd0.hi || trace.hoverinfo;
    var fmtColor;
    if(hoverinfo) {
        var parts = hoverinfo.split('+');
        if(parts.indexOf('all') !== -1) parts = ['color'];
        if(parts.indexOf('color') !== -1) fmtColor = true;
    }

    var cr = constants.colormodel[trace.colormodel];
    var colormodel = cr.colormodel || trace.colormodel;
    var dims = colormodel.length;
    var c = trace._scaler(pixel);
    var s = cr.suffix;

    var colorstring = [];
    if(trace.hovertemplate || fmtColor) {
        colorstring.push('[' + [c[0] + s[0], c[1] + s[1], c[2] + s[2]].join(', '));
        if(dims === 4) colorstring.push(', ' + c[3] + s[3]);
        colorstring.push(']');
        colorstring = colorstring.join('');
        pointData.extraText = colormodel.toUpperCase() + ': ' + colorstring;
    }

    var text;
    if(Array.isArray(trace.hovertext) && Array.isArray(trace.hovertext[ny])) {
        text = trace.hovertext[ny][nx];
    } else if(Array.isArray(trace.text) && Array.isArray(trace.text[ny])) {
        text = trace.text[ny][nx];
    }

    // TODO: for color model with 3 dims, display something useful for hovertemplate `%{color[3]}`
    var py = ya.c2p(cd0.y0 + (ny + 0.5) * trace.dy);
    var xVal = cd0.x0 + (nx + 0.5) * trace.dx;
    var yVal = cd0.y0 + (ny + 0.5) * trace.dy;
    var zLabel = '[' + pixel.slice(0, trace.colormodel.length).join(', ') + ']';
    return [Lib.extendFlat(pointData, {
        index: [ny, nx],
        x0: xa.c2p(cd0.x0 + nx * trace.dx),
        x1: xa.c2p(cd0.x0 + (nx + 1) * trace.dx),
        y0: py,
        y1: py,
        color: c,
        xVal: xVal,
        xLabelVal: xVal,
        yVal: yVal,
        yLabelVal: yVal,
        zLabelVal: zLabel,
        text: text,
        hovertemplateLabels: {
            'zLabel': zLabel,
            'colorLabel': colorstring,
            'color[0]Label': c[0] + s[0],
            'color[1]Label': c[1] + s[1],
            'color[2]Label': c[2] + s[2],
            'color[3]Label': c[3] + s[3]
        }
    })];
};
