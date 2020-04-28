/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var parseSvgPath = require('parse-svg-path');

var constants = require('./constants');
var CIRCLE_SIDES = constants.CIRCLE_SIDES;
var SQRT2 = constants.SQRT2;

var cartesianHelpers = require('../../../plots/cartesian/helpers');
var p2r = cartesianHelpers.p2r;
var r2p = cartesianHelpers.r2p;

var iC = [0, 3, 4, 5, 6, 1, 2];
var iQS = [0, 3, 4, 1, 2];

exports.writePaths = function(polygons) {
    var nI = polygons.length;
    if(!nI) return 'M0,0Z';

    var str = '';
    for(var i = 0; i < nI; i++) {
        var nJ = polygons[i].length;
        for(var j = 0; j < nJ; j++) {
            var w = polygons[i][j][0];
            if(w === 'Z') {
                str += 'Z';
            } else {
                var nK = polygons[i][j].length;
                for(var k = 0; k < nK; k++) {
                    var realK = k;
                    if(w === 'Q' || w === 'S') {
                        realK = iQS[k];
                    } else if(w === 'C') {
                        realK = iC[k];
                    }

                    str += polygons[i][j][realK];
                    if(k > 0 && k < nK - 1) {
                        str += ',';
                    }
                }
            }
        }
    }

    return str;
};

exports.readPaths = function(str, gd, plotinfo, isActiveShape) {
    var cmd = parseSvgPath(str);

    var polys = [];
    var n = -1;
    var newPoly = function() {
        n++;
        polys[n] = [];
    };

    var k;
    var x = 0;
    var y = 0;
    var initX;
    var initY;
    var recStart = function() {
        initX = x;
        initY = y;
    };

    recStart();
    for(var i = 0; i < cmd.length; i++) {
        var newPos = [];

        var x1, x2, y1, y2; // i.e. extra params for curves

        var c = cmd[i][0];
        var w = c;
        switch(c) {
            case 'M':
                newPoly();
                x = +cmd[i][1];
                y = +cmd[i][2];
                newPos.push([w, x, y]);

                recStart();
                break;

            case 'Q':
            case 'S':
                x1 = +cmd[i][1];
                y1 = +cmd[i][2];
                x = +cmd[i][3];
                y = +cmd[i][4];
                newPos.push([w, x, y, x1, y1]); // -> iQS order
                break;

            case 'C':
                x1 = +cmd[i][1];
                y1 = +cmd[i][2];
                x2 = +cmd[i][3];
                y2 = +cmd[i][4];
                x = +cmd[i][5];
                y = +cmd[i][6];
                newPos.push([w, x, y, x1, y1, x2, y2]); // -> iC order
                break;

            case 'T':
            case 'L':
                x = +cmd[i][1];
                y = +cmd[i][2];
                newPos.push([w, x, y]);
                break;

            case 'H':
                w = 'L'; // convert to line (for now)
                x = +cmd[i][1];
                newPos.push([w, x, y]);
                break;

            case 'V':
                w = 'L'; // convert to line (for now)
                y = +cmd[i][1];
                newPos.push([w, x, y]);
                break;

            case 'A':
                w = 'L'; // convert to line to handle circle
                var rx = +cmd[i][1];
                var ry = +cmd[i][2];
                if(!+cmd[i][4]) {
                    rx = -rx;
                    ry = -ry;
                }

                var cenX = x - rx;
                var cenY = y;
                for(k = 1; k <= CIRCLE_SIDES / 2; k++) {
                    var t = 2 * Math.PI * k / CIRCLE_SIDES;
                    newPos.push([
                        w,
                        cenX + rx * Math.cos(t),
                        cenY + ry * Math.sin(t)
                    ]);
                }
                break;

            case 'Z':
                if(x !== initX || y !== initY) {
                    x = initX;
                    y = initY;
                    newPos.push([w, x, y]);
                }
                break;
        }

        var domain = (plotinfo || {}).domain;
        var size = gd._fullLayout._size;
        var xPixelSized = plotinfo && plotinfo.xsizemode === 'pixel';
        var yPixelSized = plotinfo && plotinfo.ysizemode === 'pixel';
        var noOffset = isActiveShape === false;

        for(var j = 0; j < newPos.length; j++) {
            for(k = 0; k + 2 < 7; k += 2) {
                var _x = newPos[j][k + 1];
                var _y = newPos[j][k + 2];

                if(_x === undefined || _y === undefined) continue;
                // keep track of end point for Z
                x = _x;
                y = _y;

                if(plotinfo) {
                    if(plotinfo.xaxis && plotinfo.xaxis.p2r) {
                        if(noOffset) _x -= plotinfo.xaxis._offset;
                        if(xPixelSized) {
                            _x = r2p(plotinfo.xaxis, plotinfo.xanchor) + _x;
                        } else {
                            _x = p2r(plotinfo.xaxis, _x);
                        }
                    } else {
                        if(noOffset) _x -= size.l;
                        if(domain) _x = domain.x[0] + _x / size.w;
                        else _x = _x / size.w;
                    }

                    if(plotinfo.yaxis && plotinfo.yaxis.p2r) {
                        if(noOffset) _y -= plotinfo.yaxis._offset;
                        if(yPixelSized) {
                            _y = r2p(plotinfo.yaxis, plotinfo.yanchor) - _y;
                        } else {
                            _y = p2r(plotinfo.yaxis, _y);
                        }
                    } else {
                        if(noOffset) _y -= size.t;
                        if(domain) _y = domain.y[1] - _y / size.h;
                        else _y = 1 - _y / size.h;
                    }
                }

                newPos[j][k + 1] = _x;
                newPos[j][k + 2] = _y;
            }
            polys[n].push(
                newPos[j].slice()
            );
        }
    }

    return polys;
};

