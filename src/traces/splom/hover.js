'use strict';

var helpers = require('./helpers');
var calcHover = require('../scattergl/hover').calcHover;
var getFromId = require('../../plots/cartesian/axes').getFromId;
var extendFlat = require('../../lib/extend').extendFlat;

function hoverPoints(pointData, xval, yval, hovermode, opts) {
    if(!opts) opts = {};

    var hovermodeHasX = (hovermode || '').charAt(0) === 'x';
    var hovermodeHasY = (hovermode || '').charAt(0) === 'y';

    var xpx = pointData.xa.c2p(xval);
    var ypx = pointData.ya.c2p(yval);

    var points = _hoverPoints(pointData, xpx, ypx);

    if((hovermodeHasX || hovermodeHasY) && opts.hoversubplots === 'axis') {
        var _xpx = points[0]._xpx;
        var _ypx = points[0]._ypx;

        if(
            (hovermodeHasX && _xpx !== undefined) ||
            (hovermodeHasY && _ypx !== undefined)
        ) {
            var subplotsWith = (
                hovermodeHasX ?
                pointData.xa :
                pointData.ya
            )._subplotsWith;

            var gd = opts.gd;

            var _pointData = extendFlat({}, pointData);

            for(var i = 0; i < subplotsWith.length; i++) {
                var spId = subplotsWith[i];

                if(hovermodeHasY) {
                    _pointData.xa = getFromId(gd, spId, 'x');
                } else { // hovermodeHasX
                    _pointData.ya = getFromId(gd, spId, 'y');
                }

                var newPoints = _hoverPoints(_pointData, _xpx, _ypx, hovermodeHasX, hovermodeHasY);

                points = points.concat(newPoints);
            }
        }
    }

    return points;
}

function _hoverPoints(pointData, xpx, ypx, hoversubplotsX, hoversubplotsY) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var scene = pointData.scene;
    var cdata = scene.matrixOptions.cdata;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var maxDistance = pointData.distance;

    var xi = helpers.getDimIndex(trace, xa);
    var yi = helpers.getDimIndex(trace, ya);
    if(xi === false || yi === false) return [pointData];

    var x = cdata[xi];
    var y = cdata[yi];

    var id, dxy, _xpx, _ypx;
    var minDist = maxDistance;

    for(var i = 0; i < x.length; i++) {
        if((hoversubplotsX || hoversubplotsY) && i !== pointData.index) continue;

        var ptx = x[i];
        var pty = y[i];
        var thisXpx = xa.c2p(ptx);
        var thisYpx = ya.c2p(pty);

        var dx = thisXpx - xpx;
        var dy = thisYpx - ypx;
        var dist = 0;

        var pick = false;
        if(hoversubplotsX) {
            if(dx === 0) pick = true;
        } else if(hoversubplotsY) {
            if(dy === 0) pick = true;
        } else {
            dist = Math.sqrt(dx * dx + dy * dy);
            if(dist < minDist) pick = true;
        }

        if(pick) {
            minDist = dxy = dist;
            id = i;
            _xpx = thisXpx;
            _ypx = thisYpx;
        }
    }

    pointData.index = id;
    pointData.distance = minDist;
    pointData.dxy = dxy;

    if(id === undefined) return [pointData];

    var out = calcHover(pointData, x, y, trace);
    out._xpx = _xpx;
    out._ypx = _ypx;
    return [out];
}

module.exports = {
    hoverPoints: hoverPoints
};
