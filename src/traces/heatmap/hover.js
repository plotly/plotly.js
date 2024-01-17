'use strict';

var Fx = require('../../components/fx');
var Lib = require('../../lib');
var isArrayOrTypedArray = Lib.isArrayOrTypedArray;
var Axes = require('../../plots/cartesian/axes');
var extractOpts = require('../../components/colorscale').extractOpts;

module.exports = function hoverPoints(pointData, xval, yval, hovermode, opts) {
    if(!opts) opts = {};
    var isContour = opts.isContour;

    var cd0 = pointData.cd[0];
    var trace = cd0.trace;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var x = cd0.x;
    var y = cd0.y;
    var z = cd0.z;
    var xc = cd0.xCenter;
    var yc = cd0.yCenter;
    var zmask = cd0.zmask;
    var zhoverformat = trace.zhoverformat;
    var x2 = x;
    var y2 = y;

    var xl, yl, nx, ny;

    if(pointData.index !== false) {
        try {
            nx = Math.round(pointData.index[1]);
            ny = Math.round(pointData.index[0]);
        } catch(e) {
            Lib.error('Error hovering on heatmap, ' +
                'pointNumber must be [row,col], found:', pointData.index);
            return;
        }
        if(nx < 0 || nx >= z[0].length || ny < 0 || ny > z.length) {
            return;
        }
    } else if(Fx.inbox(xval - x[0], xval - x[x.length - 1], 0) > 0 ||
            Fx.inbox(yval - y[0], yval - y[y.length - 1], 0) > 0) {
        return;
    } else {
        if(isContour) {
            var i2;
            x2 = [2 * x[0] - x[1]];

            for(i2 = 1; i2 < x.length; i2++) {
                x2.push((x[i2] + x[i2 - 1]) / 2);
            }
            x2.push([2 * x[x.length - 1] - x[x.length - 2]]);

            y2 = [2 * y[0] - y[1]];
            for(i2 = 1; i2 < y.length; i2++) {
                y2.push((y[i2] + y[i2 - 1]) / 2);
            }
            y2.push([2 * y[y.length - 1] - y[y.length - 2]]);
        }
        nx = Math.max(0, Math.min(x2.length - 2, Lib.findBin(xval, x2)));
        ny = Math.max(0, Math.min(y2.length - 2, Lib.findBin(yval, y2)));
    }

    var x0 = xa.c2p(x[nx]);
    var x1 = xa.c2p(x[nx + 1]);
    var y0 = ya.c2p(y[ny]);
    var y1 = ya.c2p(y[ny + 1]);

    var _x, _y;
    if(isContour) {
        _x = cd0.orig_x || x;
        _y = cd0.orig_y || y;

        x1 = x0;
        xl = _x[nx];
        y1 = y0;
        yl = _y[ny];
    } else {
        _x = cd0.orig_x || xc || x;
        _y = cd0.orig_y || yc || y;

        xl = xc ? _x[nx] : ((_x[nx] + _x[nx + 1]) / 2);
        yl = yc ? _y[ny] : ((_y[ny] + _y[ny + 1]) / 2);

        if(xa && xa.type === 'category') xl = x[nx];
        if(ya && ya.type === 'category') yl = y[ny];

        if(trace.zsmooth) {
            x0 = x1 = xa.c2p(xl);
            y0 = y1 = ya.c2p(yl);
        }
    }

    var zVal = z[ny][nx];
    if(zmask && !zmask[ny][nx]) zVal = undefined;

    if(zVal === undefined && !trace.hoverongaps) return;

    var text;
    if(isArrayOrTypedArray(cd0.hovertext) && isArrayOrTypedArray(cd0.hovertext[ny])) {
        text = cd0.hovertext[ny][nx];
    } else if(isArrayOrTypedArray(cd0.text) && isArrayOrTypedArray(cd0.text[ny])) {
        text = cd0.text[ny][nx];
    }

    // dummy axis for formatting the z value
    var cOpts = extractOpts(trace);
    var dummyAx = {
        type: 'linear',
        range: [cOpts.min, cOpts.max],
        hoverformat: zhoverformat,
        _separators: xa._separators,
        _numFormat: xa._numFormat
    };
    var zLabel = Axes.tickText(dummyAx, zVal, 'hover').text;

    return [Lib.extendFlat(pointData, {
        index: trace._after2before ? trace._after2before[ny][nx] : [ny, nx],
        // never let a 2D override 1D type as closest point
        distance: pointData.maxHoverDistance,
        spikeDistance: pointData.maxSpikeDistance,
        x0: x0,
        x1: x1,
        y0: y0,
        y1: y1,
        xLabelVal: xl,
        yLabelVal: yl,
        zLabelVal: zVal,
        zLabel: zLabel,
        text: text
    })];
};
