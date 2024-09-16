'use strict';

var helpers = require('./helpers');
var calcHover = require('../scattergl/hover').calcHover;
var getFromId = require('../../plots/cartesian/axes').getFromId;
var extendFlat = require('../../lib/extend').extendFlat;

function hoverPoints(pointData, xval, yval, hovermode, opts) {
    if(!opts) opts = {};

    var hovermodeHasX = (hovermode || '').charAt(0) === 'x';
    var hovermodeHasY = (hovermode || '').charAt(0) === 'y';

    var points = _hoverPoints(pointData, xval, yval);

    if((hovermodeHasX || hovermodeHasY) && opts.hoversubplots === 'axis' && points[0]) {
        var subplotsWith = (
            hovermodeHasX ?
            pointData.xa :
            pointData.ya
        )._subplotsWith;

        var gd = opts.gd;

        var _pointData = extendFlat({}, pointData);

        for(var i = 0; i < subplotsWith.length; i++) {
            var spId = subplotsWith[i];

            // do not reselect on the initial subplot
            if(spId === (pointData.xa._id + pointData.ya._id)) continue;

            if(hovermodeHasY) {
                _pointData.xa = getFromId(gd, spId, 'x');
            } else { // hovermodeHasX
                _pointData.ya = getFromId(gd, spId, 'y');
            }

            var axisHoversubplots = hovermodeHasX || hovermodeHasY;
            var newPoints = _hoverPoints(_pointData, xval, yval, axisHoversubplots);

            points = points.concat(newPoints);
        }
    }

    return points;
}

function _hoverPoints(pointData, xval, yval, axisHoversubplots) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var scene = pointData.scene;
    var cdata = scene.matrixOptions.cdata;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var xpx = xa.c2p(xval);
    var ypx = ya.c2p(yval);
    var maxDistance = pointData.distance;

    var xi = helpers.getDimIndex(trace, xa);
    var yi = helpers.getDimIndex(trace, ya);
    if(xi === false || yi === false) return [pointData];

    var x = cdata[xi];
    var y = cdata[yi];

    var id, dxy;
    var minDist = maxDistance;

    for(var i = 0; i < x.length; i++) {
        if(axisHoversubplots && i !== pointData.index) continue;

        var ptx = x[i];
        var pty = y[i];
        var dx = xa.c2p(ptx) - xpx;
        var dy = ya.c2p(pty) - ypx;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if(axisHoversubplots || dist < minDist) {
            minDist = dxy = dist;
            id = i;
        }
    }

    pointData.index = id;
    pointData.distance = minDist;
    pointData.dxy = dxy;

    if(id === undefined) return [pointData];

    return [calcHover(pointData, x, y, trace)];
}

module.exports = {
    hoverPoints: hoverPoints
};