function almostEq(a, b) {
    return Math.abs(a - b) <= 1e-6;
}

function dist(a, b) {
    var dx = b[1] - a[1];
    var dy = b[2] - a[2];
    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}

exports.pointsShapeRectangle = function(cell) {
    var len = cell.length;
    if(len !== 5) return false;

    for(var j = 1; j < 3; j++) {
        var e01 = cell[0][j] - cell[1][j];
        var e32 = cell[3][j] - cell[2][j];

        if(!almostEq(e01, e32)) return false;

        var e03 = cell[0][j] - cell[3][j];
        var e12 = cell[1][j] - cell[2][j];
        if(!almostEq(e03, e12)) return false;
    }

    // N.B. rotated rectangles are not valid rects since rotation is not supported in shapes for now.
    if(
        !almostEq(cell[0][1], cell[1][1]) &&
        !almostEq(cell[0][1], cell[3][1])
    ) return false;

    // reject cases with zero area
    return !!(
        dist(cell[0], cell[1]) *
        dist(cell[0], cell[3])
    );
};

exports.pointsShapeEllipse = function(cell) {
    var len = cell.length;
    if(len !== CIRCLE_SIDES + 1) return false;

    // opposite diagonals should be the same
    len = CIRCLE_SIDES;
    for(var i = 0; i < len; i++) {
        var k = (len * 2 - i) % len;

        var k2 = (len / 2 + k) % len;
        var i2 = (len / 2 + i) % len;

        if(!almostEq(
            dist(cell[i], cell[i2]),
            dist(cell[k], cell[k2])
        )) return false;
    }
    return true;
};

exports.handleEllipse = function(isEllipse, start, end) {
    if(!isEllipse) return [start, end]; // i.e. case of line

    var pos = exports.ellipseOver({
        x0: start[0],
        y0: start[1],
        x1: end[0],
        y1: end[1]
    });

    var cx = (pos.x1 + pos.x0) / 2;
    var cy = (pos.y1 + pos.y0) / 2;
    var rx = (pos.x1 - pos.x0) / 2;
    var ry = (pos.y1 - pos.y0) / 2;

    // make a circle when one dimension is zero
    if(!rx) rx = ry = ry / SQRT2;
    if(!ry) ry = rx = rx / SQRT2;

    var cell = [];
    for(var i = 0; i < CIRCLE_SIDES; i++) {
        var t = i * 2 * Math.PI / CIRCLE_SIDES;
        cell.push([
            cx + rx * Math.cos(t),
            cy + ry * Math.sin(t),
        ]);
    }
    return cell;
};

exports.ellipseOver = function(pos) {
    var x0 = pos.x0;
    var y0 = pos.y0;
    var x1 = pos.x1;
    var y1 = pos.y1;

    var dx = x1 - x0;
    var dy = y1 - y0;

    x0 -= dx;
    y0 -= dy;

    var cx = (x0 + x1) / 2;
    var cy = (y0 + y1) / 2;

    var scale = SQRT2;
    dx *= scale;
    dy *= scale;

    return {
        x0: cx - dx,
        y0: cy - dy,
        x1: cx + dx,
        y1: cy + dy
    };
};
